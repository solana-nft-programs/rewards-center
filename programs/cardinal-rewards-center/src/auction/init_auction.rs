use anchor_lang::prelude::*;

use crate::utils::resize_account;
use crate::Auction;
use crate::StakePool;
use crate::AUCTION_DEFAULT_SIZE;
use crate::AUCTION_PREFIX;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitAuctionIx {
    name: String,
    authority: Pubkey,
    end_date: i64,
}

#[derive(Accounts)]
#[instruction(ix: InitAuctionIx)]
pub struct InitAutcionCtx<'info> {
    #[account(
        init,
        payer = payer,
        space = AUCTION_DEFAULT_SIZE,
        seeds = [AUCTION_PREFIX.as_bytes(), stake_pool.key().as_ref(), ix.name.as_bytes()],
        bump,
    )]
    auction: Box<Account<'info, Auction>>,
    stake_pool: Box<Account<'info, StakePool>>,

    #[account(mut)]
    payer: Signer<'info>,
    system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitAutcionCtx>, ix: InitAuctionIx) -> Result<()> {
    let new_auction = Auction {
        bump: *ctx.bumps.get("auction").unwrap(),
        stake_pool: ctx.accounts.stake_pool.key(),
        authority: ix.authority,
        highest_bidder: Pubkey::default(),
        highest_bid: 0,
        end_date: ix.end_date,
        name: ix.name,
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
