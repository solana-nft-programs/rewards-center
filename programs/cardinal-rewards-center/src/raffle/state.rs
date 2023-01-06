use anchor_lang::prelude::*;

pub const RAFFLE_DEFAULT_SIZE: usize = 8 + std::mem::size_of::<Raffle>();
pub const RAFFLE_PREFIX: &str = "raffle";

#[account]
pub struct Raffle {
    pub bump: u8,
    pub authority: Pubkey,
    pub stake_pool: Pubkey,
    pub total_winners: u64,
    pub winner_count: u64,
    pub min_stake_seconds_to_use: u128,
    pub max_stake_seconds_to_use: u128,
    pub raffle_tickets: Vec<RaffleTicket>,
    pub end_date: i64,
    pub name: String,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Eq, Debug, PartialEq)]
pub struct RaffleTicket {
    pub recipient: Pubkey,
    pub cumulative_stake_seconds: u128,
    pub unix_seconds: i64,
}

pub const RAFFLE_WINNER_DEFAULT_SIZE: usize = 8 + std::mem::size_of::<RaffleWinner>();
pub const RAFFLE_WINNER_PREFIX: &str = "raffle-winner";

#[account]
pub struct RaffleWinner {
    pub bump: u8,
    pub raffle: Pubkey,
    pub recipient: Pubkey,
}
