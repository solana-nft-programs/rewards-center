use crate::errors::ErrorCode;
use anchor_lang::prelude::*;

use crate::utils::resize_account;
use crate::Auction;
use crate::StakePool;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct UpdateAuctionIx {
    authority: Pubkey,
    end_timestamp_seconds: i64,
    completed: bool,
}

#[derive(Accounts)]
pub struct UpdateAuctionCtx<'info> {
    #[account(mut)]
    auction: Box<Account<'info, Auction>>,
    #[account(constraint = auction.stake_pool == stake_pool.key() @ ErrorCode::InvalidStakePool)]
    stake_pool: Box<Account<'info, StakePool>>,
    #[account(mut, constraint = authority.key() == auction.authority@ ErrorCode::InvalidAuthority)]
    authority: Signer<'info>,
    #[account(mut)]
    payer: Signer<'info>,
    system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<UpdateAuctionCtx>, ix: UpdateAuctionIx) -> Result<()> {
    let auction = &mut ctx.accounts.auction;
    let new_auction = Auction {
        bump: auction.bump,
        stake_pool: ctx.accounts.stake_pool.key(),
        authority: ix.authority,
        highest_bidding_stake_entry: auction.highest_bidding_stake_entry,
        highest_bid: auction.highest_bid,
        end_timestamp_seconds: ix.end_timestamp_seconds,
        completed: ix.completed,
        name: auction.name.to_string(),
    };

    auction.set_inner(new_auction);
    resize_account(
        &auction.to_account_info(),
        8 + auction.try_to_vec()?.len(),
        &ctx.accounts.payer.to_account_info(),
        &ctx.accounts.system_program.to_account_info(),
    )?;

    Ok(())
}
