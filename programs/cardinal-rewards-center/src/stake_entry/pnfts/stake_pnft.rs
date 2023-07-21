use crate::assert_payment_info;
use crate::errors::ErrorCode;
use crate::escrow_seeds;
use crate::handle_payment_info;
use crate::increment_total_stake_seconds;
use crate::mint_is_allowed;
use crate::stake_entry_fill_zeros;
use crate::stake_seed;
use crate::Action;
use crate::StakeEntry;
use crate::StakePool;
use crate::UserEscrow;
use crate::STAKE_ENTRY_PREFIX;
use crate::USER_ESCROW_PREFIX;
use crate::USER_ESCROW_SIZE;
use anchor_lang::prelude::*;
use anchor_spl::token::Mint;
use anchor_spl::token::Token;
use anchor_spl::token::TokenAccount;
use mpl_token_metadata::instruction::DelegateArgs;
use mpl_token_metadata::instruction::LockArgs;
use mpl_token_metadata::instruction::MetadataInstruction;
use solana_program::instruction::Instruction;
use solana_program::program::invoke;
use solana_program::program::invoke_signed;
use solana_program::sysvar;

#[derive(Accounts)]
pub struct StakePNFTCtx<'info> {
    #[account(mut, constraint = stake_entry.pool == stake_pool.key() @ ErrorCode::InvalidStakePool)]
    stake_pool: Box<Account<'info, StakePool>>,
    #[account(mut, seeds = [STAKE_ENTRY_PREFIX.as_bytes(), stake_entry.pool.as_ref(), stake_entry.stake_mint.as_ref(), stake_seed(stake_mint.supply, user.key()).as_ref()], bump = stake_entry.bump)]
    stake_entry: Box<Account<'info, StakeEntry>>,
    #[account(constraint = stake_entry.stake_mint == stake_mint.key() @ ErrorCode::InvalidStakeEntry)]
    stake_mint: Box<Account<'info, Mint>>,
    /// CHECK: Checked in handler
    #[account(mut)]
    stake_mint_metadata: UncheckedAccount<'info>,
    /// CHECK: Checked in handler
    stake_mint_edition: UncheckedAccount<'info>,
    /// CHECK: Checked in handler
    #[account(mut)]
    stake_token_record_account: UncheckedAccount<'info>,
    /// CHECK: Checked in handler
    authorization_rules: UncheckedAccount<'info>,
    #[account(mut)]
    user: Signer<'info>,

    #[account(
        init_if_needed,
        payer = user,
        space = USER_ESCROW_SIZE,
        seeds = [USER_ESCROW_PREFIX.as_bytes(), user.key().as_ref()],
        bump,
    )]
    user_escrow: Box<Account<'info, UserEscrow>>,

    #[account(mut, constraint =
            user_stake_mint_token_account.amount > 0
            && user_stake_mint_token_account.mint == stake_entry.stake_mint
            && user_stake_mint_token_account.owner == user.key()
            @ ErrorCode::InvalidUserStakeMintTokenAccount
        )]
    user_stake_mint_token_account: Box<Account<'info, TokenAccount>>,
    /// CHECK: Address checked
    #[account(address = mpl_token_metadata::id())]
    token_metadata_program: UncheckedAccount<'info>,
    /// CHECK: Address checked
    #[account(address = sysvar::instructions::id())]
    sysvar_instructions: UncheckedAccount<'info>,
    /// CHECK: Address checked
    #[account(address = mpl_token_auth_rules::id())]
    authorization_rules_program: UncheckedAccount<'info>,
    token_program: Program<'info, Token>,
    system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<StakePNFTCtx>) -> Result<()> {
    let user_escrow_seeds = escrow_seeds(&ctx.accounts.user.key(), &ctx.accounts.user_escrow.key())?;
    ctx.accounts.user_escrow.user = ctx.accounts.user.key();

    let stake_pool = &mut ctx.accounts.stake_pool;
    let stake_entry = &mut ctx.accounts.stake_entry;

    //// FEATURE: Ended
    if stake_pool.end_date.is_some() && Clock::get().unwrap().unix_timestamp > stake_pool.end_date.unwrap() {
        return Err(error!(ErrorCode::StakePoolHasEnded));
    }

    //// FEATURE: Allowlist
    let remaining_accounts = &mut ctx.remaining_accounts.iter();
    mint_is_allowed(stake_pool, &ctx.accounts.stake_mint_metadata, ctx.accounts.stake_mint.key(), remaining_accounts)?;

    // handle payment
    assert_payment_info(stake_pool.key(), Action::Stake, stake_pool.stake_payment_info)?;
    handle_payment_info(stake_pool.stake_payment_info, remaining_accounts)?;

    // update stake entry
    if stake_entry.amount != 0 {
        increment_total_stake_seconds(stake_entry)?;
        stake_entry.cooldown_start_seconds = None;
    }
    stake_entry.last_staker = ctx.accounts.user.key();
    stake_entry.last_staked_at = Clock::get().unwrap().unix_timestamp;
    stake_entry.last_updated_at = Clock::get().unwrap().unix_timestamp;
    stake_entry.amount = stake_entry.amount.checked_add(1).unwrap();
    stake_pool.total_staked = stake_pool.total_staked.checked_add(1).expect("Add error");
    stake_entry_fill_zeros(stake_entry)?;

    // pnft actions to stake
    invoke(
        &Instruction {
            program_id: mpl_token_metadata::id(),
            accounts: vec![
                AccountMeta::new_readonly(mpl_token_metadata::id(), false),
                AccountMeta::new_readonly(ctx.accounts.user_escrow.key(), false),
                AccountMeta::new(ctx.accounts.stake_mint_metadata.key(), false),
                AccountMeta::new_readonly(ctx.accounts.stake_mint_edition.key(), false),
                AccountMeta::new(ctx.accounts.stake_token_record_account.key(), false),
                AccountMeta::new_readonly(ctx.accounts.stake_mint.key(), false),
                AccountMeta::new(ctx.accounts.user_stake_mint_token_account.key(), false),
                AccountMeta::new_readonly(ctx.accounts.user.key(), true),
                AccountMeta::new(ctx.accounts.user.key(), true),
                AccountMeta::new_readonly(ctx.accounts.system_program.key(), false),
                AccountMeta::new_readonly(ctx.accounts.sysvar_instructions.key(), false),
                AccountMeta::new_readonly(ctx.accounts.token_program.key(), false),
                AccountMeta::new_readonly(ctx.accounts.authorization_rules_program.key(), false),
                AccountMeta::new_readonly(ctx.accounts.authorization_rules.key(), false),
            ],
            data: MetadataInstruction::Delegate(DelegateArgs::StakingV1 { amount: 1, authorization_data: None }).try_to_vec().unwrap(),
        },
        &[
            ctx.accounts.user_escrow.to_account_info(),
            ctx.accounts.stake_mint_metadata.to_account_info(),
            ctx.accounts.stake_mint_edition.to_account_info(),
            ctx.accounts.stake_token_record_account.to_account_info(),
            ctx.accounts.stake_mint.to_account_info(),
            ctx.accounts.user_stake_mint_token_account.to_account_info(),
            ctx.accounts.user.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.sysvar_instructions.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
            ctx.accounts.authorization_rules_program.to_account_info(),
            ctx.accounts.authorization_rules.to_account_info(),
        ],
    )?;

    invoke_signed(
        &Instruction {
            program_id: mpl_token_metadata::id(),
            accounts: vec![
                AccountMeta::new_readonly(ctx.accounts.user_escrow.key(), true),
                AccountMeta::new_readonly(ctx.accounts.user.key(), false),
                AccountMeta::new(ctx.accounts.user_stake_mint_token_account.key(), false),
                AccountMeta::new_readonly(ctx.accounts.stake_mint.key(), false),
                AccountMeta::new(ctx.accounts.stake_mint_metadata.key(), false),
                AccountMeta::new_readonly(ctx.accounts.stake_mint_edition.key(), false),
                AccountMeta::new(ctx.accounts.stake_token_record_account.key(), false),
                AccountMeta::new(ctx.accounts.user.key(), true),
                AccountMeta::new_readonly(ctx.accounts.system_program.key(), false),
                AccountMeta::new_readonly(ctx.accounts.sysvar_instructions.key(), false),
                AccountMeta::new_readonly(ctx.accounts.token_program.key(), false),
                AccountMeta::new_readonly(ctx.accounts.authorization_rules_program.key(), false),
                AccountMeta::new_readonly(ctx.accounts.authorization_rules.key(), false),
            ],
            data: MetadataInstruction::Lock(LockArgs::V1 { authorization_data: None }).try_to_vec().unwrap(),
        },
        &[
            ctx.accounts.user_escrow.to_account_info(),
            ctx.accounts.user.to_account_info(),
            ctx.accounts.user_stake_mint_token_account.to_account_info(),
            ctx.accounts.stake_mint.to_account_info(),
            ctx.accounts.stake_mint_metadata.to_account_info(),
            ctx.accounts.stake_mint_edition.to_account_info(),
            ctx.accounts.stake_token_record_account.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.sysvar_instructions.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
            ctx.accounts.authorization_rules_program.to_account_info(),
            ctx.accounts.authorization_rules.to_account_info(),
        ],
        &[&user_escrow_seeds.iter().map(|s| s.as_slice()).collect::<Vec<&[u8]>>()],
    )?;

    Ok(())
}
