use cardinal_stake_pool::state::StakePool;

use {crate::state::*, anchor_lang::prelude::*};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitReceiptManagerIx {
    pub name: String,
    pub authority: Pubkey,
    pub required_stake_seconds: u128,
    pub stake_seconds_to_use: u128,
    pub payment_mint: Pubkey,
    pub payment_manager: Pubkey,
    pub payment_recipient: Pubkey,
    pub requires_authorization: bool,
    pub max_claimed_receipts: Option<u128>,
}

#[derive(Accounts)]
#[instruction(ix: InitReceiptManagerIx)]
pub struct InitReceiptManagerCtx<'info> {
    #[account(
        init,
        payer = payer,
        space = RECEIPT_MANAGER_SIZE,
        seeds = [RECEIPT_MANAGER_SEED.as_bytes(), stake_pool.key().as_ref(), ix.name.as_ref()],
        bump,
    )]
    receipt_manager: Box<Account<'info, ReceiptManager>>,
    stake_pool: Box<Account<'info, StakePool>>,

    #[account(mut)]
    payer: Signer<'info>,
    system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitReceiptManagerCtx>, ix: InitReceiptManagerIx) -> Result<()> {
    let receipt_manager = &mut ctx.accounts.receipt_manager;
    assert_allowed_payment_info(&ix.payment_mint.to_string())?;
    assert_allowed_payment_manager(&ix.payment_manager.to_string(), &ix.payment_recipient.to_string())?;

    receipt_manager.bump = *ctx.bumps.get("receipt_manager").unwrap();
    receipt_manager.name = ix.name;
    receipt_manager.stake_pool = ctx.accounts.stake_pool.key();
    receipt_manager.authority = ix.authority;
    receipt_manager.required_stake_seconds = ix.required_stake_seconds;
    receipt_manager.stake_seconds_to_use = ix.stake_seconds_to_use;
    receipt_manager.claimed_receipts_counter = 0;
    receipt_manager.payment_mint = ix.payment_mint;
    receipt_manager.payment_manager = ix.payment_manager;
    receipt_manager.payment_recipient = ix.payment_recipient;
    receipt_manager.requires_authorization = ix.requires_authorization;
    receipt_manager.max_claimed_receipts = ix.max_claimed_receipts;

    Ok(())
}
