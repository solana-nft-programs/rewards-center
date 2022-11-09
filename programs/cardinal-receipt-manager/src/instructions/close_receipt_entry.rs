use cardinal_stake_pool::state::StakeEntry;

use {
    crate::{errors::ErrorCode, state::*},
    anchor_lang::prelude::*,
};

#[derive(Accounts)]
pub struct CloseReceiptEntryCtx<'info> {
    #[account(mut, close = authority)]
    receipt_entry: Box<Account<'info, ReceiptEntry>>,
    #[account(constraint = receipt_manager.stake_pool == stake_entry.pool @ ErrorCode::InvalidReceiptManager)]
    receipt_manager: Box<Account<'info, ReceiptManager>>,
    #[account(constraint = stake_entry.key() == receipt_entry.stake_entry @ ErrorCode::InvalidStakeEntry)]
    stake_entry: Box<Account<'info, StakeEntry>>,

    #[account(mut, constraint = receipt_manager.authority == authority.key() @ ErrorCode::InvalidAuthority)]
    authority: Signer<'info>,
}

pub fn handler(_ctx: Context<CloseReceiptEntryCtx>) -> Result<()> {
    Ok(())
}
