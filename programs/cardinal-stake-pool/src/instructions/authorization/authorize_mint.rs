use mpl_token_metadata::{state::Metadata, utils::assert_derivation};
use std::slice::Iter;

use {
    crate::{errors::ErrorCode, state::*},
    anchor_lang::prelude::*,
};

#[derive(Accounts)]
#[instruction(mint: Pubkey)]
pub struct AuthorizeMintCtx<'info> {
    #[account(mut)]
    stake_pool: Account<'info, StakePool>,
    #[account(
        init,
        payer = payer,
        space = STAKE_POOL_SIZE,
        seeds = [STAKE_AUTHORIZATION_PREFIX.as_bytes(), stake_pool.key().as_ref(), mint.as_ref()],
        bump
    )]
    stake_authorization_record: Account<'info, StakeAuthorizationRecord>,

    #[account(mut, constraint = payer.key() == stake_pool.authority @ ErrorCode::InvalidPoolAuthority)]
    payer: Signer<'info>,
    system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<AuthorizeMintCtx>, mint: Pubkey) -> Result<()> {
    let stake_authorization_record = &mut ctx.accounts.stake_authorization_record;
    stake_authorization_record.bump = *ctx.bumps.get("stake_authorization_record").unwrap();
    stake_authorization_record.pool = ctx.accounts.stake_pool.key();
    stake_authorization_record.mint = mint;

    Ok(())
}

pub fn mint_is_allowed(stake_pool: &Box<Account<StakePool>>, stake_mint_metadata: &AccountInfo, stake_mint: Pubkey, remaining_accounts: &mut Iter<AccountInfo>) -> Result<()> {
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
