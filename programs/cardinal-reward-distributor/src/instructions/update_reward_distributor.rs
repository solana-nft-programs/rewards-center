use {
    crate::{errors::ErrorCode, state::*},
    anchor_lang::prelude::*,
};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct UpdateRewardDistributorIx {
    pub default_multiplier: u64,
    pub multiplier_decimals: u8,
    pub reward_amount: u64,
    pub reward_duration_seconds: u128,
    pub max_reward_seconds_received: Option<u128>,
}

#[derive(Accounts)]
#[instruction(ix: UpdateRewardDistributorIx)]
pub struct UpdateRewardDistributorCtx<'info> {
    #[account(mut)]
    reward_distributor: Box<Account<'info, RewardDistributor>>,
    #[account(constraint = authority.key() == reward_distributor.authority @ ErrorCode::InvalidRewardDistributorAuthority)]
    authority: Signer<'info>,
}

pub fn handler(ctx: Context<UpdateRewardDistributorCtx>, ix: UpdateRewardDistributorIx) -> Result<()> {
    let reward_distributor = &mut ctx.accounts.reward_distributor;
    reward_distributor.default_multiplier = ix.default_multiplier;
    reward_distributor.multiplier_decimals = ix.multiplier_decimals;
    reward_distributor.reward_amount = ix.reward_amount;
    reward_distributor.reward_duration_seconds = ix.reward_duration_seconds;
    reward_distributor.max_reward_seconds_received = ix.max_reward_seconds_received;
    Ok(())
}
