use super::StakeBooster;
use crate::assert_payment_info;
use crate::errors::ErrorCode;
use crate::Action;
use crate::StakePool;
use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct UpdateStakeBoosterIx {
    payment_info: Pubkey,
    boost_seconds: u128,
    start_time_seconds: i64,
    boost_action_payment_info: Pubkey,
}

#[derive(Accounts)]
pub struct UpdateStakeBoosterCtx<'info> {
    #[account(mut)]
    stake_booster: Box<Account<'info, StakeBooster>>,
    #[account(mut, constraint = stake_booster.stake_pool == stake_pool.key() @ ErrorCode::InvalidStakePool)]
    stake_pool: Box<Account<'info, StakePool>>,
    #[account(mut, constraint = authority.key() == stake_pool.authority @ ErrorCode::InvalidAuthority)]
    authority: Signer<'info>,
}

pub fn handler(ctx: Context<UpdateStakeBoosterCtx>, ix: UpdateStakeBoosterIx) -> Result<()> {
    let stake_booster = &mut ctx.accounts.stake_booster;
    assert_payment_info(stake_booster.stake_pool, Action::BoostStakeEntry, ix.boost_action_payment_info)?;

    stake_booster.payment_info = ix.payment_info;
    stake_booster.boost_seconds = ix.boost_seconds;
    stake_booster.start_time_seconds = ix.start_time_seconds;
    stake_booster.boost_action_payment_info = ix.boost_action_payment_info;

    Ok(())
}
