use anchor_lang::prelude::*;

pub const AUCTION_DEFAULT_SIZE: usize = 8 + std::mem::size_of::<Auction>();
pub const AUCTION_PREFIX: &str = "auction";
#[account]
pub struct Auction {
    pub bump: u8,
    pub stake_pool: Pubkey,
    pub authority: Pubkey,
    pub highest_bidding_stake_entry: Pubkey,
    pub highest_bid: u128,
    pub end_date: i64,
    pub completed: bool,
    pub name: String,
}
