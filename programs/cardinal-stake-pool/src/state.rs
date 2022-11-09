use crate::errors::ErrorCode;
use anchor_lang::prelude::*;
use std::{collections::HashMap, str::FromStr};

pub const STAKE_ENTRY_PREFIX: &str = "stake-entry";
pub const STAKE_ENTRY_SIZE: usize = 8 + std::mem::size_of::<StakeEntry>() + 8;

#[derive(Clone, Debug, PartialEq, Eq, AnchorSerialize, AnchorDeserialize)]
#[repr(u8)]
pub enum StakeEntryKind {
    Permissionless = 0, // original
    Permissioned = 1,   // someone else called update_total_stake_seconds indicating claim_reward must check signer so this is a permissioned claim_rewards
}

#[account]
pub struct StakeEntry {
    pub bump: u8,
    pub pool: Pubkey,
    pub amount: u64,
    pub original_mint: Pubkey,
    pub original_mint_claimed: bool,
    pub last_staker: Pubkey,
    pub last_staked_at: i64,
    pub total_stake_seconds: u128,
    pub stake_mint_claimed: bool,
    pub kind: u8,
    pub stake_mint: Option<Pubkey>,
    pub cooldown_start_seconds: Option<i64>,
}

pub const STAKE_POOL_PREFIX: &str = "stake-pool";
// 5 Pubkeys for creators and collections
pub const STAKE_POOL_SIZE: usize = 8 + 1 + 8 + 1 + 32 + 32 * 5 + 256;

#[account]
pub struct StakePool {
    pub bump: u8,
    pub identifier: u64,
    pub authority: Pubkey,
    pub requires_creators: Vec<Pubkey>,
    pub requires_collections: Vec<Pubkey>,
    pub requires_authorization: bool,
    pub overlay_text: String,
    pub image_uri: String,
    pub reset_on_stake: bool,
    pub total_staked: u32,
    pub cooldown_seconds: Option<u32>,
    pub min_stake_seconds: Option<u32>,
    pub end_date: Option<i64>,
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
    let payment_mints = get_payment_mints();
    if !payment_mints.contains_key(mint) {
        return Err(error!(ErrorCode::InvalidPaymentMint));
    }
    Ok(())
}

pub const DEFAULT_PAYMENT_MANAGER: &str = "FQJ2czigCYygS8v8trLU7TBAi7NjRN1h1C2vLAh2GYDi";
pub const DEFAULT_PAYMENT_RECIPIENT: &str = "cpmaMZyBQiPxpeuxNsQhW7N8z1o9yaNdLgiPhWGUEiX";
pub fn assert_allowed_payment_manager(payment_manager: &str, payment_recipient: &str) -> Result<()> {
    let allowed_payment_managers = HashMap::from([("", "")]); // custom payment manager
    if !allowed_payment_managers.contains_key(&payment_manager) && payment_manager != DEFAULT_PAYMENT_MANAGER {
        return Err(error!(ErrorCode::InvalidPaymentManager));
    }
    if let Some(allowed_payment_recipient) = allowed_payment_managers.get(payment_manager) {
        if *allowed_payment_recipient != payment_recipient {
            return Err(error!(ErrorCode::InvalidPaymentManager));
        }
    }

    Ok(())
}

pub const DEFAULT_PAYMENT_MINT: &str = "DUSTawucrTsGU8hcqRdHDCbuYhCPADMLM2VcCb8VnFnQ";
pub fn get_payment_mints() -> HashMap<&'static str, u64> {
    HashMap::from([("DUSTawucrTsGU8hcqRdHDCbuYhCPADMLM2VcCb8VnFnQ", 10_u64.pow(9))])
}
