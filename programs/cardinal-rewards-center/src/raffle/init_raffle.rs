use crate::errors::ErrorCode;
use crate::utils::resize_account;
use crate::Raffle;
use crate::StakePool;
use crate::RAFFLE_DEFAULT_SIZE;
use crate::RAFFLE_PREFIX;
use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitRaffleIx {
    authority: Pubkey,
    stake_pool: Pubkey,
    total_winners: u64,
    min_stake_seconds_to_use: u128,
    max_stake_seconds_to_use: u128,
    end_date: i64,
    name: String,
}

#[derive(Accounts)]
#[instruction(ix: InitRaffleIx)]
pub struct InitRaffleCtx<'info> {
    #[account(
        init,
        payer = payer,
        space = RAFFLE_DEFAULT_SIZE,
        seeds = [RAFFLE_PREFIX.as_bytes(), stake_pool.key().as_ref(), ix.name.as_ref()],
        bump,
    )]
    raffle: Box<Account<'info, Raffle>>,
    stake_pool: Box<Account<'info, StakePool>>,
    #[account(mut, constraint = authority.key() == stake_pool.authority @ ErrorCode::InvalidAuthority)]
    authority: Signer<'info>,
    #[account(mut)]
    payer: Signer<'info>,
    system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitRaffleCtx>, ix: InitRaffleIx) -> Result<()> {
    let raffle = &mut ctx.accounts.raffle;

    // assert_payment_info(ctx.accounts.stake_pool.key(), Action::Stake, ix.stake_payment_info)?;
    // assert_payment_info(ctx.accounts.stake_pool.key(), Action::Unstake, ix.unstake_payment_info)?;

    let bump = *ctx.bumps.get("raffle").unwrap();
    let raffle_data = Raffle {
        bump,
        authority: ix.authority,
        stake_pool: ctx.accounts.stake_pool.key(),
        total_winners: ix.total_winners,
        winner_count: 0,
        min_stake_seconds_to_use: ix.min_stake_seconds_to_use,
        max_stake_seconds_to_use: ix.max_stake_seconds_to_use,
        raffle_tickets: Vec::new(),
        end_date: ix.end_date,
        name: ix.name,
    };

    raffle.set_inner(raffle_data);
    resize_account(
        &raffle.to_account_info(),
        8 + raffle.try_to_vec()?.len(),
        &ctx.accounts.payer.to_account_info(),
        &ctx.accounts.system_program.to_account_info(),
    )?;
    Ok(())
}
