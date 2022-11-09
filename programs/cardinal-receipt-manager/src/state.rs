use crate::errors::ErrorCode;
use anchor_lang::prelude::*;
use std::collections::HashMap;

pub fn assert_allowed_payment_info(mint: &str) -> Result<()> {
    let payment_mints = get_payment_mints();
    if !payment_mints.contains_key(mint) {
        return Err(error!(ErrorCode::InvalidPaymentMint));
    }
    Ok(())
}

pub const DEFAULT_PAYMENT_MANAGER: &str = "FQJ2czigCYygS8v8trLU7TBAi7NjRN1h1C2vLAh2GYDi";
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

pub fn get_payment_mints() -> HashMap<&'static str, u64> {
    HashMap::from([
        ("DUSTawucrTsGU8hcqRdHDCbuYhCPADMLM2VcCb8VnFnQ", 10_u64.pow(9)),
        ("So11111111111111111111111111111111111111112", 2_000_000),
    ])
}

pub const RECEIPT_MANAGER_SEED: &str = "receipt-manager";
pub const RECEIPT_MANAGER_SIZE: usize = 8 + std::mem::size_of::<ReceiptManager>() + 64;
#[account]
pub struct ReceiptManager {
    pub bump: u8,
    pub stake_pool: Pubkey,
    pub authority: Pubkey,
    pub required_stake_seconds: u128,
    pub stake_seconds_to_use: u128,
    pub claimed_receipts_counter: u128,
    pub payment_mint: Pubkey,
    pub payment_manager: Pubkey,
    pub payment_recipient: Pubkey,
    pub requires_authorization: bool,
    pub name: String,
    pub max_claimed_receipts: Option<u128>,
}

pub const RECEIPT_ENTRY_SEED: &str = "receipt-entry";
pub const RECEIPT_ENTRY_SIZE: usize = 8 + std::mem::size_of::<ReceiptEntry>() + 64;
#[account]
pub struct ReceiptEntry {
    pub bump: u8,
    pub stake_entry: Pubkey,
    pub used_stake_seconds: u128,
}

pub const REWARD_RECEIPT_SEED: &str = "reward-receipt";
pub const REWARD_RECEIPT_SIZE: usize = 8 + std::mem::size_of::<RewardReceipt>() + 64;
#[account]
pub struct RewardReceipt {
    pub bump: u8,
    pub receipt_entry: Pubkey,
    pub receipt_manager: Pubkey,
    pub target: Pubkey,
    pub allowed: bool,
}
