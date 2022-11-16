use crate::errors::ErrorCode;
use anchor_lang::prelude::*;
use anchor_spl::token::TokenAccount;
use cardinal_payment_manager::program::CardinalPaymentManager;
use std::collections::HashMap;
use std::slice::Iter;
use std::str::FromStr;

pub const STAKE_POOL_PREFIX: &str = "stake-pool";
#[account]
pub struct StakePool {
    pub bump: u8,
    pub authority: Pubkey,
    pub total_staked: u32,
    pub reset_on_unstake: bool,
    pub cooldown_seconds: Option<u32>,
    pub min_stake_seconds: Option<u32>,
    pub end_date: Option<i64>,
    pub stake_payment_amount: Option<u64>,
    pub unstake_payment_amount: Option<u64>,
    pub payment_mint: Option<Pubkey>,
    pub payment_manager: Option<Pubkey>,
    pub payment_recipient: Option<Pubkey>,
    pub requires_authorization: bool,
    pub allowed_creators: Vec<Pubkey>,
    pub allowed_collections: Vec<Pubkey>,
    pub identifier: String,
}

pub fn assert_stake_pool_payment_info(payment_mint: &Pubkey, _payment_amount: u64, payment_manager: &Pubkey) -> Result<()> {
    let payment_mints = HashMap::from([
        ("DUSTawucrTsGU8hcqRdHDCbuYhCPADMLM2VcCb8VnFnQ", 1_u64.pow(9)),
        ("So11111111111111111111111111111111111111112", 2_000_000),
    ]);
    if !payment_mints.contains_key(payment_mint.to_string().as_str()) {
        return Err(error!(ErrorCode::InvalidPaymentMint));
    }
    if payment_manager.to_string() != Pubkey::from_str("CuEDMUqgkGTVcAaqEDHuVR848XN38MPsD11JrkxcGD6a").unwrap().to_string() {
        return Err(error!(ErrorCode::InvalidPaymentManager));
    }
    Ok(())
}

pub fn handle_stake_pool_payment<'info>(
    payment_mint: Pubkey,
    payment_amount: u64,
    payment_manager: Pubkey,
    payment_recipient: Pubkey,
    token_program: &AccountInfo<'info>,
    remaining_accounts: &mut Iter<AccountInfo<'info>>,
) -> Result<()> {
    if payment_amount == 0 {
        return Ok(());
    }
    let payment_manager_account_info = next_account_info(remaining_accounts)?;
    assert_eq!(payment_manager, payment_manager_account_info.key());

    let payer_token_account_info = next_account_info(remaining_accounts)?;
    let payer_token_account = Account::<TokenAccount>::try_from(payer_token_account_info)?;
    assert_eq!(payer_token_account.mint, payment_mint);

    let fee_collector_token_account_info = next_account_info(remaining_accounts)?;

    let payment_token_account_info = next_account_info(remaining_accounts)?;
    let payment_token_account = Account::<TokenAccount>::try_from(payment_token_account_info)?;
    assert_eq!(payment_token_account.mint, payment_mint);
    assert_eq!(payment_token_account.owner, payment_recipient);

    let payer = next_account_info(remaining_accounts)?;
    let cardinal_payment_manager = next_account_info(remaining_accounts)?;
    assert_eq!(CardinalPaymentManager::id(), cardinal_payment_manager.key());

    assert_stake_pool_payment_info(&payment_mint, payment_amount, &payment_manager)?;
    let cpi_accounts = cardinal_payment_manager::cpi::accounts::HandlePaymentCtx {
        payment_manager: payment_manager_account_info.to_account_info(),
        payer_token_account: payer_token_account_info.to_account_info(),
        fee_collector_token_account: fee_collector_token_account_info.to_account_info(),
        payment_token_account: payment_token_account_info.to_account_info(),
        payer: payer.to_account_info(),
        token_program: token_program.clone(),
    };
    let cpi_ctx = CpiContext::new(cardinal_payment_manager.to_account_info(), cpi_accounts);
    cardinal_payment_manager::cpi::manage_payment(cpi_ctx, payment_amount)?;
    Ok(())
}
