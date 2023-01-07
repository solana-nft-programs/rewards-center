use crate::errors::ErrorCode;
use crate::Action;
use anchor_lang::prelude::*;
use std::cmp::Eq;

pub const BASIS_POINTS_DIVISOR: u64 = 10_000;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Eq, PartialEq)]
pub struct PaymentShare {
    pub address: Pubkey,
    pub basis_points: u16,
}

// this gets resized on add and remove of shares
pub const DEFAULT_PAYMENT_INFO_SIZE: usize = 8 + std::mem::size_of::<PaymentInfo>();
pub const PAYMENT_INFO_PREFIX: &str = "payment-info";
#[account]
pub struct PaymentInfo {
    pub bump: u8,
    pub authority: Pubkey,
    pub identifier: String,
    pub payment_amount: u64,
    pub payment_mint: Pubkey,
    pub payment_shares: Vec<PaymentShare>,
}

pub fn assert_payment_info(stake_pool: Pubkey, action: Action, payment_info: Pubkey) -> Result<()> {
    let default_allowed_payment_infos = match action {
        _ => [
            "382KXQfzC26jbFmLZBmKoZ6eRz53iwGfxXwoGyyyH8po".to_string(), // cardinal-test-wsol
            "HqiCY5NqfHfyhyjheQ4ENo5J2XSQBpeqhNoeESkDWBpU".to_string(), // cardinal-test (native)
            "SdFEeJxn7XxcnYEMNpnoMMSsTfmA1bHfiRdu6qra7zL".to_string(),  // cardinal-default 0.002
        ]
        .to_vec(),
    };
    let allowed_payment_infos = match (stake_pool.key().to_string().as_str(), action) {
        ("ndu643uUkFBt4YbXgHEfstkU25eEe4kDLjTD5uziEKx", Action::Stake) => ["Ad29pAAdYvYTcDzRHtA1req5an2DqFUfY1s5tkUC88Lr".to_string()].to_vec(), // vandals stake/claim cardinal-vandals
        ("ndu643uUkFBt4YbXgHEfstkU25eEe4kDLjTD5uziEKx", Action::Unstake) => ["4LKjUP41DkFy8C4FbZpFBfNtLaSixLEfS5adrFA9Z7CN".to_string()].to_vec(), // vandals unstake cardinal-vandals-2
        _ => default_allowed_payment_infos,
    };
    if !allowed_payment_infos.contains(&payment_info.to_string()) {
        return Err(error!(ErrorCode::InvalidPaymentInfo));
    }
    Ok(())
}
