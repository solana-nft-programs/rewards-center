use anchor_spl::token::Approve;
use cardinal_payment_manager::program::CardinalPaymentManager;
use mpl_token_metadata::instruction::freeze_delegated_account;
use solana_program::program::invoke_signed;

use crate::instructions::mint_is_allowed;
use crate::instructions::stake_entry::increment_total_stake_seconds;

use crate::errors::ErrorCode;
use crate::state::*;
use anchor_lang::prelude::*;
use anchor_spl::token::Mint;
use anchor_spl::token::Token;
use anchor_spl::token::TokenAccount;
use anchor_spl::token::{self};

#[derive(Accounts)]
pub struct StakeEditionCtx<'info> {
    #[account(mut, seeds = [STAKE_ENTRY_PREFIX.as_bytes(), stake_entry.pool.as_ref(), stake_entry.stake_mint.as_ref(), get_stake_seed(stake_mint.supply, user.key()).as_ref()], bump=stake_entry.bump)]
    stake_entry: Box<Account<'info, StakeEntry>>,

    #[account(mut, constraint = stake_entry.pool == stake_pool.key() @ ErrorCode::InvalidStakePool)]
    stake_pool: Box<Account<'info, StakePool>>,

    stake_mint: Box<Account<'info, Mint>>,
    /// CHECK: Checked in handler
    stake_mint_edition: UncheckedAccount<'info>,
    /// CHECK: Checked in handler
    stake_mint_metadata: UncheckedAccount<'info>,

    #[account(mut)]
    user: Signer<'info>,
    /// CHECK: Checked in handler
    #[account(mut)]
    user_escrow: UncheckedAccount<'info>,
    #[account(mut, constraint =
        user_stake_mint_token_account.amount > 0
        && user_stake_mint_token_account.mint == stake_entry.stake_mint
        && user_stake_mint_token_account.owner == user.key()
        @ ErrorCode::InvalidUserOriginalMintTokenAccount
    )]
    user_stake_mint_token_account: Box<Account<'info, TokenAccount>>,

    /// CHECK: Address checked
    #[account(address = mpl_token_metadata::id())]
    token_metadata_program: UncheckedAccount<'info>,
    token_program: Program<'info, Token>,
    system_program: Program<'info, System>,
}

pub fn handler<'key, 'accounts, 'remaining, 'info>(ctx: Context<'key, 'accounts, 'remaining, 'info, StakeEditionCtx<'info>>, amount: u64) -> Result<()> {
    let stake_pool = &mut ctx.accounts.stake_pool;
    let stake_entry = &mut ctx.accounts.stake_entry;

    let user = ctx.accounts.user.key();
    let user_escrow = ctx.accounts.user_escrow.key();
    let escrow_seeds = get_escrow_seeds(&stake_pool.key(), &user, &user_escrow)?;

    if stake_pool.end_date.is_some() && Clock::get().unwrap().unix_timestamp > stake_pool.end_date.unwrap() {
        return Err(error!(ErrorCode::StakePoolHasEnded));
    }

    // check allowlist
    let remaining_accounts = &mut ctx.remaining_accounts.iter();
    mint_is_allowed(stake_pool, &ctx.accounts.stake_mint_metadata, ctx.accounts.stake_mint.key(), remaining_accounts)?;

    let cpi_accounts = Approve {
        to: ctx.accounts.user_stake_mint_token_account.to_account_info(),
        delegate: ctx.accounts.user_escrow.to_account_info(),
        authority: ctx.accounts.user.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_context = CpiContext::new(cpi_program, cpi_accounts);
    token::approve(cpi_context, amount)?;

    invoke_signed(
        &freeze_delegated_account(
            ctx.accounts.token_metadata_program.key(),
            user_escrow.key(),
            ctx.accounts.user_stake_mint_token_account.key(),
            ctx.accounts.stake_mint_edition.key(),
            ctx.accounts.stake_mint.key(),
        ),
        &[
            ctx.accounts.user_escrow.to_account_info(),
            ctx.accounts.user_stake_mint_token_account.to_account_info(),
            ctx.accounts.stake_mint_edition.to_account_info(),
            ctx.accounts.stake_mint.to_account_info(),
        ],
        &[&escrow_seeds.iter().map(|s| s.as_slice()).collect::<Vec<&[u8]>>()],
    )?;

    // handle payment
    if let Some(payment_mint) = stake_pool.payment_mint {
        let remaining_accounts = &mut ctx.remaining_accounts.iter();
        let payment_manager = next_account_info(remaining_accounts)?;
        assert_eq!(stake_pool.payment_manager.expect("Invalid payment manager"), payment_manager.key());

        let payer_token_account_info = next_account_info(remaining_accounts)?;
        let payer_token_account = Account::<TokenAccount>::try_from(payer_token_account_info)?;
        assert_eq!(payer_token_account.mint, payment_mint);

        let fee_collector_token_account = next_account_info(remaining_accounts)?;
        let payment_token_account = next_account_info(remaining_accounts)?;
        let payer = next_account_info(remaining_accounts)?;
        let cardinal_payment_manager = next_account_info(remaining_accounts)?;
        assert_eq!(CardinalPaymentManager::id(), cardinal_payment_manager.key());

        assert_allowed_payment_info(&payment_mint.to_string()).expect("Payment manager error");
        let payment_amount = stake_pool.payment_amount.expect("Invalid payment amount");
        let cpi_accounts = cardinal_payment_manager::cpi::accounts::HandlePaymentCtx {
            payment_manager: payment_manager.to_account_info(),
            payer_token_account: payer_token_account_info.to_account_info(),
            fee_collector_token_account: fee_collector_token_account.to_account_info(),
            payment_token_account: payment_token_account.to_account_info(),
            payer: payer.to_account_info(),
            token_program: ctx.accounts.token_program.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(cardinal_payment_manager.to_account_info(), cpi_accounts);
        cardinal_payment_manager::cpi::manage_payment(cpi_ctx, payment_amount)?;
    }

    // update stake entry
    if stake_entry.amount != 0 {
        increment_total_stake_seconds(stake_entry)?;
        stake_entry.cooldown_start_seconds = None;
    }
    stake_entry.last_staker = ctx.accounts.user.key();
    stake_entry.last_staked_at = Clock::get().unwrap().unix_timestamp;
    stake_entry.last_updated_at = Clock::get().unwrap().unix_timestamp;
    stake_entry.amount = stake_entry.amount.checked_add(amount).unwrap();
    stake_pool.total_staked = stake_pool.total_staked.checked_add(1).expect("Add error");

    Ok(())
}
