use crate::errors::ErrorCode;
use crate::Raffle;
use crate::RaffleWinner;
use crate::RAFFLE_WINNER_DEFAULT_SIZE;
use crate::RAFFLE_WINNER_PREFIX;
use anchor_lang::prelude::*;
use arrayref::array_ref;
use solana_program::sysvar::{self};

#[derive(Accounts)]
pub struct ExecuteRaffleCtx<'info> {
    #[account(mut)]
    raffle: Box<Account<'info, Raffle>>,
    #[account(
        init,
        payer = payer,
        space = RAFFLE_WINNER_DEFAULT_SIZE,
        seeds = [RAFFLE_WINNER_PREFIX.as_bytes(), raffle.key().as_ref(), raffle.winner_count.to_le_bytes().as_ref()],
        bump,
    )]
    raffle_winner: Box<Account<'info, RaffleWinner>>,
    #[account(mut)]
    executor: Signer<'info>,
    #[account(mut)]
    payer: Signer<'info>,
    system_program: Program<'info, System>,
    /// CHECK: account constraints checked in account trait
    #[account(address = sysvar::slot_hashes::id())]
    recent_slothashes: UncheckedAccount<'info>,
}

pub fn handler(ctx: Context<ExecuteRaffleCtx>) -> Result<()> {
    let raffle = &mut ctx.accounts.raffle;
    let winner_count = raffle.winner_count.checked_add(1).expect("Add error");
    if winner_count > raffle.total_winners {
        return Err(error!(ErrorCode::InvalidRaffle));
    }

    // get pseudo random number
    let recent_slothashes = &ctx.accounts.recent_slothashes;
    let recent_slothashes_data = recent_slothashes.data.borrow();
    let recent_slothash = array_ref![recent_slothashes_data, 12, 8];
    let unix_seconds = Clock::get()?.unix_timestamp;
    let pseudo_random_num = u128::MAX
        .checked_sub(u64::from_le_bytes(*recent_slothash).saturating_mul(unix_seconds.try_into().expect("Conversion error")).into())
        .expect("Sub error");

    // TODO better random number
    let cumulative_seconds = raffle.raffle_tickets.last().expect("Error getting last ticket").cumulative_stake_seconds;
    let winning_ticket_number = pseudo_random_num.checked_rem(cumulative_seconds).expect("Mod error");

    let winning_ticket_ix = raffle
        .raffle_tickets
        .binary_search_by_key(&winning_ticket_number, |t| t.cumulative_stake_seconds)
        .expect("Error binary searching");
    let winning_ticket = raffle.raffle_tickets.get(winning_ticket_ix).expect("Error getting ticket");

    let raffle_winner = &mut ctx.accounts.raffle_winner;
    raffle_winner.bump = *ctx.bumps.get("raffle_winner").unwrap();
    raffle_winner.recipient = winning_ticket.recipient;
    raffle_winner.raffle = raffle.key();
    Ok(())
}
