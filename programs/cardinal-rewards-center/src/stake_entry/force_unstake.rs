use crate::errors::ErrorCode;
use crate::escrow_seeds;
use crate::increment_total_stake_seconds;
use crate::stake_entry_fill_zeros;
use crate::stake_seed;
use crate::StakeEntry;
use crate::StakePool;
use crate::UserEscrow;
use crate::STAKE_ENTRY_PREFIX;
use crate::USER_ESCROW_PREFIX;
use crate::USER_ESCROW_SIZE;
use anchor_lang::prelude::*;
use anchor_spl::token::Mint;
use anchor_spl::token::Token;
use cardinal_creator_standard::instructions::remove_in_use_by;
use mpl_token_metadata::instruction::thaw_delegated_account;
use mpl_token_metadata::instruction::MetadataInstruction;
use mpl_token_metadata::instruction::UnlockArgs;
use mpl_token_metadata::state::Metadata;
use mpl_token_metadata::utils::assert_derivation;
use solana_program::instruction::Instruction;
use solana_program::program::invoke_signed;

pub const SHUTDOWN_KEY: &str = "s8tCUsMhQMt4UJAQRRJFhwNWPG3bmfG9KvWFj2b46XL";

#[derive(Accounts)]
pub struct ForceUnstakeCtx<'info> {
    stake_pool: Box<Account<'info, StakePool>>,
    #[account(mut, seeds = [STAKE_ENTRY_PREFIX.as_bytes(), stake_entry.pool.as_ref(), stake_entry.stake_mint.as_ref(), stake_seed(stake_mint.supply, user.key()).as_ref()], bump = stake_entry.bump)]
    stake_entry: Box<Account<'info, StakeEntry>>,

    #[account(mut, constraint = authority.key().to_string() == SHUTDOWN_KEY.to_string() @ ErrorCode::InvalidAuthority)]
    authority: Signer<'info>,
    /// CHECK: This is not dangerous
    #[account(mut)]
    user: UncheckedAccount<'info>,

    #[account(
        init_if_needed,
        payer = authority,
        space = USER_ESCROW_SIZE,
        seeds = [USER_ESCROW_PREFIX.as_bytes(), user.key().as_ref()],
        bump,
    )]
    user_escrow: Box<Account<'info, UserEscrow>>,

    #[account(constraint = stake_entry.stake_mint == stake_mint.key() @ ErrorCode::InvalidStakeEntry)]
    stake_mint: Box<Account<'info, Mint>>,
    /// CHECK: This is not dangerous
    #[account(mut)]
    stake_mint_edition: UncheckedAccount<'info>,
    /// CHECK: This is not dangerous
    #[account(mut)]
    stake_mint_metadata: UncheckedAccount<'info>,
    /// CHECK: This is not dangerous
    #[account(mut)]
    stake_mint_user_token_account: UncheckedAccount<'info>,
    /// CHECK: This is not dangerous
    #[account(mut)]
    stake_mint_user_token_record: UncheckedAccount<'info>,
    /// CHECK: This is not dangerous
    #[account(mut)]
    stake_mint_manager: UncheckedAccount<'info>,

    /// CHECK: This is not dangerous
    authorization_rules: UncheckedAccount<'info>,
    /// CHECK: This is not dangerous
    #[account(address = cardinal_creator_standard::id())]
    creator_standard_program: UncheckedAccount<'info>,
    sysvar_instructions: UncheckedAccount<'info>,
    token_program: Program<'info, Token>,
    /// CHECK: This is not dangerous
    #[account(address = mpl_token_metadata::id())]
    token_metadata_program: UncheckedAccount<'info>,
    /// CHECK: This is not dangerous
    authorization_rules_program: UncheckedAccount<'info>,
    system_program: Program<'info, System>,
}

pub fn handler<'key, 'accounts, 'remaining, 'info>(ctx: Context<'key, 'accounts, 'remaining, 'info, ForceUnstakeCtx<'info>>) -> Result<()> {
    let stake_pool = &mut ctx.accounts.stake_pool;
    let stake_entry = &mut ctx.accounts.stake_entry;
    ctx.accounts.user_escrow.user = ctx.accounts.user.key();

    let user = ctx.accounts.user.key();
    let user_escrow = ctx.accounts.user_escrow.key();
    let user_escrow_seeds = escrow_seeds(&user, &user_escrow)?;

    // UNSTAKE
    if ctx.accounts.user.key() != stake_entry.last_staker {
        return Err(error!(ErrorCode::InvalidLastStaker));
    }
    assert_derivation(
        &mpl_token_metadata::id(),
        &&ctx.accounts.stake_mint_metadata.to_account_info(),
        &[mpl_token_metadata::state::PREFIX.as_bytes(), mpl_token_metadata::id().as_ref(), ctx.accounts.stake_mint.key().as_ref()],
    )?;
    if ctx.accounts.stake_mint.freeze_authority.is_some() && ctx.accounts.stake_mint.freeze_authority.unwrap() == ctx.accounts.stake_mint_manager.key() {
        // remove in_use_by
        invoke_signed(
            &remove_in_use_by(ctx.accounts.creator_standard_program.key(), ctx.accounts.stake_mint_manager.key(), ctx.accounts.user_escrow.key())?,
            &[ctx.accounts.stake_mint_manager.to_account_info(), ctx.accounts.user_escrow.to_account_info()],
            &[&user_escrow_seeds.iter().map(|s| s.as_slice()).collect::<Vec<&[u8]>>()],
        )?;
    } else if !ctx.accounts.stake_mint_metadata.data_is_empty()
        && Metadata::deserialize(&mut ctx.accounts.stake_mint_metadata.try_borrow_mut_data().expect("Failed to borrow data").as_ref())
            .expect("Failed to deserialize metadata")
            .programmable_config
            .is_some()
    {
        // PNFT
        invoke_signed(
            &Instruction {
                program_id: mpl_token_metadata::id(),
                accounts: vec![
                    AccountMeta::new_readonly(ctx.accounts.user_escrow.key(), true),
                    AccountMeta::new_readonly(ctx.accounts.user.key(), false),
                    AccountMeta::new(ctx.accounts.stake_mint_user_token_account.key(), false),
                    AccountMeta::new_readonly(ctx.accounts.stake_mint.key(), false),
                    AccountMeta::new(ctx.accounts.stake_mint_metadata.key(), false),
                    AccountMeta::new_readonly(ctx.accounts.stake_mint_edition.key(), false),
                    AccountMeta::new(ctx.accounts.stake_mint_user_token_record.key(), false),
                    AccountMeta::new(ctx.accounts.authority.key(), true),
                    AccountMeta::new_readonly(ctx.accounts.system_program.key(), false),
                    AccountMeta::new_readonly(ctx.accounts.sysvar_instructions.key(), false),
                    AccountMeta::new_readonly(ctx.accounts.token_program.key(), false),
                    AccountMeta::new_readonly(ctx.accounts.authorization_rules_program.key(), false),
                    AccountMeta::new_readonly(ctx.accounts.authorization_rules.key(), false),
                ],
                data: MetadataInstruction::Unlock(UnlockArgs::V1 { authorization_data: None }).try_to_vec().unwrap(),
            },
            &[
                ctx.accounts.user_escrow.to_account_info(),
                ctx.accounts.user.to_account_info(),
                ctx.accounts.stake_mint_user_token_account.to_account_info(),
                ctx.accounts.stake_mint.to_account_info(),
                ctx.accounts.stake_mint_metadata.to_account_info(),
                ctx.accounts.stake_mint_edition.to_account_info(),
                ctx.accounts.stake_mint_user_token_record.to_account_info(),
                ctx.accounts.authority.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
                ctx.accounts.sysvar_instructions.to_account_info(),
                ctx.accounts.token_program.to_account_info(),
                ctx.accounts.authorization_rules_program.to_account_info(),
                ctx.accounts.authorization_rules.to_account_info(),
            ],
            &[&user_escrow_seeds.iter().map(|s| s.as_slice()).collect::<Vec<&[u8]>>()],
        )?;
        // can't revoke delegate without holder signature
    } else {
        // NON-PNFT
        invoke_signed(
            &thaw_delegated_account(
                ctx.accounts.token_metadata_program.key(),
                user_escrow,
                ctx.accounts.stake_mint_user_token_account.key(),
                ctx.accounts.stake_mint_edition.key(),
                ctx.accounts.stake_mint.key(),
            ),
            &[
                ctx.accounts.user_escrow.to_account_info(),
                ctx.accounts.stake_mint_user_token_account.to_account_info(),
                ctx.accounts.stake_mint_edition.to_account_info(),
                ctx.accounts.stake_mint.to_account_info(),
            ],
            &[&user_escrow_seeds.iter().map(|s| s.as_slice()).collect::<Vec<&[u8]>>()],
        )?;
    }
    // UNSTAKE

    increment_total_stake_seconds(stake_entry)?;
    stake_entry.last_staker = Pubkey::default();
    stake_entry.amount = 0;
    stake_entry.cooldown_start_seconds = None;
    stake_pool.total_staked = stake_pool.total_staked.checked_sub(1).expect("Sub error");
    if stake_pool.reset_on_unstake {
        stake_entry.total_stake_seconds = 0;
        stake_entry.multiplier_stake_seconds = None;
    }
    stake_entry_fill_zeros(stake_entry)?;

    Ok(())
}
