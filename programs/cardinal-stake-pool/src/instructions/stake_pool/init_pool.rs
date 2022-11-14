use crate::state::*;
use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitPoolIx {
    requires_collections: Vec<Pubkey>,
    requires_creators: Vec<Pubkey>,
    requires_authorization: bool,
    authority: Pubkey,
    reset_on_unstake: bool,
    cooldown_seconds: Option<u32>,
    min_stake_seconds: Option<u32>,
    end_date: Option<i64>,
    payment_amount: Option<u64>,
    payment_mint: Option<Pubkey>,
    payment_manager: Option<Pubkey>,
    identifier: String,
}

#[derive(Accounts)]
#[instruction(ix: InitPoolIx)]
pub struct InitPoolCtx<'info> {
    #[account(
        init,
        payer = payer,
        space = STAKE_POOL_SIZE,
        seeds = [STAKE_POOL_PREFIX.as_bytes(), ix.identifier.as_ref()],
        bump
    )]
    stake_pool: Account<'info, StakePool>,

    #[account(mut)]
    payer: Signer<'info>,
    system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitPoolCtx>, ix: InitPoolIx) -> Result<()> {
    let stake_pool = &mut ctx.accounts.stake_pool;
    stake_pool.bump = *ctx.bumps.get("stake_pool").unwrap();
    stake_pool.identifier = ix.identifier;
    stake_pool.requires_collections = ix.requires_collections;
    stake_pool.requires_creators = ix.requires_creators;
    stake_pool.requires_authorization = ix.requires_authorization;
    stake_pool.authority = ix.authority;
    stake_pool.reset_on_unstake = ix.reset_on_unstake;
    stake_pool.total_staked = 0;
    stake_pool.cooldown_seconds = ix.cooldown_seconds;
    stake_pool.min_stake_seconds = ix.min_stake_seconds;
    stake_pool.end_date = ix.end_date;
    stake_pool.payment_mint = ix.payment_mint;
    stake_pool.payment_amount = ix.payment_amount;
    stake_pool.payment_manager = ix.payment_manager;
    if let Some(payment_manager) = ix.payment_manager {
        assert_stake_pool_payment_manager(&payment_manager).expect("Payment manager error");
    }
    Ok(())
}
