use mpl_token_metadata::utils::assert_derivation;

use {
    crate::{errors::ErrorCode, state::*},
    anchor_lang::prelude::*,
    anchor_spl::token::Mint,
    mpl_token_metadata::state::Metadata,
    mpl_token_metadata::{self},
};

#[derive(Accounts)]
#[instruction(user: Pubkey)]
pub struct InitEntryCtx<'info> {
    #[account(
        init,
        payer = payer,
        space = STAKE_ENTRY_SIZE,
        seeds = [STAKE_ENTRY_PREFIX.as_bytes(), stake_pool.key().as_ref(), original_mint.key().as_ref(), get_stake_seed(original_mint.supply, user).as_ref()],
        bump,
    )]
    stake_entry: Box<Account<'info, StakeEntry>>,
    #[account(mut)]
    stake_pool: Box<Account<'info, StakePool>>,

    original_mint: Box<Account<'info, Mint>>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    original_mint_metadata: AccountInfo<'info>,

    #[account(mut)]
    payer: Signer<'info>,
    system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitEntryCtx>, _user: Pubkey) -> Result<()> {
    let stake_entry = &mut ctx.accounts.stake_entry;
    let stake_pool = &ctx.accounts.stake_pool;
    stake_entry.bump = *ctx.bumps.get("stake_entry").unwrap();
    stake_entry.pool = ctx.accounts.stake_pool.key();
    stake_entry.original_mint = ctx.accounts.original_mint.key();
    stake_entry.amount = 0;

    // assert metadata account derivation
    assert_derivation(
        &mpl_token_metadata::id(),
        &ctx.accounts.original_mint_metadata.to_account_info(),
        &[
            mpl_token_metadata::state::PREFIX.as_bytes(),
            mpl_token_metadata::id().as_ref(),
            ctx.accounts.original_mint.key().as_ref(),
        ],
    )?;
    // check allowlist
    if !stake_pool.requires_creators.is_empty() || !stake_pool.requires_collections.is_empty() || stake_pool.requires_authorization {
        let mut allowed = false;

        if !ctx.accounts.original_mint_metadata.data_is_empty() {
            let mint_metadata_data = ctx.accounts.original_mint_metadata.try_borrow_mut_data().expect("Failed to borrow data");
            if ctx.accounts.original_mint_metadata.to_account_info().owner.key() != mpl_token_metadata::id() {
                return Err(error!(ErrorCode::InvalidMintMetadataOwner));
            }
            let original_mint_metadata = Metadata::deserialize(&mut mint_metadata_data.as_ref()).expect("Failed to deserialize metadata");
            if original_mint_metadata.mint != ctx.accounts.original_mint.key() {
                return Err(error!(ErrorCode::InvalidMintMetadata));
            }

            if !stake_pool.requires_creators.is_empty() && original_mint_metadata.data.creators.is_some() {
                let creators = original_mint_metadata.data.creators.unwrap();
                let find = creators.iter().find(|c| stake_pool.requires_creators.contains(&c.address) && c.verified);
                if find.is_some() {
                    allowed = true
                };
            }

            if !stake_pool.requires_collections.is_empty() && original_mint_metadata.collection.is_some() {
                let collection = original_mint_metadata.collection.unwrap();
                if collection.verified && stake_pool.requires_collections.contains(&collection.key) {
                    allowed = true
                }
            }
        }

        if stake_pool.requires_authorization && !allowed {
            let remaining_accs = &mut ctx.remaining_accounts.iter();
            let stake_entry_authorization_info = next_account_info(remaining_accs)?;
            let stake_entry_authorization_account = match Account::<StakeAuthorizationRecord>::try_from(stake_entry_authorization_info) {
                Ok(record) => record,
                Err(_) => return Err(error!(ErrorCode::InvalidStakeAuthorizationRecord)),
            };
            if stake_entry_authorization_account.pool == stake_entry.pool && stake_entry_authorization_account.mint == stake_entry.original_mint {
                allowed = true;
            }
        }
        if !allowed {
            return Err(error!(ErrorCode::MintNotAllowedInPool));
        }
    }

    Ok(())
}
