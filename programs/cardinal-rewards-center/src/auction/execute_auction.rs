use crate::errors::ErrorCode;
use anchor_lang::prelude::*;

use crate::Auction;
use crate::StakePool;

#[derive(Accounts)]
pub struct ExecuteAuctionCtx<'info> {
    #[account(mut)]
    auction: Box<Account<'info, Auction>>,
    stake_pool: Box<Account<'info, StakePool>>,
}

pub fn handler(ctx: Context<ExecuteAuctionCtx>) -> Result<()> {
    let timestamp = Clock::get()?.unix_timestamp;
    if timestamp <= ctx.accounts.auction.end_date {
        return Err(error!(ErrorCode::AuctionIsLive));
    }

    // create auction winner receipt

    Ok(())
}
