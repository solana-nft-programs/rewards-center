use anchor_spl::token::Revoke;
use cardinal_payment_manager::program::CardinalPaymentManager;
use mpl_token_metadata::instruction::thaw_delegated_account;
use solana_program::program::invoke_signed;

use super::update_total_stake_seconds::increment_total_stake_seconds;

use {
    crate::{errors::ErrorCode, state::*},
    anchor_lang::prelude::*,
    anchor_spl::token::{self, Mint, Token, TokenAccount},
};

#[derive(Accounts)]
pub struct UnstakeCtx<'info> {
    #[account(mut)]
    stake_pool: Box<Account<'info, StakePool>>,
    #[account(mut, constraint = stake_entry.pool == stake_pool.key() @ ErrorCode::InvalidStakePool)]
    stake_entry: Box<Account<'info, StakeEntry>>,

    stake_mint: Box<Account<'info, Mint>>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    stake_mint_edition: UncheckedAccount<'info>,

    // stake_entry token accounts
    #[account(mut, constraint =
        (stake_entry_stake_mint_token_account.amount > 0 || stake_pool.cooldown_seconds.is_some() || stake_pool.min_stake_seconds.is_some())
        && stake_entry_stake_mint_token_account.mint == stake_entry.stake_mint
        && stake_entry_stake_mint_token_account.owner == stake_entry.key()
        @ ErrorCode::InvalidStakeEntryOriginalMintTokenAccount)]
    stake_entry_stake_mint_token_account: Box<Account<'info, TokenAccount>>,

    // user
    #[account(mut, constraint = user.key() == stake_entry.last_staker @ ErrorCode::InvalidUnstakeUser)]
    user: Signer<'info>,
    #[account(mut, constraint =
        user_stake_mint_token_account.mint == stake_entry.stake_mint
        && user_stake_mint_token_account.owner == user.key()
        @ ErrorCode::InvalidUserOriginalMintTokenAccount
    )]
    user_stake_mint_token_account: Box<Account<'info, TokenAccount>>,

    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(address = mpl_token_metadata::id())]
    token_metadata_program: UncheckedAccount<'info>,
    token_program: Program<'info, Token>,
}

pub fn handler<'key, 'accounts, 'remaining, 'info>(ctx: Context<'key, 'accounts, 'remaining, 'info, UnstakeCtx<'info>>) -> Result<()> {
    let stake_pool = &mut ctx.accounts.stake_pool;
    let stake_entry = &mut ctx.accounts.stake_entry;

    let stake_mint = stake_entry.stake_mint;
    let user = ctx.accounts.user.key();
    let stake_pool_key = stake_pool.key();
    let seed = get_stake_seed(ctx.accounts.stake_mint.supply, user);

    let stake_entry_seed = [STAKE_ENTRY_PREFIX.as_bytes(), stake_pool_key.as_ref(), stake_mint.as_ref(), seed.as_ref(), &[stake_entry.bump]];
    let stake_entry_signer = &[&stake_entry_seed[..]];

    if stake_pool.min_stake_seconds.is_some()
        && stake_pool.min_stake_seconds.unwrap() > 0
        && ((Clock::get().unwrap().unix_timestamp - stake_entry.last_staked_at) as u32) < stake_pool.min_stake_seconds.unwrap()
    {
        return Err(error!(ErrorCode::MinStakeSecondsNotSatisfied));
    }

    if stake_pool.cooldown_seconds.is_some() && stake_pool.cooldown_seconds.unwrap() > 0 {
        if stake_entry.cooldown_start_seconds.is_none() {
            stake_entry.cooldown_start_seconds = Some(Clock::get().unwrap().unix_timestamp);
            return Ok(());
        } else if stake_entry.cooldown_start_seconds.is_some() && ((Clock::get().unwrap().unix_timestamp - stake_entry.cooldown_start_seconds.unwrap()) as u32) < stake_pool.cooldown_seconds.unwrap() {
            return Err(error!(ErrorCode::CooldownSecondRemaining));
        }
    }

    if ctx.accounts.stake_mint.supply == 1
        && ctx.accounts.stake_mint.freeze_authority.is_some()
        && ctx.accounts.stake_mint.freeze_authority.expect("Invalid freze authority").eq(&ctx.accounts.stake_mint_edition.key())
    {
        invoke_signed(
            &thaw_delegated_account(
                ctx.accounts.token_metadata_program.key(),
                stake_entry.key(),
                ctx.accounts.user_stake_mint_token_account.key(),
                ctx.accounts.stake_mint_edition.key(),
                ctx.accounts.stake_mint.key(),
            ),
            &[
                stake_entry.to_account_info(),
                ctx.accounts.user_stake_mint_token_account.to_account_info(),
                ctx.accounts.stake_mint_edition.to_account_info(),
                ctx.accounts.stake_mint.to_account_info(),
            ],
            stake_entry_signer,
        )?;

        let cpi_accounts = Revoke {
            source: ctx.accounts.user_stake_mint_token_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_context = CpiContext::new(cpi_program, cpi_accounts);
        token::revoke(cpi_context)?;
    } else {
        let cpi_accounts = token::Transfer {
            from: ctx.accounts.stake_entry_stake_mint_token_account.to_account_info(),
            to: ctx.accounts.user_stake_mint_token_account.to_account_info(),
            authority: stake_entry.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_context = CpiContext::new(cpi_program, cpi_accounts).with_signer(stake_entry_signer);
        token::transfer(cpi_context, stake_entry.amount)?;
    }

    increment_total_stake_seconds(stake_entry)?;
    stake_entry.last_staker = Pubkey::default();
    stake_entry.amount = 0;
    stake_entry.cooldown_start_seconds = None;
    stake_pool.total_staked = stake_pool.total_staked.checked_sub(1).expect("Sub error");

    // handle payment
    let remaining_accounts = &mut ctx.remaining_accounts.iter();
    if let Some(payment_mint) = stake_pool.payment_mint {
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
    Ok(())
}
