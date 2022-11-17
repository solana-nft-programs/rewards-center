use crate::errors::ErrorCode;
use anchor_lang::prelude::*;

pub const USER_ESCROW_PREFIX: &str = "escrow";
#[inline]
pub fn escrow_seeds(pool: &Pubkey, user: &Pubkey, expected_key: &Pubkey) -> Result<Vec<Vec<u8>>> {
    let mut seeds = vec![USER_ESCROW_PREFIX.as_bytes().as_ref().to_vec(), pool.as_ref().to_vec(), user.as_ref().to_vec()];
    let (key, bump) = Pubkey::find_program_address(&seeds.iter().map(|s| s.as_slice()).collect::<Vec<&[u8]>>(), &crate::id());
    if key != *expected_key {
        return Err(error!(ErrorCode::InvalidEscrow));
    }
    seeds.push(vec![bump]);
    Ok(seeds)
}

pub fn stake_seed(supply: u64, user: Pubkey) -> Pubkey {
    if supply > 1 {
        user
    } else {
        Pubkey::default()
    }
}

pub const STAKE_ENTRY_PREFIX: &str = "stake-entry";
pub const STAKE_ENTRY_SIZE: usize = 8 + std::mem::size_of::<StakeEntry>() + 8;
#[account]
pub struct StakeEntry {
    pub bump: u8,
    pub kind: u8,
    pub pool: Pubkey,
    pub amount: u64,
    pub stake_mint: Pubkey,
    pub last_staker: Pubkey,
    pub last_staked_at: i64,
    pub last_updated_at: i64,
    pub total_stake_seconds: u128,
    pub used_stake_seconds: u128,
    pub cooldown_start_seconds: Option<i64>,
}
