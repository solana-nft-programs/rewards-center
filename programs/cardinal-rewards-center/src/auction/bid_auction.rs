use crate::errors::ErrorCode;
use crate::increment_total_stake_seconds;
use crate::use_total_stake_seconds;
use anchor_lang::prelude::*;

use crate::Auction;
use crate::StakeEntry;
use crate::StakePool;

#[derive(Accounts)]
pub struct BidAuctionCtx<'info> {
    #[account(mut)]
    auction: Box<Account<'info, Auction>>,
    #[account(constraint = stake_pool.key() == auction.stake_pool @ ErrorCode::InvalidStakePool)]
    stake_pool: Box<Account<'info, StakePool>>,
    #[account(mut, constraint = stake_entry.pool == stake_pool.key() @ ErrorCode::InvalidStakeEntry)]
    stake_entry: Box<Account<'info, StakeEntry>>,
    /// CHECK This is checked below
    #[account(mut)]
    highest_bidding_stake_entry: UncheckedAccount<'info>,
    #[account(mut, constraint = bidder.key() == stake_entry.last_staker @ErrorCode::InvalidLastStaker)]
    bidder: Signer<'info>,
}

pub fn handler(ctx: Context<BidAuctionCtx>, bidding_stake_seconds: u128) -> Result<()> {
    if bidding_stake_seconds < ctx.accounts.auction.highest_bid {
        return Err(error!(ErrorCode::NotHighestBid));
    }
    if Clock::get()?.unix_timestamp > ctx.accounts.auction.end_timestamp_seconds {
        return Err(error!(ErrorCode::AuctionEnded));
    }

    let stake_entry = &mut ctx.accounts.stake_entry;
    increment_total_stake_seconds(stake_entry)?;
    use_total_stake_seconds(stake_entry, bidding_stake_seconds)?;

    let highest_bidding_stake_entry_info = Account::<StakeEntry>::try_from(&ctx.accounts.highest_bidding_stake_entry.to_account_info());
    if highest_bidding_stake_entry_info.is_ok() {
        let mut highest_bidding_stake_entry = highest_bidding_stake_entry_info.unwrap();
        highest_bidding_stake_entry.used_stake_seconds = highest_bidding_stake_entry.used_stake_seconds.saturating_sub(ctx.accounts.auction.highest_bid);
    }
    ctx.accounts.auction.highest_bid = bidding_stake_seconds;
    ctx.accounts.auction.highest_bidding_stake_entry = ctx.accounts.stake_entry.key();
    Ok(())
}
