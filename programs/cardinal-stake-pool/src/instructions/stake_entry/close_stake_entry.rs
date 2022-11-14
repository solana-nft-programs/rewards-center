use anchor_lang::AccountsClose;
use {
    crate::{errors::ErrorCode, state::*},
    anchor_lang::prelude::*,
};

#[derive(Accounts)]
pub struct CloseStakeEntryCtx<'info> {
    stake_pool: Box<Account<'info, StakePool>>,
    #[account(mut, constraint = stake_pool.key() == stake_entry.pool @ ErrorCode::InvalidStakePool)]
    stake_entry: Box<Account<'info, StakeEntry>>,
    #[account(mut, constraint = stake_pool.authority == authority.key() @ ErrorCode::InvalidAuthority)]
    authority: Signer<'info>,
}

pub fn handler(ctx: Context<CloseStakeEntryCtx>) -> Result<()> {
    let stake_entry = &ctx.accounts.stake_entry;
    if stake_entry.last_staker != Pubkey::default() {
        return Err(error!(ErrorCode::CannotCloseStakedEntry));
    }
    ctx.accounts.stake_entry.close(ctx.accounts.authority.to_account_info())?;

    Ok(())
}
