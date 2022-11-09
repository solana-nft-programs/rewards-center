use {
    crate::{errors::ErrorCode, state::*},
    anchor_lang::prelude::*,
    anchor_spl::token::{Mint, Token, TokenAccount},
    cardinal_token_manager::{program::CardinalTokenManager, state::TokenManager},
};

#[derive(Accounts)]
pub struct ReturnReceiptMintCtx<'info> {
    stake_entry: Box<Account<'info, StakeEntry>>,

    #[account(mut)]
    receipt_mint: Box<Account<'info, Mint>>,

    #[account(mut)]
    token_manager: Box<Account<'info, TokenManager>>,
    #[account(mut)]
    token_manager_token_account: Box<Account<'info, TokenAccount>>,

    // recipient
    #[account(mut, constraint = user_receipt_mint_token_account.owner == user.key() && user_receipt_mint_token_account.mint == receipt_mint.key() @ ErrorCode::InvalidReceiptMint)]
    user_receipt_mint_token_account: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    user: Signer<'info>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    collector: UncheckedAccount<'info>,

    token_program: Program<'info, Token>,
    token_manager_program: Program<'info, CardinalTokenManager>,
    rent: Sysvar<'info, Rent>,
}

pub fn handler<'key, 'accounts, 'remaining, 'info>(ctx: Context<'key, 'accounts, 'remaining, 'info, ReturnReceiptMintCtx<'info>>) -> Result<()> {
    let stake_entry = &mut ctx.accounts.stake_entry;
    let user_receipt_mint_token_account = &mut ctx.accounts.user_receipt_mint_token_account;

    if user_receipt_mint_token_account.amount > 0 && (stake_entry.stake_mint_claimed || stake_entry.original_mint_claimed) {
        if stake_entry.original_mint == ctx.accounts.receipt_mint.key() {
            stake_entry.original_mint_claimed = false;
        } else if ctx.accounts.receipt_mint.key() == stake_entry.stake_mint.unwrap() {
            stake_entry.stake_mint_claimed = false;
        } else {
            return Err(error!(ErrorCode::InvalidReceiptMint));
        }

        let cpi_accounts = cardinal_token_manager::cpi::accounts::InvalidateCtx {
            token_manager: ctx.accounts.token_manager.to_account_info(),
            token_manager_token_account: ctx.accounts.token_manager_token_account.to_account_info(),
            mint: ctx.accounts.receipt_mint.to_account_info(),
            recipient_token_account: ctx.accounts.user_receipt_mint_token_account.to_account_info(),
            invalidator: ctx.accounts.user.to_account_info(),
            collector: ctx.accounts.collector.to_account_info(),
            token_program: ctx.accounts.token_program.to_account_info(),
            rent: ctx.accounts.rent.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(ctx.accounts.token_manager_program.to_account_info(), cpi_accounts).with_remaining_accounts(ctx.remaining_accounts.to_vec());
        cardinal_token_manager::cpi::invalidate(cpi_ctx)?;
    }

    Ok(())
}
