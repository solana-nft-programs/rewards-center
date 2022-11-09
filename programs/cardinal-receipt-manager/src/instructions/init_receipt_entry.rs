use {crate::state::*, anchor_lang::prelude::*, cardinal_stake_pool::state::StakeEntry};

#[derive(Accounts)]
pub struct InitReceiptEntryCtx<'info> {
    #[account(
        init,
        payer = payer,
        space = RECEIPT_ENTRY_SIZE,
        seeds = [RECEIPT_ENTRY_SEED.as_bytes(), stake_entry.key().as_ref()],
        bump,
    )]
    receipt_entry: Box<Account<'info, ReceiptEntry>>,
    stake_entry: Box<Account<'info, StakeEntry>>,

    #[account(mut)]
    payer: Signer<'info>,
    system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitReceiptEntryCtx>) -> Result<()> {
    let receipt_entry = &mut ctx.accounts.receipt_entry;
    receipt_entry.bump = *ctx.bumps.get("receipt_entry").unwrap();
    receipt_entry.stake_entry = ctx.accounts.stake_entry.key();
    receipt_entry.used_stake_seconds = 0;
    Ok(())
}
