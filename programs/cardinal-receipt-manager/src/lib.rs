pub mod errors;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;
use instructions::*;

declare_id!("rrm26Uq1x1Rx8TwZaReKqUEu5fnNKufyANpgbon5otp");

#[program]
pub mod cardinal_receipt_manager {
    use super::*;

    pub fn init_receipt_manager(ctx: Context<InitReceiptManagerCtx>, ix: InitReceiptManagerIx) -> Result<()> {
        init_receipt_manager::handler(ctx, ix)
    }

    pub fn init_receipt_entry(ctx: Context<InitReceiptEntryCtx>) -> Result<()> {
        init_receipt_entry::handler(ctx)
    }

    pub fn init_reward_receipt(ctx: Context<InitRewardReceiptCtx>) -> Result<()> {
        init_reward_receipt::handler(ctx)
    }

    pub fn claim_reward_receipt(ctx: Context<CreateRewardReceiptCtx>) -> Result<()> {
        claim_reward_receipt::handler(ctx)
    }

    pub fn set_reward_receipt_allowed(ctx: Context<SetRewardReceiptAllowed>, allowed: bool) -> Result<()> {
        set_reward_receipt_allowed::handler(ctx, allowed)
    }

    pub fn update_receipt_manager(ctx: Context<UpdateRewarReceiptManagerCtx>, ix: UpdateReceiptManagerIx) -> Result<()> {
        update_receipt_manager::handler(ctx, ix)
    }

    pub fn close_receipt_manager(ctx: Context<CloseReceiptManagerCtx>) -> Result<()> {
        close_receipt_manager::handler(ctx)
    }

    pub fn close_reward_receipt(ctx: Context<CloseRewardReceiptCtx>) -> Result<()> {
        close_reward_receipt::handler(ctx)
    }

    pub fn close_receipt_entry(ctx: Context<CloseReceiptEntryCtx>) -> Result<()> {
        close_receipt_entry::handler(ctx)
    }
}
