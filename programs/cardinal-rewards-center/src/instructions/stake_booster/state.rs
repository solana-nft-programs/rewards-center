use crate::errors::ErrorCode;
use anchor_lang::prelude::*;
use std::str::FromStr;

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

pub fn assert_stake_boost_payment_manager(pubkey: &Pubkey) -> Result<()> {
    if pubkey.to_string() != Pubkey::from_str("CuEDMUqgkGTVcAaqEDHuVR848XN38MPsD11JrkxcGD6a").unwrap().to_string() {
        return Err(error!(ErrorCode::InvalidPaymentManager));
    }
    Ok(())
}
