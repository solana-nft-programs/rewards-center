use crate::errors::ErrorCode;
use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct UpdateTotalStakeSecondsCtx<'info> {
    #[account(mut, constraint = stake_entry.last_staker != Pubkey::default() @ ErrorCode::CannotUpdateUnstakedEntry)]
    stake_entry: Account<'info, StakeEntry>,

    #[account(mut)]
    updater: Signer<'info>,
}

pub fn handler(ctx: Context<UpdateTotalStakeSecondsCtx>) -> Result<()> {
    let stake_entry = &mut ctx.accounts.stake_entry;

    //// FEATURE: Cooldown
    if stake_entry.cooldown_start_seconds.is_some() {
        return Err(error!(ErrorCode::CooldownSecondRemaining));
    }

    increment_total_stake_seconds(stake_entry)?;
    Ok(())
}

pub fn increment_total_stake_seconds(stake_entry: &mut Account<StakeEntry>) -> Result<()> {
    stake_entry.total_stake_seconds = stake_entry.total_stake_seconds.saturating_add(
        (u128::try_from(stake_entry.cooldown_start_seconds.unwrap_or(Clock::get().unwrap().unix_timestamp))
            .unwrap()
            .saturating_sub(u128::try_from(stake_entry.last_updated_at).unwrap()))
        .checked_mul(u128::try_from(stake_entry.amount).unwrap())
        .unwrap(),
    );
    stake_entry.last_updated_at = Clock::get().unwrap().unix_timestamp;
    Ok(())
}
