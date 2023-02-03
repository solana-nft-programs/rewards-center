use crate::errors::ErrorCode;
use crate::stake_seed;
use crate::StakeEntry;
use crate::StakePool;
use crate::STAKE_ENTRY_PREFIX;
use anchor_lang::prelude::*;
use anchor_spl::token::Mint;
use anchor_spl::token::Token;
use anchor_spl::token::TokenAccount;
use mpl_token_metadata::instruction::MetadataInstruction;
use mpl_token_metadata::instruction::TransferArgs;
use solana_program::instruction::Instruction;
use solana_program::program::invoke;

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
    token_program: Program<'info, Token>,
    system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<StakePNFTCtx>, amount: u64) -> Result<()> {
    invoke(
        &Instruction {
            program_id: mpl_token_metadata::id(),
            accounts: vec![
                AccountMeta::new_readonly(mpl_token_metadata::id(), false),
                AccountMeta::new_readonly(token_manager.key(), false),
                AccountMeta::new(mint_metadata_info.key(), false),
                AccountMeta::new_readonly(mint_edition_info.key(), false),
                AccountMeta::new(recipient_token_record_info.key(), false),
                AccountMeta::new_readonly(mint_info.key(), false),
                AccountMeta::new(ctx.accounts.recipient_token_account.key(), false),
                AccountMeta::new_readonly(ctx.accounts.recipient.key(), true),
                AccountMeta::new(ctx.accounts.recipient.key(), true),
                AccountMeta::new_readonly(ctx.accounts.system_program.key(), false),
                AccountMeta::new_readonly(sysvar_instructions_info.key(), false),
                AccountMeta::new_readonly(ctx.accounts.token_program.key(), false),
                AccountMeta::new_readonly(authorization_rules_program_info.key(), false),
                AccountMeta::new_readonly(authorization_rules_info.key(), false),
            ],
            data: MetadataInstruction::Delegate(DelegateArgs::LockedTransferV1 {
                amount: token_manager.amount,
                locked_address: token_manager.key(),
                authorization_data: None,
            })
            .try_to_vec()
            .unwrap(),
        },
        &[
            token_manager.to_account_info(),
            mint_metadata_info.to_account_info(),
            mint_edition_info.to_account_info(),
            recipient_token_record_info.to_account_info(),
            mint_info.to_account_info(),
            ctx.accounts.recipient_token_account.to_account_info(),
            ctx.accounts.recipient.to_account_info(),
            ctx.accounts.recipient.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            sysvar_instructions_info.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
            authorization_rules_program_info.to_account_info(),
            authorization_rules_info.to_account_info(),
        ],
    )?;

    Ok(())
}
