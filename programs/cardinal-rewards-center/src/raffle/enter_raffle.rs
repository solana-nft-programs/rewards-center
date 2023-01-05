use crate::errors::ErrorCode;
use crate::utils::resize_account;
use crate::Raffle;
use crate::RaffleTicket;
use crate::StakeEntry;
use crate::StakePool;
use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct EnterRaffleIx {
    stake_seconds: u128,
}

#[derive(Accounts)]
pub struct EnterRaffleCtx<'info> {
    #[account(mut)]
    raffle: Box<Account<'info, Raffle>>,
    #[account(mut, constraint = stake_pool.key() == raffle.stake_pool @ ErrorCode::InvalidStakePool)]
    stake_pool: Box<Account<'info, StakePool>>,
    #[account(mut, constraint = stake_entry.pool == stake_pool.key() @ ErrorCode::InvalidStakeEntry)]
    stake_entry: Box<Account<'info, StakeEntry>>,
    #[account(mut, constraint = last_staker.key() == stake_entry.last_staker @ ErrorCode::InvalidLastStaker)]
    last_staker: Signer<'info>,
    #[account(mut)]
    payer: Signer<'info>,
    system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<EnterRaffleCtx>, ix: EnterRaffleIx) -> Result<()> {
    let raffle = &mut ctx.accounts.raffle;

    let raffle_tickets = &mut raffle.raffle_tickets;
    let cumulative_stake_seconds = if let Some(last_ticket) = raffle_tickets.last() { last_ticket.cumulative_stake_seconds } else { 0 };
    let raffle_ticket = RaffleTicket {
        recipient: ctx.accounts.last_staker.key(),
        cumulative_stake_seconds: cumulative_stake_seconds.checked_add(ix.stake_seconds).expect("Add error"),
        unix_seconds: Clock::get()?.unix_timestamp,
    };
    raffle_tickets.push(raffle_ticket);
    raffle.raffle_tickets = raffle_tickets.to_vec();

    // add to used seconds
    let stake_entry = &mut ctx.accounts.stake_entry;
    stake_entry.used_stake_seconds = stake_entry.used_stake_seconds.checked_add(ix.stake_seconds).expect("Add error");
    if stake_entry.used_stake_seconds > ctx.accounts.stake_entry.total_stake_seconds {
        return Err(error!(ErrorCode::InsufficientAvailableStakeSeconds));
    }

    resize_account(
        &raffle.to_account_info(),
        raffle.try_to_vec()?.len() + 8,
        &ctx.accounts.payer.to_account_info(),
        &ctx.accounts.system_program.to_account_info(),
    )?;

    Ok(())
}
