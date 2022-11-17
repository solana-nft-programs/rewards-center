use crate::errors::ErrorCode;
use crate::reward_receipts::ReceiptManager;
use crate::reward_receipts::RewardReceipt;
use crate::StakeEntry;
use anchor_lang::prelude::*;
use anchor_spl::token::Token;
use anchor_spl::token::TokenAccount;
use cardinal_payment_manager::program::CardinalPaymentManager;
use cardinal_payment_manager::state::PaymentManager;

#[derive(Accounts)]
pub struct ClaimRewardReceiptCtx<'info> {
    #[account(mut, constraint = reward_receipt.receipt_manager == receipt_manager.key() && reward_receipt.stake_entry == stake_entry.key() @ ErrorCode::InvalidRewardReceipt)]
    reward_receipt: Box<Account<'info, RewardReceipt>>,
    #[account(mut)]
    receipt_manager: Box<Account<'info, ReceiptManager>>,
    #[account(mut, constraint = stake_entry.pool == receipt_manager.stake_pool @ ErrorCode::InvalidStakeEntry)]
    stake_entry: Box<Account<'info, StakeEntry>>,

    // payment manager info
    #[account(mut, constraint = payment_manager.key() == receipt_manager.payment_manager @ ErrorCode::InvalidPaymentManager)]
    payment_manager: Box<Account<'info, PaymentManager>>,
    #[account(mut)]
    fee_collector_token_account: Box<Account<'info, TokenAccount>>,
    #[account(mut, constraint = payment_recipient_token_account.mint == receipt_manager.payment_mint && payment_recipient_token_account.owner == receipt_manager.payment_recipient @ ErrorCode::InvalidPaymentTokenAccount)]
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

pub fn handler(ctx: Context<ClaimRewardReceiptCtx>) -> Result<()> {
    let reward_receipt = &mut ctx.accounts.reward_receipt;

    if reward_receipt.target != Pubkey::default() {
        return Err(error!(ErrorCode::RewardReceiptAlreadyClaimed));
    }
    if ctx.accounts.receipt_manager.requires_authorization && !reward_receipt.allowed {
        return Err(error!(ErrorCode::RewardReceiptIsNotAllowed));
    }
    if ctx.accounts.stake_entry.total_stake_seconds < ctx.accounts.receipt_manager.required_stake_seconds {
        return Err(error!(ErrorCode::RewardSecondsNotSatisfied));
    }

    reward_receipt.target = ctx.accounts.claimer.key();
    ctx.accounts.receipt_manager.claimed_receipts_counter = ctx.accounts.receipt_manager.claimed_receipts_counter.checked_add(1).expect("Add error");

    let receipt_manager = &mut ctx.accounts.receipt_manager;
    if let Some(max_reward_receipts) = receipt_manager.max_claimed_receipts {
        if max_reward_receipts == receipt_manager.claimed_receipts_counter {
            return Err(error!(ErrorCode::MaxNumberOfReceiptsExceeded));
        }
    }

    // add to used seconds
    let stake_entry = &mut ctx.accounts.stake_entry;
    stake_entry.used_stake_seconds = stake_entry.used_stake_seconds.checked_add(ctx.accounts.receipt_manager.stake_seconds_to_use).expect("Add error");

    if stake_entry.used_stake_seconds > ctx.accounts.stake_entry.total_stake_seconds {
        return Err(error!(ErrorCode::InsufficientAvailableStakeSeconds));
    }

    // handle payment
    let cpi_accounts = cardinal_payment_manager::cpi::accounts::HandlePaymentCtx {
        payment_manager: ctx.accounts.payment_manager.to_account_info(),
        payer_token_account: ctx.accounts.payer_token_account.to_account_info(),
        fee_collector_token_account: ctx.accounts.fee_collector_token_account.to_account_info(),
        payment_token_account: ctx.accounts.payment_recipient_token_account.to_account_info(),
        payer: ctx.accounts.payer.to_account_info(),
        token_program: ctx.accounts.token_program.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(ctx.accounts.cardinal_payment_manager.to_account_info(), cpi_accounts);
    cardinal_payment_manager::cpi::manage_payment(cpi_ctx, ctx.accounts.receipt_manager.payment_amount)?;

    Ok(())
}
