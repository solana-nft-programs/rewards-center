use crate::errors::ErrorCode;
use anchor_lang::prelude::*;
use std::collections::HashMap;
use std::str::FromStr;

pub const STAKE_POOL_PREFIX: &str = "stake-pool";
#[account]
pub struct StakePool {
    pub bump: u8,
    pub authority: Pubkey,
    pub total_staked: u32,
    pub reset_on_unstake: bool,
    pub cooldown_seconds: Option<u32>,
    pub min_stake_seconds: Option<u32>,
    pub end_date: Option<i64>,
    pub stake_payment_amount: Option<u64>,
    pub unstake_payment_amount: Option<u64>,
    pub payment_mint: Option<Pubkey>,
    pub payment_manager: Option<Pubkey>,
    pub requires_authorization: bool,
    pub requires_creators: Vec<Pubkey>,
    pub requires_collections: Vec<Pubkey>,
    pub identifier: String,
}

pub fn assert_stake_pool_payment_info(mint: &Pubkey, _amount: u64) -> Result<()> {
    let payment_mints = HashMap::from([
        ("DUSTawucrTsGU8hcqRdHDCbuYhCPADMLM2VcCb8VnFnQ", 1_u64.pow(9)),
        ("So11111111111111111111111111111111111111112", 2_000_000),
    ]);
    if !payment_mints.contains_key(mint.to_string().as_str()) {
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
