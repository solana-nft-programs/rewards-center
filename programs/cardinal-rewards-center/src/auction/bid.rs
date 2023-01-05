use crate::errors::ErrorCode;
use anchor_lang::prelude::*;
use solana_program::program::invoke;
use solana_program::system_instruction::transfer;

use crate::Auction;
use crate::StakeEntry;
use crate::StakePool;
use crate::BASE_ACTION_FEE;
use crate::COLLECTOR;

#[derive(Accounts)]
#[instruction(bidding_amount: u64)]
pub struct BidCtx<'info> {
    #[account(mut)]
    auction: Box<Account<'info, Auction>>,
    stake_pool: Box<Account<'info, StakePool>>,
    #[account(mut, constraint = stake_entry.pool == stake_pool.key() && stake_entry.last_staker == bidder.key() @ ErrorCode::InvalidStakeEntry)]
    stake_entry: Box<Account<'info, StakeEntry>>,

    #[account(mut)]
    bidder: Signer<'info>,
    #[account(constraint = collector.key().to_string() == COLLECTOR.to_string() @ ErrorCode::InvalidCollector)]
    collector: UncheckedAccount<'info>,
    system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<BidCtx>, bidding_amount: u64) -> Result<()> {
    if bidding_amount < ctx.accounts.auction.highest_bid {
        return Err(error!(ErrorCode::NotHighestBid));
    }

    let timestamp = Clock::get()?.unix_timestamp;
    if timestamp > ctx.accounts.auction.end_date {
        return Err(error!(ErrorCode::AuctionEnded));
    }

    ctx.accounts.auction.highest_bid = bidding_amount;
    ctx.accounts.auction.highest_bidder = ctx.accounts.bidder.key();

    invoke(
        &transfer(&ctx.accounts.bidder.key(), &ctx.accounts.collector.key(), BASE_ACTION_FEE),
        &[
            ctx.accounts.bidder.to_account_info(),
            ctx.accounts.collector.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
    )?;

    Ok(())
}
