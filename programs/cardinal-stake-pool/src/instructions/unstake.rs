use anchor_spl::token::Revoke;
use cardinal_payment_manager::program::CardinalPaymentManager;
use mpl_token_metadata::instruction::thaw_delegated_account;
use solana_program::program::invoke_signed;

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

    original_mint: Box<Account<'info, Mint>>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    original_mint_edition: UncheckedAccount<'info>,

    // stake_entry token accounts
    #[account(mut, constraint =
        (stake_entry_original_mint_token_account.amount > 0 || stake_pool.cooldown_seconds.is_some() || stake_pool.min_stake_seconds.is_some())
        && stake_entry_original_mint_token_account.mint == stake_entry.original_mint
        && stake_entry_original_mint_token_account.owner == stake_entry.key()
        @ ErrorCode::InvalidStakeEntryOriginalMintTokenAccount)]
    stake_entry_original_mint_token_account: Box<Account<'info, TokenAccount>>,

    // user
    #[account(mut, constraint = user.key() == stake_entry.last_staker @ ErrorCode::InvalidUnstakeUser)]
    user: Signer<'info>,
    #[account(mut, constraint =
        user_original_mint_token_account.mint == stake_entry.original_mint
        && user_original_mint_token_account.owner == user.key()
        @ ErrorCode::InvalidUserOriginalMintTokenAccount
    )]
    user_original_mint_token_account: Box<Account<'info, TokenAccount>>,

    // payment
    #[account(mut)]
    payer: Signer<'info>,
    #[account(mut, constraint =
        user_original_mint_token_account.mint == stake_entry.original_mint
        && user_original_mint_token_account.owner == user.key()
        @ ErrorCode::InvalidPaymentMintTokenAccount
    )]
    user_payment_mint_token_account: Box<Account<'info, TokenAccount>>,
    #[account(mut, constraint =
        user_original_mint_token_account.mint == stake_entry.original_mint
        && user_original_mint_token_account.owner.to_string() == DEFAULT_PAYMENT_MANAGER
        @ ErrorCode::InvalidPaymentMintTokenAccount
    )]
    target_payment_mint_token_account: Box<Account<'info, TokenAccount>>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    payment_manager: UncheckedAccount<'info>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    fee_collector_token_account: UncheckedAccount<'info>,

    // programs
    /// CHECK: This is not dangerous because we don't read or write from this account
    cardinal_payment_manager: Program<'info, CardinalPaymentManager>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(address = mpl_token_metadata::id())]
    token_metadata_program: UncheckedAccount<'info>,
    token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<UnstakeCtx>) -> Result<()> {
    let stake_pool = &mut ctx.accounts.stake_pool;
    let stake_entry = &mut ctx.accounts.stake_entry;

    let original_mint = stake_entry.original_mint;
    let user = ctx.accounts.user.key();
    let stake_pool_key = stake_pool.key();
    let seed = get_stake_seed(ctx.accounts.original_mint.supply, user);

    let stake_entry_seed = [STAKE_ENTRY_PREFIX.as_bytes(), stake_pool_key.as_ref(), original_mint.as_ref(), seed.as_ref(), &[stake_entry.bump]];
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

    // If receipt has been minted, ensure it is back in the stake_entry
    if stake_entry.stake_mint.is_some() {
        let remaining_accs = &mut ctx.remaining_accounts.iter();
        let stake_entry_receipt_mint_token_account_info = next_account_info(remaining_accs)?;
        let stake_entry_receipt_mint_token_account = Account::<TokenAccount>::try_from(stake_entry_receipt_mint_token_account_info)?;
        if stake_entry_receipt_mint_token_account.mint != stake_entry.stake_mint.unwrap()
            || stake_entry_receipt_mint_token_account.owner != stake_entry.key()
            || stake_entry_receipt_mint_token_account.amount == 0
        {
            return Err(error!(ErrorCode::InvalidStakeEntryStakeTokenAccount));
        }
    }

    invoke_signed(
        &thaw_delegated_account(
            ctx.accounts.token_metadata_program.key(),
            stake_entry.key(),
            ctx.accounts.user_original_mint_token_account.key(),
            ctx.accounts.original_mint_edition.key(),
            ctx.accounts.original_mint.key(),
        ),
        &[
            stake_entry.to_account_info(),
            ctx.accounts.user_original_mint_token_account.to_account_info(),
            ctx.accounts.original_mint_edition.to_account_info(),
            ctx.accounts.original_mint.to_account_info(),
        ],
        stake_entry_signer,
    )?;

    let cpi_accounts = Revoke {
        source: ctx.accounts.user_original_mint_token_account.to_account_info(),
        authority: ctx.accounts.user.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_context = CpiContext::new(cpi_program, cpi_accounts);
    token::revoke(cpi_context)?;

    stake_entry.total_stake_seconds = stake_entry.total_stake_seconds.saturating_add(
        (u128::try_from(stake_entry.cooldown_start_seconds.unwrap_or(Clock::get().unwrap().unix_timestamp))
            .unwrap()
            .saturating_sub(u128::try_from(stake_entry.last_staked_at).unwrap()))
        .checked_mul(u128::try_from(stake_entry.amount).unwrap())
        .unwrap(),
    );
    stake_entry.last_staker = Pubkey::default();
    stake_entry.original_mint_claimed = false;
    stake_entry.stake_mint_claimed = false;
    stake_entry.amount = 0;
    stake_entry.cooldown_start_seconds = None;
    stake_pool.total_staked = stake_pool.total_staked.checked_sub(1).expect("Sub error");
    stake_entry.kind = StakeEntryKind::Permissionless as u8;

    // handle payment
    assert_allowed_payment_manager(&ctx.accounts.payment_manager.key().to_string(), DEFAULT_PAYMENT_RECIPIENT).expect("Payment manager error");
    let payment_mints = get_payment_mints();
    let payment_amount = payment_mints.get(DEFAULT_PAYMENT_MINT).expect("Could not fetch payment amount");
    let cpi_accounts = cardinal_payment_manager::cpi::accounts::HandlePaymentCtx {
        payment_manager: ctx.accounts.payment_manager.to_account_info(),
        payer_token_account: ctx.accounts.user_payment_mint_token_account.to_account_info(),
        fee_collector_token_account: ctx.accounts.fee_collector_token_account.to_account_info(),
        payment_token_account: ctx.accounts.target_payment_mint_token_account.to_account_info(),
        payer: ctx.accounts.payer.to_account_info(),
        token_program: ctx.accounts.token_program.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(ctx.accounts.cardinal_payment_manager.to_account_info(), cpi_accounts);
    cardinal_payment_manager::cpi::manage_payment(cpi_ctx, *payment_amount)?;

    Ok(())
}
