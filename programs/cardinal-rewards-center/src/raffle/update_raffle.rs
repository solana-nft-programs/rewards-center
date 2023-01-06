use crate::errors::ErrorCode;
use crate::utils::resize_account;
use crate::Raffle;
use crate::StakePool;
use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct UpdateRaffleIx {
    authority: Pubkey,
    total_winners: u64,
    min_stake_seconds_to_use: u128,
    max_stake_seconds_to_use: u128,
    end_date: i64,
}

#[derive(Accounts)]
pub struct UpdateRaffleCtx<'info> {
    #[account(mut)]
    raffle: Box<Account<'info, Raffle>>,
    #[account(mut, constraint = raffle.stake_pool == stake_pool.key() @ ErrorCode::InvalidStakePool)]
    stake_pool: Box<Account<'info, StakePool>>,
    #[account(mut, constraint = authority.key() == stake_pool.authority @ ErrorCode::InvalidAuthority)]
    authority: Signer<'info>,
    #[account(mut)]
    payer: Signer<'info>,
    system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<UpdateRaffleCtx>, ix: UpdateRaffleIx) -> Result<()> {
    let raffle = &mut ctx.accounts.raffle;

    // assert_payment_info(stake_pool.key(), Action::Stake, ix.stake_payment_info)?;
    // assert_payment_info(stake_pool.key(), Action::Unstake, ix.unstake_payment_info)?;

    let new_raffle = Raffle {
        bump: raffle.bump,
        authority: ix.authority,
        stake_pool: ctx.accounts.stake_pool.key(),
        total_winners: ix.total_winners,
        winner_count: raffle.winner_count,
        min_stake_seconds_to_use: ix.min_stake_seconds_to_use,
        max_stake_seconds_to_use: ix.max_stake_seconds_to_use,
        raffle_tickets: Vec::new(),
        end_date: ix.end_date,
        name: raffle.name.clone(),
    };

    if ix.total_winners < raffle.winner_count {
        return Err(error!(ErrorCode::InvalidRaffle));
    }

    raffle.set_inner(new_raffle);
    resize_account(
        &raffle.to_account_info(),
        8 + raffle.try_to_vec()?.len(),
        &ctx.accounts.payer.to_account_info(),
        &ctx.accounts.system_program.to_account_info(),
    )?;
    Ok(())
}
