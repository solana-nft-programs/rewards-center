use crate::errors::ErrorCode;
use anchor_lang::prelude::*;
use std::collections::HashMap;
use std::str::FromStr;

pub const USER_ESCROW_PREFIX: &str = "escrow";
#[inline]
pub fn get_escrow_seeds(user: &Pubkey, expected_key: &Pubkey) -> Result<Vec<Vec<u8>>> {
    let seeds = vec![USER_ESCROW_PREFIX.as_bytes().as_ref().to_vec(), user.as_ref().to_vec()];
    let (key, _bump) = Pubkey::find_program_address(&seeds.iter().map(|s| s.as_slice()).collect::<Vec<&[u8]>>(), &crate::id());
    if key != *expected_key {
        return Err(error!(ErrorCode::InvalidEscrow));
    }
    Ok(seeds)
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
    pub cooldown_start_seconds: Option<i64>,
}

pub const STAKE_POOL_PREFIX: &str = "stake-pool";
// 5 Pubkeys for creators and collections
pub const STAKE_POOL_SIZE: usize = 8 + 1 + 8 + 32 + 1 + 4 + 8 + 8 + 16 + 16 + 33 + 33 + 1 + 32 * 5 + 256;
#[account]
pub struct StakePool {
    pub bump: u8,
    pub identifier: u64,
    pub authority: Pubkey,
    pub reset_on_unstake: bool,
    pub total_staked: u32,
    pub cooldown_seconds: Option<u32>,
    pub min_stake_seconds: Option<u32>,
    pub end_date: Option<i64>,
    pub payment_amount: Option<u64>,
    pub payment_mint: Option<Pubkey>,
    pub payment_manager: Option<Pubkey>,
    pub requires_authorization: bool,
    pub requires_creators: Vec<Pubkey>,
    pub requires_collections: Vec<Pubkey>,
}

pub fn assert_stake_boost_payment_manager(pubkey: &Pubkey) -> Result<()> {
    if pubkey.to_string() != Pubkey::from_str("CuEDMUqgkGTVcAaqEDHuVR848XN38MPsD11JrkxcGD6a").unwrap().to_string() {
        return Err(error!(ErrorCode::InvalidPaymentManager));
    }
    Ok(())
}

pub const STAKE_BOOSTER_PREFIX: &str = "stake-booster";
pub const STAKE_BOOSTER_SIZE: usize = 8 + std::mem::size_of::<StakeBooster>() + 64;

#[account]
pub struct StakeBooster {
    pub bump: u8,
    pub stake_pool: Pubkey,
    pub identifier: u64,
    pub payment_amount: u64,
    pub payment_mint: Pubkey,
    pub payment_manager: Pubkey,
    pub payment_recipient: Pubkey,
    pub boost_seconds: u128,
    pub start_time_seconds: i64,
}

pub const STAKE_AUTHORIZATION_PREFIX: &str = "stake-authorization";
pub const STAKE_AUTHORIZATION_SIZE: usize = 8 + std::mem::size_of::<StakeAuthorizationRecord>() + 8;

#[account]
pub struct StakeAuthorizationRecord {
    pub bump: u8,
    pub pool: Pubkey,
    pub mint: Pubkey,
}

pub const IDENTIFIER_PREFIX: &str = "identifier";
pub const IDENTIFIER_SIZE: usize = 8 + std::mem::size_of::<Identifier>() + 8;

#[account]
pub struct Identifier {
    pub bump: u8,
    pub count: u64,
}

pub fn get_stake_seed(supply: u64, user: Pubkey) -> Pubkey {
    if supply > 1 {
        user
    } else {
        Pubkey::default()
    }
}

pub fn assert_allowed_payment_info(mint: &str) -> Result<()> {
    let payment_mints = HashMap::from([
        ("DUSTawucrTsGU8hcqRdHDCbuYhCPADMLM2VcCb8VnFnQ", 1_u64.pow(9)),
        ("So11111111111111111111111111111111111111112", 2_000_000),
    ]);
    if !payment_mints.contains_key(mint) {
        return Err(error!(ErrorCode::InvalidPaymentMint));
    }
    Ok(())
}

pub fn assert_stake_pool_payment_manager(pubkey: &Pubkey) -> Result<()> {
    if pubkey.to_string() != Pubkey::from_str("CuEDMUqgkGTVcAaqEDHuVR848XN38MPsD11JrkxcGD6a").unwrap().to_string() {
        return Err(error!(ErrorCode::InvalidPaymentManager));
    }
    Ok(())
}
