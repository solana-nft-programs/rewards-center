use crate::errors::ErrorCode;
use anchor_lang::prelude::*;
use anchor_lang::Result;
use anchor_spl::token;
use anchor_spl::token::TokenAccount;
use anchor_spl::token::Transfer;
use lazy_static::lazy_static;
use solana_program::program::invoke;
use solana_program::system_instruction::transfer;
use solana_program::system_program;
use std::cmp::Eq;
use std::collections::HashMap;
use std::slice::Iter;

pub const BASIS_POINTS_DIVISOR: u64 = 10_000;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Eq, PartialEq)]
pub struct PaymentShare {
    pub address: Pubkey,
    pub basis_points: u16,
}

// this gets resized on add and remove of shares
pub const DEFAULT_PAYMENT_INFO_SIZE: usize = 8 + std::mem::size_of::<PaymentInfo>();
pub const PAYMENT_INFO_PREFIX: &str = "payment-info";
#[account]
pub struct PaymentInfo {
    pub bump: u8,
    pub authority: Pubkey,
    pub identifier: String,
    pub payment_amount: u64,
    pub payment_mint: Pubkey,
    pub payment_shares: Vec<PaymentShare>,
}

pub enum Action {
    Stake = 0,
    Unstake,
    ClaimRewards,
    ClaimRewardReceipt,
    BoostStakeEntry,
}

lazy_static! {
    static ref DEFAULT_ACTIONS: HashMap<u8, String> = HashMap::from([
        (Action::Stake as u8, "FQJ2czigCYygS8v8trLU7TBAi7NjRN1h1C2vLAh2GYDi".to_string()),
        (Action::Unstake as u8, "FQJ2czigCYygS8v8trLU7TBAi7NjRN1h1C2vLAh2GYDi".to_string()),
        (Action::ClaimRewards as u8, "FQJ2czigCYygS8v8trLU7TBAi7NjRN1h1C2vLAh2GYDi".to_string()),
        (Action::ClaimRewardReceipt as u8, "FQJ2czigCYygS8v8trLU7TBAi7NjRN1h1C2vLAh2GYDi".to_string()),
        (Action::BoostStakeEntry as u8, "FQJ2czigCYygS8v8trLU7TBAi7NjRN1h1C2vLAh2GYDi".to_string()),
    ]);
    static ref OVERRIDES: HashMap<(String, u8), String> = HashMap::from([]);
}

pub fn assert_payment_info(stake_pool: Pubkey, action: Action, payment_info: Pubkey) -> Result<()> {
    let action_id = action as u8;
    let mut expected_payment_info = DEFAULT_ACTIONS.get(&action_id).expect("Invalid action");
    if OVERRIDES.contains_key(&(stake_pool.key().to_string(), action_id)) {
        expected_payment_info = OVERRIDES.get(&(stake_pool.key().to_string(), action_id)).expect("Invalid override")
    }
    if expected_payment_info.to_string() != payment_info.to_string() {
        return Err(error!(ErrorCode::InvalidPaymentManager));
    }
    Ok(())
}

pub fn handle_payment_info<'info>(payment_info: Pubkey, remaining_accounts: &mut Iter<AccountInfo<'info>>) -> Result<()> {
    // check payment info
    let payment_info_account_info = next_account_info(remaining_accounts)?;
    assert_eq!(payment_info, payment_info_account_info.key());
    let payment_info_account = Account::<PaymentInfo>::try_from(payment_info_account_info)?;
    handle_payment(
        payment_info_account.payment_amount,
        payment_info_account.payment_mint,
        &payment_info_account.payment_shares,
        remaining_accounts,
    )
}

pub fn handle_payment<'info>(payment_amount: u64, payment_mint: Pubkey, payment_shares: &Vec<PaymentShare>, remaining_accounts: &mut Iter<AccountInfo<'info>>) -> Result<()> {
    // check amount
    if payment_amount == 0 {
        return Ok(());
    }

    let payer = next_account_info(remaining_accounts)?;

    // token or system program
    let transfer_program: &AccountInfo = if payment_mint == Pubkey::default() {
        let transfer_program = next_account_info(remaining_accounts)?;
        if !system_program::check_id(&transfer_program.key()) {
            return Err(error!(ErrorCode::InvalidTransferProgram));
        }
        transfer_program
    } else {
        let transfer_program = next_account_info(remaining_accounts)?;
        if transfer_program.key() != token::ID {
            return Err(error!(ErrorCode::InvalidTransferProgram));
        }
        transfer_program
    };

    // payer token account if needed
    let mut payer_token_account: Option<Account<TokenAccount>> = None;
    if payment_mint != Pubkey::default() {
        let payer_token_account_info = next_account_info(remaining_accounts)?;
        let payer_token_account_data = Account::<TokenAccount>::try_from(payer_token_account_info)?;
        if payer_token_account_data.owner != payer.key() || payer_token_account_data.mint != payment_mint.key() {
            return Err(error!(ErrorCode::InvalidPayerTokenAccount));
        }
        payer_token_account = Some(payer_token_account_data);
    }

    let collectors = &payment_shares;
    let share_amounts: Vec<u64> = collectors
        .clone()
        .into_iter()
        .map(|s| payment_amount.checked_mul(u64::try_from(s.basis_points).expect("Could not cast u8 to u64")).unwrap())
        .collect();
    let share_amounts_sum: u64 = share_amounts.iter().sum();

    // remainder is distributed to first collectors
    let mut remainder = payment_amount.checked_sub(share_amounts_sum.checked_div(BASIS_POINTS_DIVISOR).expect("Div error")).expect("Sub error");
    for payment_share in payment_shares {
        if payment_share.basis_points != 0 {
            let remainder_amount = u64::from(remainder > 0);
            let payment_share_amount = payment_amount
                .checked_mul(u64::try_from(payment_share.basis_points).expect("Could not cast u8 to u64"))
                .unwrap()
                .checked_div(BASIS_POINTS_DIVISOR)
                .expect("Div error")
                .checked_add(remainder_amount) // add remainder amount
                .expect("Add error");
            remainder = remainder.checked_sub(remainder_amount).expect("Sub error");

            let payment_share_account_info = next_account_info(remaining_accounts)?;
            if payment_mint == Pubkey::default() {
                // native sol
                if payment_share_account_info.key() != payment_share.address {
                    return Err(error!(ErrorCode::InvalidPaymentShare));
                }
                if payment_share_amount > 0 {
                    invoke(
                        &transfer(&payer.key(), &payment_share_account_info.key(), payment_share_amount),
                        &[payer.to_account_info(), payment_share_account_info.to_account_info(), transfer_program.to_account_info()],
                    )?;
                }
            } else {
                // any spl token
                let payment_share_token_account = Account::<TokenAccount>::try_from(payment_share_account_info)?;
                if payment_share_token_account.owner != payment_share.address || payment_share_token_account.mint != payment_mint.key() {
                    return Err(error!(ErrorCode::InvalidTokenAccount));
                }
                if payment_share_amount > 0 {
                    let cpi_accounts = Transfer {
                        from: payer_token_account.clone().expect("Invalid payer token account").to_account_info(),
                        to: payment_share_account_info.to_account_info(),
                        authority: payer.to_account_info(),
                    };
                    let cpi_context = CpiContext::new(transfer_program.to_account_info(), cpi_accounts);
                    token::transfer(cpi_context, payment_share_amount)?;
                }
            }
        }
    }

    Ok(())
}
