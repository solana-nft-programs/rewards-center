use anchor_spl::token::{Token, TokenAccount};
use cardinal_payment_manager::{program::CardinalPaymentManager, state::PaymentManager};
use cardinal_stake_pool::state::StakeEntry;

use {
    crate::{errors::ErrorCode, state::*},
    anchor_lang::prelude::*,
};

#[derive(Accounts)]
pub struct CreateRewardReceiptCtx<'info> {
    #[account(mut, constraint = reward_receipt.receipt_manager == receipt_manager.key() && reward_receipt.receipt_entry == receipt_entry.key() @ ErrorCode::InvalidRewardReceipt)]
    reward_receipt: Box<Account<'info, RewardReceipt>>,
    #[account(mut)]
    receipt_manager: Box<Account<'info, ReceiptManager>>,
    #[account(constraint = stake_entry.pool == receipt_manager.stake_pool @ ErrorCode::InvalidStakeEntry)]
    stake_entry: Box<Account<'info, StakeEntry>>,

    #[account(mut, constraint = receipt_entry.stake_entry == stake_entry.key() @ ErrorCode::InvalidReceiptEntry)]
    receipt_entry: Box<Account<'info, ReceiptEntry>>,

    // payment manager info
    #[account(mut, constraint = payment_manager.key() == receipt_manager.payment_manager @ ErrorCode::InvalidPaymentManager)]
    payment_manager: Box<Account<'info, PaymentManager>>,
    #[account(mut)]
    fee_collector_token_account: Box<Account<'info, TokenAccount>>,
    #[account(mut, constraint = payment_recipient_token_account.owner == receipt_manager.payment_recipient @ ErrorCode::InvalidPaymentTokenAccount)]
    payment_recipient_token_account: Box<Account<'info, TokenAccount>>,
    #[account(mut, constraint = payer_token_account.mint == receipt_manager.payment_mint && payer_token_account.owner == payer.key() @ ErrorCode::InvalidPayerTokenAcount)]
    payer_token_account: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    payer: Signer<'info>,
    #[account(mut, constraint = stake_entry.last_staker == claimer.key() @ ErrorCode::InvalidClaimer)]
    claimer: Signer<'info>,

    cardinal_payment_manager: Program<'info, CardinalPaymentManager>,
    token_program: Program<'info, Token>,
    system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CreateRewardReceiptCtx>) -> Result<()> {
    let reward_receipt = &mut ctx.accounts.reward_receipt;

    if reward_receipt.target != Pubkey::default() {
        return Err(error!(ErrorCode::RewardReceiptAlreadyClaimed));
    }

    reward_receipt.target = ctx.accounts.claimer.key();
    // increment counter
    ctx.accounts.receipt_manager.claimed_receipts_counter = ctx.accounts.receipt_manager.claimed_receipts_counter.checked_add(1).expect("Add error");

    if ctx.accounts.receipt_manager.requires_authorization && !reward_receipt.allowed {
        return Err(error!(ErrorCode::RewardReceiptIsNotAllowed));
    }

    if ctx.accounts.stake_entry.total_stake_seconds < ctx.accounts.receipt_manager.required_stake_seconds {
        return Err(error!(ErrorCode::RewardSecondsNotSatisfied));
    }

    let receipt_manager = &mut ctx.accounts.receipt_manager;
    if let Some(max_reward_receipts) = receipt_manager.max_claimed_receipts {
        if max_reward_receipts == receipt_manager.claimed_receipts_counter {
            return Err(error!(ErrorCode::MaxNumberOfReceiptsExceeded));
        }
    }

    // add to used seconds
    let receipt_entry = &mut ctx.accounts.receipt_entry;
    receipt_entry.used_stake_seconds = receipt_entry.used_stake_seconds.checked_add(ctx.accounts.receipt_manager.stake_seconds_to_use).expect("Add error");

    if receipt_entry.used_stake_seconds > ctx.accounts.stake_entry.total_stake_seconds {
        return Err(error!(ErrorCode::InsufficientAvailableStakeSeconds));
    }
    // same check as ^^
    // if ctx.accounts.receipt_manager.stake_seconds_to_use != 0
    //     && ctx
    //         .accounts
    //         .stake_entry
    //         .total_stake_seconds
    //         .checked_sub(ctx.accounts.receipt_entry.used_stake_seconds)
    //         .expect("Sub error")
    //         < ctx.accounts.receipt_manager.stake_seconds_to_use
    // {
    //     return Err(error!(ErrorCode::InsufficientAvailableStakeSeconds));
    // }

    // handle payment
    let payment_mints = get_payment_mints();
    let payment_mint = &ctx.accounts.receipt_manager.payment_mint.to_string()[..];
    let payment_amount = payment_mints.get(payment_mint).expect("Could not fetch payment amount");
    let cpi_accounts = cardinal_payment_manager::cpi::accounts::HandlePaymentCtx {
        payment_manager: ctx.accounts.payment_manager.to_account_info(),
        payer_token_account: ctx.accounts.payer_token_account.to_account_info(),
        fee_collector_token_account: ctx.accounts.fee_collector_token_account.to_account_info(),
        payment_token_account: ctx.accounts.payment_recipient_token_account.to_account_info(),
        payer: ctx.accounts.payer.to_account_info(),
        token_program: ctx.accounts.token_program.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(ctx.accounts.cardinal_payment_manager.to_account_info(), cpi_accounts);
    cardinal_payment_manager::cpi::manage_payment(cpi_ctx, *payment_amount)?;

    Ok(())
}
