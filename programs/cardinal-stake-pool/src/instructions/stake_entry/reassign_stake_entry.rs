use {
    crate::{errors::ErrorCode, state::*},
    anchor_lang::prelude::*,
};
#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct ReassignStakeEntryIx {
    target: Pubkey,
}

#[derive(Accounts)]
#[instruction(ix: ReassignStakeEntryIx)]
pub struct ReassignStakeEntryCtx<'info> {
    #[account(mut, constraint = stake_pool.authority == last_staker.key() @ErrorCode::InvalidAuthority)]
    stake_pool: Box<Account<'info, StakePool>>,
    // restricting this instruction only to non-fungible tokens, fungible stake entries are derived from the user pubkey so changing the last staker of a fungible stake entry
    // would imply creating a new stake entry for the new target. Such functionality is not unfeasible but restricting it to non-fungible tokens for now.
    #[account(mut, seeds = [STAKE_ENTRY_PREFIX.as_bytes(), stake_entry.pool.as_ref(), stake_entry.original_mint.as_ref(), Pubkey::default().as_ref()], bump = stake_entry.bump)]
    stake_entry: Box<Account<'info, StakeEntry>>,
    #[account(mut, constraint = stake_entry.last_staker == last_staker.key() && stake_pool.authority == last_staker.key() @ ErrorCode::InvalidLastStaker)]
    last_staker: Signer<'info>,
}

pub fn handler(ctx: Context<ReassignStakeEntryCtx>, ix: ReassignStakeEntryIx) -> Result<()> {
    let stake_entry = &mut ctx.accounts.stake_entry;

    // update last staker
    stake_entry.last_staker = ix.target;

    Ok(())
}
