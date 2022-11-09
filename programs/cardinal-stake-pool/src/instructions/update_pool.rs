use {crate::state::*, anchor_lang::prelude::*};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct UpdatePoolIx {
    image_uri: Option<String>,
    overlay_text: String,
    requires_collections: Vec<Pubkey>,
    requires_creators: Vec<Pubkey>,
    requires_authorization: bool,
    authority: Pubkey,
    reset_on_stake: bool,
    cooldown_seconds: Option<u32>,
    min_stake_seconds: Option<u32>,
    end_date: Option<i64>,
}

#[derive(Accounts)]
#[instruction(ix: UpdatePoolIx)]
pub struct UpdatePoolCtx<'info> {
    #[account(mut, constraint = stake_pool.authority == payer.key())]
    stake_pool: Account<'info, StakePool>,

    #[account(mut)]
    payer: Signer<'info>,
}

pub fn handler(ctx: Context<UpdatePoolCtx>, ix: UpdatePoolIx) -> Result<()> {
    let stake_pool = &mut ctx.accounts.stake_pool;
    stake_pool.requires_collections = ix.requires_collections;
    stake_pool.requires_creators = ix.requires_creators;
    stake_pool.requires_authorization = ix.requires_authorization;
    stake_pool.overlay_text = ix.overlay_text;
    stake_pool.authority = ix.authority;
    stake_pool.reset_on_stake = ix.reset_on_stake;
    stake_pool.end_date = ix.end_date;
    stake_pool.cooldown_seconds = ix.cooldown_seconds;
    stake_pool.min_stake_seconds = ix.min_stake_seconds;
    stake_pool.image_uri = ix.image_uri.unwrap_or_else(|| stake_pool.image_uri.clone());

    // zero extra data
    let stake_pool_account = stake_pool.to_account_info();
    let mut stake_pool_data = stake_pool_account.data.borrow_mut();
    let len = stake_pool_data.len();
    stake_pool_data[stake_pool.try_to_vec()?.len()..len].iter_mut().for_each(|d| *d = 0);
    Ok(())
}
