pub mod errors;
pub mod instructions;
pub mod state;
pub mod utils;

use anchor_lang::prelude::*;
use instructions::*;

declare_id!("stk2688WVNGaHZGiLuuyGdQQWDdt8n69gEEo5eWYFt6");

#[program]
pub mod cardinal_stake_pool {
    use super::*;

    //// stake_pool ////
    pub fn init_pool(ctx: Context<InitPoolCtx>, ix: InitPoolIx) -> Result<()> {
        stake_pool::init_pool::handler(ctx, ix)
    }
    pub fn update_pool(ctx: Context<UpdatePoolCtx>, ix: UpdatePoolIx) -> Result<()> {
        stake_pool::update_pool::handler(ctx, ix)
    }
    pub fn close_stake_pool(ctx: Context<CloseStakePoolCtx>) -> Result<()> {
        stake_pool::close_stake_pool::handler(ctx)
    }

    //// stake_entry ////
    pub fn init_entry(ctx: Context<InitEntryCtx>, user: Pubkey) -> Result<()> {
        stake_entry::init_entry::handler(ctx, user)
    }
    pub fn reasssign_stake_entry(ctx: Context<ReassignStakeEntryCtx>, ix: ReassignStakeEntryIx) -> Result<()> {
        stake_entry::reassign_stake_entry::handler(ctx, ix)
    }
    pub fn update_total_stake_seconds(ctx: Context<UpdateTotalStakeSecondsCtx>) -> Result<()> {
        stake_entry::update_total_stake_seconds::handler(ctx)
    }
    pub fn close_stake_entry(ctx: Context<CloseStakeEntryCtx>) -> Result<()> {
        stake_entry::close_stake_entry::handler(ctx)
    }
    //// stake_entry::editions ////
    pub fn stake_edition<'key, 'accounts, 'remaining, 'info>(ctx: Context<'key, 'accounts, 'remaining, 'info, StakeEditionCtx<'info>>, amount: u64) -> Result<()> {
        stake_entry::editions::stake_edition::handler(ctx, amount)
    }
    pub fn unstake_edition<'key, 'accounts, 'remaining, 'info>(ctx: Context<'key, 'accounts, 'remaining, 'info, UnstakeEditionCtx<'info>>) -> Result<()> {
        stake_entry::editions::unstake_edition::handler(ctx)
    }

    //// authorization ////
    pub fn authorize_mint(ctx: Context<AuthorizeMintCtx>, mint: Pubkey) -> Result<()> {
        authorization::authorize_mint::handler(ctx, mint)
    }
    pub fn deauthorize_mint(ctx: Context<DeauthorizeMintCtx>) -> Result<()> {
        authorization::deauthorize_mint::handler(ctx)
    }

    //// stake_booster ////
    pub fn init_stake_booster(ctx: Context<InitStakeBoosterCtx>, ix: InitStakeBoosterIx) -> Result<()> {
        stake_booster::init_stake_booster::handler(ctx, ix)
    }
    pub fn update_stake_booster(ctx: Context<UpdateStakeBoosterCtx>, ix: UpdateStakeBoosterIx) -> Result<()> {
        stake_booster::update_stake_booster::handler(ctx, ix)
    }
    pub fn boost_stake_entry(ctx: Context<BoostStakeEntryCtx>, ix: BoostStakeEntryIx) -> Result<()> {
        stake_booster::boost_stake_entry::handler(ctx, ix)
    }
    pub fn close_stake_booster(ctx: Context<CloseStakeBoosterCtx>) -> Result<()> {
        stake_booster::close_stake_booster::handler(ctx)
    }

    //// reward_receipts ////
    //// reward_receipts::receipt_manager ////
    pub fn init_receipt_manager(ctx: Context<InitReceiptManagerCtx>, ix: InitReceiptManagerIx) -> Result<()> {
        reward_receipts::receipt_manager::init_receipt_manager::handler(ctx, ix)
    }
    pub fn update_receipt_manager(ctx: Context<UpdateReceiptManagerCtx>, ix: UpdateReceiptManagerIx) -> Result<()> {
        reward_receipts::receipt_manager::update_receipt_manager::handler(ctx, ix)
    }
    pub fn close_receipt_manager(ctx: Context<CloseReceiptManagerCtx>) -> Result<()> {
        reward_receipts::receipt_manager::close_receipt_manager::handler(ctx)
    }

    //// reward_receipts::receipt_entry ////
    pub fn init_receipt_entry(ctx: Context<InitReceiptEntryCtx>) -> Result<()> {
        reward_receipts::receipt_entry::init_receipt_entry::handler(ctx)
    }
    pub fn close_receipt_entry(ctx: Context<CloseReceiptEntryCtx>) -> Result<()> {
        reward_receipts::receipt_entry::close_receipt_entry::handler(ctx)
    }

    //// reward_receipts::reward_receipt ////
    pub fn init_reward_receipt(ctx: Context<InitRewardReceiptCtx>) -> Result<()> {
        reward_receipts::reward_receipt::init_reward_receipt::handler(ctx)
    }
    pub fn close_reward_receipt(ctx: Context<CloseRewardReceiptCtx>) -> Result<()> {
        reward_receipts::reward_receipt::close_reward_receipt::handler(ctx)
    }
    pub fn claim_reward_receipt(ctx: Context<ClaimRewardReceiptCtx>) -> Result<()> {
        reward_receipts::reward_receipt::claim_reward_receipt::handler(ctx)
    }
    pub fn set_reward_receipt_allowed(ctx: Context<SetRewardReceiptAllowedCtx>, allowed: bool) -> Result<()> {
        reward_receipts::reward_receipt::set_reward_receipt_allowed::handler(ctx, allowed)
    }

    //// reward_distribution ////
    //// reward_distribution::reward_distributor ////
    pub fn init_reward_distributor(ctx: Context<InitRewardDistributorCtx>, ix: InitRewardDistributorIx) -> Result<()> {
        reward_distribution::reward_distributor::init_reward_distributor::handler(ctx, ix)
    }
    pub fn update_reward_distributor(ctx: Context<UpdateRewardDistributorCtx>, ix: UpdateRewardDistributorIx) -> Result<()> {
        reward_distribution::reward_distributor::update_reward_distributor::handler(ctx, ix)
    }
    pub fn close_reward_distributor(ctx: Context<CloseRewardDistributorCtx>) -> Result<()> {
        reward_distribution::reward_distributor::close_reward_distributor::handler(ctx)
    }

    //// reward_distribution::reward_entry ////
    pub fn init_reward_entry(ctx: Context<InitRewardEntryCtx>) -> Result<()> {
        reward_distribution::reward_entry::init_reward_entry::handler(ctx)
    }
    pub fn close_reward_entry(ctx: Context<CloseRewardEntryCtx>) -> Result<()> {
        reward_distribution::reward_entry::close_reward_entry::handler(ctx)
    }
    pub fn update_reward_entry(ctx: Context<UpdateRewardEntryCtx>, ix: UpdateRewardEntryIx) -> Result<()> {
        reward_distribution::reward_entry::update_reward_entry::handler(ctx, ix)
    }
    pub fn claim_rewards(ctx: Context<ClaimRewardsCtx>) -> Result<()> {
        reward_distribution::reward_entry::claim_rewards::handler(ctx)
    }
}
