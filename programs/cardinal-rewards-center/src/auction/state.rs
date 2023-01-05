use anchor_lang::prelude::*;

pub const AUCTION_DEFAULT_SIZE: usize = 8 + std::mem::size_of::<Auction>();
pub const AUCTION_PREFIX: &str = "auction";

#[account]
pub struct Auction {
    pub bump: u8,
    pub stake_pool: Pubkey,
    pub authority: Pubkey,
    pub highest_bidder: Pubkey,
    pub highest_bid: u64,
    pub end_date: i64,
    pub name: String,
}

#[account]
pub struct AuctionWinner {
    pub bump: u8,
    pub auction: Pubkey,
    pub owner: Pubkey,
}
