use crate::errors::ErrorCode;
use crate::escrow_seeds;
use crate::stake_seed;
use crate::StakeEntry;
use crate::StakePool;
use crate::STAKE_ENTRY_PREFIX;
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
    stake_mint_metadata: UncheckedAccount<'info>,
    /// CHECK: Checked in handler
    stake_mint_edition: UncheckedAccount<'info>,
    /// CHECK: Checked in handler
    stake_token_record_account: UncheckedAccount<'info>,
    /// CHECK: Checked in handler
    authorization_rules: UncheckedAccount<'info>,

    #[account(mut)]
    user: Signer<'info>,
    /// CHECK: Checked in handler
    #[account(mut)]
    user_escrow: UncheckedAccount<'info>,
    #[account(mut, constraint =
        user_stake_mint_token_account.amount > 0
        && user_stake_mint_token_account.mint == stake_entry.stake_mint
        && user_stake_mint_token_account.owner == user.key()
        @ ErrorCode::InvalidUserStakeMintTokenAccount
    )]
    user_stake_mint_token_account: Box<Account<'info, TokenAccount>>,

    /// CHECK: Address checked
    #[account(address = cardinal_creator_standard::id())]
    token_metadata_program: UncheckedAccount<'info>,
    /// CHECK: Address checked
    #[account(address = &sysvar::instructions::id())]
    sysvar_instructions: UncheckedAccount<'info>,
    authorization_rules_program: Program<'info, Token>,
    token_program: Program<'info, Token>,
    system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<StakePNFTCtx>, amount: u64) -> Result<()> {
    let user_escrow_seeds = escrow_seeds(&ctx.accounts.user.key(), &ctx.accounts.user_escrow.key())?;

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
