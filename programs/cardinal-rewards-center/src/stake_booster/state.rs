use crate::errors::ErrorCode;
use anchor_lang::prelude::*;
use std::collections::HashMap;
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

pub(super) fn assert_stake_booster_payment_info(payment_mint: &Pubkey, _payment_amount: u64, payment_manager: &Pubkey) -> Result<()> {
    let payment_mints = HashMap::from([
        ("DUSTawucrTsGU8hcqRdHDCbuYhCPADMLM2VcCb8VnFnQ", 1_u64.pow(9)),
        ("So11111111111111111111111111111111111111112", 2_000_000),
    ]);
    if !payment_mints.contains_key(payment_mint.to_string().as_str()) {
        return Err(error!(ErrorCode::InvalidPaymentMint));
    }
    if payment_manager.to_string() != Pubkey::from_str("CuEDMUqgkGTVcAaqEDHuVR848XN38MPsD11JrkxcGD6a").unwrap().to_string() {
        return Err(error!(ErrorCode::InvalidPaymentManager));
    }
    Ok(())
}
