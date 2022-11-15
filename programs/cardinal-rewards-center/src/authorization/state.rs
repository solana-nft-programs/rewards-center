use anchor_lang::prelude::*;
use mpl_token_metadata::state::Metadata;
use mpl_token_metadata::utils::assert_derivation;
use std::slice::Iter;

use crate::errors::ErrorCode;
use crate::StakePool;

pub const STAKE_AUTHORIZATION_PREFIX: &str = "stake-authorization";
pub const STAKE_AUTHORIZATION_SIZE: usize = 8 + std::mem::size_of::<StakeAuthorizationRecord>() + 8;

#[account]
pub struct StakeAuthorizationRecord {
    pub bump: u8,
    pub pool: Pubkey,
    pub mint: Pubkey,
}

pub fn mint_is_allowed(stake_pool: &Account<StakePool>, stake_mint_metadata: &AccountInfo, stake_mint: Pubkey, remaining_accounts: &mut Iter<AccountInfo>) -> Result<()> {
    assert_derivation(
        &mpl_token_metadata::id(),
        &stake_mint_metadata.to_account_info(),
        &[mpl_token_metadata::state::PREFIX.as_bytes(), mpl_token_metadata::id().as_ref(), stake_mint.as_ref()],
    )?;

    if !stake_pool.requires_creators.is_empty() || !stake_pool.requires_collections.is_empty() || stake_pool.requires_authorization {
        let mut allowed = false;

        if !stake_mint_metadata.data_is_empty() {
            let mint_metadata_data = stake_mint_metadata.try_borrow_mut_data().expect("Failed to borrow data");
            if stake_mint_metadata.to_account_info().owner.key() != mpl_token_metadata::id() {
                return Err(error!(ErrorCode::InvalidMintMetadataOwner));
            }
            let stake_mint_metadata = Metadata::deserialize(&mut mint_metadata_data.as_ref()).expect("Failed to deserialize metadata");
            if stake_mint_metadata.mint != stake_mint.key() {
                return Err(error!(ErrorCode::InvalidMintMetadata));
            }

            if !stake_pool.requires_creators.is_empty() && stake_mint_metadata.data.creators.is_some() {
                let creators = stake_mint_metadata.data.creators.unwrap();
                let find = creators.iter().find(|c| stake_pool.requires_creators.contains(&c.address) && c.verified);
                if find.is_some() {
                    allowed = true
                };
            }

            if !stake_pool.requires_collections.is_empty() && stake_mint_metadata.collection.is_some() {
                let collection = stake_mint_metadata.collection.unwrap();
                if collection.verified && stake_pool.requires_collections.contains(&collection.key) {
                    allowed = true
                }
            }
        }

        if stake_pool.requires_authorization && !allowed {
            let stake_entry_authorization_info = next_account_info(remaining_accounts)?;
            let stake_entry_authorization_account = match Account::<StakeAuthorizationRecord>::try_from(stake_entry_authorization_info) {
                Ok(record) => record,
                Err(_) => return Err(error!(ErrorCode::InvalidStakeAuthorizationRecord)),
            };
            if stake_entry_authorization_account.pool == stake_pool.key() && stake_entry_authorization_account.mint == stake_mint {
                allowed = true;
            }
        }
        if !allowed {
            return Err(error!(ErrorCode::MintNotAllowedInPool));
        }
    }
    Ok(())
}
