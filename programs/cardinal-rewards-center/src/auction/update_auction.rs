use crate::errors::ErrorCode;
use anchor_lang::prelude::*;

use crate::utils::resize_account;
use crate::Auction;
use crate::StakePool;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct UpdateAuctionIx {
    authority: Pubkey,
    end_date: i64,
    completed: bool,
}

#[derive(Accounts)]
#[instruction(ix: UpdateAuctionIx)]
pub struct UpdateAuctionCtx<'info> {
    #[account(mut, constraint = auction.authority == authority.key() @ ErrorCode::InvalidAuthority)]
    auction: Box<Account<'info, Auction>>,
    stake_pool: Box<Account<'info, StakePool>>,

    #[account(mut)]
    authority: Signer<'info>,

    #[account(mut)]
    payer: Signer<'info>,
    system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<UpdateAuctionCtx>, ix: UpdateAuctionIx) -> Result<()> {
    let new_auction = Auction {
        bump: *ctx.bumps.get("auction").unwrap(),
        stake_pool: ctx.accounts.stake_pool.key(),
        authority: ix.authority,
        highest_bidding_stake_entry: ctx.accounts.auction.highest_bidding_stake_entry,
        highest_bid: ctx.accounts.auction.highest_bid,
        end_date: ix.end_date,
        completed: ix.completed,
        name: ctx.accounts.auction.name.to_string(),
    };

    let auction = &mut ctx.accounts.auction;
    auction.set_inner(new_auction);

    resize_account(
        &auction.to_account_info(),
        8 + auction.try_to_vec()?.len(),
        &ctx.accounts.payer.to_account_info(),
        &ctx.accounts.system_program.to_account_info(),
    )?;

    Ok(())
}
