use {
    crate::{errors::ErrorCode, state::*},
    anchor_lang::prelude::*,
    anchor_spl::{
        associated_token::AssociatedToken,
        token::{Mint, Token, TokenAccount},
    },
    cardinal_token_manager::{
        self,
        program::CardinalTokenManager,
        state::{InvalidationType, TokenManagerKind},
    },
};

#[derive(Accounts)]
pub struct ClaimReceiptMintCtx<'info> {
    #[account(mut)]
    stake_entry: Box<Account<'info, StakeEntry>>,

    original_mint: Box<Account<'info, Mint>>,
    #[account(mut)]
    receipt_mint: Box<Account<'info, Mint>>,

    #[account(mut, constraint =
        stake_entry_receipt_mint_token_account.amount > 0
        && stake_entry_receipt_mint_token_account.mint == receipt_mint.key()
        && stake_entry_receipt_mint_token_account.owner == stake_entry.key()
        @ ErrorCode::InvalidStakeEntryMintTokenAccount)]
    stake_entry_receipt_mint_token_account: Box<Account<'info, TokenAccount>>,

    // user
    #[account(mut, constraint = user.key() == stake_entry.last_staker @ ErrorCode::InvalidLastStaker)]
    user: Signer<'info>,
    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = receipt_mint,
        associated_token::authority = user,
    )]
    user_receipt_mint_token_account: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    token_manager_receipt_mint_token_account: Box<Account<'info, TokenAccount>>,

    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    token_manager: UncheckedAccount<'info>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut)]
    mint_counter: UncheckedAccount<'info>,

    // programs
    token_program: Program<'info, Token>,
    token_manager_program: Program<'info, CardinalTokenManager>,
    associated_token_program: Program<'info, AssociatedToken>,
    system_program: Program<'info, System>,
    rent: Sysvar<'info, Rent>,
}

pub fn handler<'key, 'accounts, 'remaining, 'info>(ctx: Context<'key, 'accounts, 'remaining, 'info, ClaimReceiptMintCtx<'info>>) -> Result<()> {
    let stake_entry = &mut ctx.accounts.stake_entry;
    let original_mint = stake_entry.original_mint;
    let user = ctx.accounts.user.key();
    let stake_pool = stake_entry.pool;
    let seed = get_stake_seed(ctx.accounts.original_mint.supply, user);

    let stake_entry_seed = [STAKE_ENTRY_PREFIX.as_bytes(), stake_pool.as_ref(), original_mint.as_ref(), seed.as_ref(), &[stake_entry.bump]];
    let stake_entry_signer = &[&stake_entry_seed[..]];

    let token_manager_kind;
    if stake_entry.original_mint == ctx.accounts.receipt_mint.key() {
        stake_entry.original_mint_claimed = true;
        token_manager_kind = TokenManagerKind::Edition;
    } else if ctx.accounts.receipt_mint.key() == stake_entry.stake_mint.unwrap() {
        stake_entry.stake_mint_claimed = true;
        token_manager_kind = TokenManagerKind::Managed;
    } else {
        return Err(error!(ErrorCode::InvalidReceiptMint));
    }

    // token manager init
    let init_ix = cardinal_token_manager::instructions::InitIx {
        amount: 1, // todo change for fungible
        kind: token_manager_kind as u8,
        invalidation_type: InvalidationType::Return as u8,
        num_invalidators: 1,
    };
    let cpi_accounts = cardinal_token_manager::cpi::accounts::InitCtx {
        token_manager: ctx.accounts.token_manager.to_account_info(),
        mint_counter: ctx.accounts.mint_counter.to_account_info(),
        issuer: stake_entry.to_account_info(),
        payer: ctx.accounts.user.to_account_info(),
        issuer_token_account: ctx.accounts.stake_entry_receipt_mint_token_account.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
        mint: ctx.accounts.receipt_mint.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(ctx.accounts.token_manager_program.to_account_info(), cpi_accounts).with_signer(stake_entry_signer);
    cardinal_token_manager::cpi::init(cpi_ctx, init_ix)?;

    // add invalidator
    let cpi_accounts = cardinal_token_manager::cpi::accounts::AddInvalidatorCtx {
        token_manager: ctx.accounts.token_manager.to_account_info(),
        issuer: stake_entry.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(ctx.accounts.token_manager_program.to_account_info(), cpi_accounts).with_signer(stake_entry_signer);
    cardinal_token_manager::cpi::add_invalidator(cpi_ctx, stake_entry.key())?;

    // token manager issue
    let cpi_accounts = cardinal_token_manager::cpi::accounts::IssueCtx {
        token_manager: ctx.accounts.token_manager.to_account_info(),
        token_manager_token_account: ctx.accounts.token_manager_receipt_mint_token_account.to_account_info(),
        issuer: stake_entry.to_account_info(),
        issuer_token_account: ctx.accounts.stake_entry_receipt_mint_token_account.to_account_info(),
        payer: ctx.accounts.user.to_account_info(),
        token_program: ctx.accounts.token_program.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(ctx.accounts.token_manager_program.to_account_info(), cpi_accounts).with_signer(stake_entry_signer);
    cardinal_token_manager::cpi::issue(cpi_ctx)?;

    // token manager claim
    let cpi_accounts = cardinal_token_manager::cpi::accounts::ClaimCtx {
        token_manager: ctx.accounts.token_manager.to_account_info(),
        token_manager_token_account: ctx.accounts.token_manager_receipt_mint_token_account.to_account_info(),
        mint: ctx.accounts.receipt_mint.to_account_info(),
        recipient: ctx.accounts.user.to_account_info(),
        recipient_token_account: ctx.accounts.user_receipt_mint_token_account.to_account_info(),
        token_program: ctx.accounts.token_program.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
    };
    let remaining_accounts = ctx.remaining_accounts.to_vec();
    let cpi_ctx = CpiContext::new(ctx.accounts.token_manager_program.to_account_info(), cpi_accounts).with_remaining_accounts(remaining_accounts);
    cardinal_token_manager::cpi::claim(cpi_ctx)?;
    Ok(())
}
