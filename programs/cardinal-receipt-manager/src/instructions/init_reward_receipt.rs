use cardinal_stake_pool::state::StakeEntry;

use {
    crate::{errors::ErrorCode, state::*},
    anchor_lang::prelude::*,
};

#[derive(Accounts)]
pub struct InitRewardReceiptCtx<'info> {
    #[account(
        init,
        payer = payer,
        space = REWARD_RECEIPT_SIZE,
        seeds = [REWARD_RECEIPT_SEED.as_bytes(), receipt_manager.key().as_ref(), receipt_entry.key().as_ref()],
        bump,
    )]
    reward_receipt: Box<Account<'info, RewardReceipt>>,
    receipt_manager: Box<Account<'info, ReceiptManager>>,
    #[account(constraint = receipt_entry.stake_entry == stake_entry.key() @ ErrorCode::InvalidReceiptEntry)]
    receipt_entry: Box<Account<'info, ReceiptEntry>>,

    #[account(constraint = stake_entry.pool == receipt_manager.stake_pool @ ErrorCode::InvalidStakeEntry)]
    stake_entry: Box<Account<'info, StakeEntry>>,

    #[account(mut)]
    payer: Signer<'info>,
    system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitRewardReceiptCtx>) -> Result<()> {
    let reward_receipt = &mut ctx.accounts.reward_receipt;
    reward_receipt.bump = *ctx.bumps.get("reward_receipt").unwrap();
    reward_receipt.receipt_entry = ctx.accounts.receipt_entry.key();
    reward_receipt.receipt_manager = ctx.accounts.receipt_manager.key();
    reward_receipt.target = Pubkey::default();

    reward_receipt.allowed = true;
    if ctx.accounts.receipt_manager.requires_authorization {
        reward_receipt.allowed = false;
    }
    Ok(())
}
