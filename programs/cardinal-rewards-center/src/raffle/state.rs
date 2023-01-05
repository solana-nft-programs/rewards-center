use anchor_lang::prelude::*;

pub const RAFFLE_DEFAULT_SIZE: usize = 8 + std::mem::size_of::<Raffle>();
pub const RAFFLE_PREFIX: &str = "raffle";

#[account]
pub struct Raffle {
    pub bump: u8,
    pub authority: Pubkey,
    pub stake_pool: Pubkey,
    pub total_receipts: u64,
    pub receipts_counter: u64,
    pub min_stake_seconds_to_use: u128,
    pub max_stake_seconds_to_use: u128,
    pub raffle_tickets: Vec<RaffleTicket>,
    pub end_date: i64,
    pub name: string,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Eq, PartialEq)]
pub struct RaffleTicket {
    pub bidder: Pubkey,
    pub stake_seconds: u128,
    pub unix_seconds: i64,
}

#[account]
pub struct RaffleWinner {
    pub bump: u8,
    pub raffle: Pubkey,
    pub owner: Pubkey,
}
