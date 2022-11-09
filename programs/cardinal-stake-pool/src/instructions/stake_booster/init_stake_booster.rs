use {
    crate::{errors::ErrorCode, state::*},
    anchor_lang::prelude::*,
};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitStakeBoosterIx {
    stake_pool: Pubkey,
    identifier: u64,
    payment_amount: u64,
    payment_mint: Pubkey,
    payment_manager: Pubkey,
    boost_seconds: u128,
    start_time_seconds: i64,
}

#[derive(Accounts)]
#[instruction(ix: InitStakeBoosterIx)]
pub struct InitStakeBoosterCtx<'info> {
    #[account(
        init,
        payer = payer,
        space = STAKE_BOOSTER_SIZE,
        seeds = [STAKE_BOOSTER_PREFIX.as_bytes(), stake_pool.key().as_ref(), ix.identifier.to_le_bytes().as_ref()],
        bump,
    )]
    stake_booster: Box<Account<'info, StakeBooster>>,
    #[account(mut)]
    stake_pool: Box<Account<'info, StakePool>>,
    #[account(mut, constraint = authority.key() == stake_pool.authority @ ErrorCode::InvalidAuthority)]
    authority: Signer<'info>,
    #[account(mut)]
    payer: Signer<'info>,
    system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitStakeBoosterCtx>, ix: InitStakeBoosterIx) -> Result<()> {
    let stake_booster = &mut ctx.accounts.stake_booster;
    assert_stake_boost_payment_manager(&ix.payment_manager)?;
    stake_booster.bump = *ctx.bumps.get("stake_booster").unwrap();
    stake_booster.stake_pool = ctx.accounts.stake_pool.key();
    stake_booster.identifier = ix.identifier;
    stake_booster.payment_amount = ix.payment_amount;
    stake_booster.payment_mint = ix.payment_mint;
    stake_booster.payment_manager = ix.payment_manager;
    stake_booster.boost_seconds = ix.boost_seconds;
    stake_booster.start_time_seconds = ix.start_time_seconds;

    Ok(())
}
