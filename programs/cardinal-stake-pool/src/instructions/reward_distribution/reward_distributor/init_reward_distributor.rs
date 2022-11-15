use crate::instructions::reward_distribution::RewardDistributor;
use crate::instructions::reward_distribution::REWARD_DISTRIBUTOR_SEED;
use crate::instructions::reward_distribution::REWARD_DISTRIBUTOR_SIZE;
use crate::state::StakePool;
use anchor_lang::prelude::*;
use anchor_spl::token::Mint;
use anchor_spl::token::Token;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitRewardDistributorIx {
    pub reward_amount: u64,
    pub reward_duration_seconds: u128,
    pub kind: u8,
    pub supply: Option<u64>,
    pub max_supply: Option<u64>,
    pub default_multiplier: Option<u64>,
    pub multiplier_decimals: Option<u8>,
    pub max_reward_seconds_received: Option<u128>,
}

#[derive(Accounts)]
pub struct InitRewardDistributorCtx<'info> {
    #[account(
        init,
        payer = payer,
        space = REWARD_DISTRIBUTOR_SIZE,
        seeds = [REWARD_DISTRIBUTOR_SEED.as_bytes(), stake_pool.key().as_ref()],
        bump,
    )]
    reward_distributor: Box<Account<'info, RewardDistributor>>,
    stake_pool: Box<Account<'info, StakePool>>,
    #[account(mut)]
    reward_mint: Box<Account<'info, Mint>>,

    #[account(mut)]
    authority: Signer<'info>,
    #[account(mut)]
    payer: Signer<'info>,
    token_program: Program<'info, Token>,
    system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitRewardDistributorCtx>, ix: InitRewardDistributorIx) -> Result<()> {
    let reward_distributor = &mut ctx.accounts.reward_distributor;
    reward_distributor.bump = *ctx.bumps.get("reward_distributor").unwrap();
    reward_distributor.authority = ctx.accounts.authority.key();
    reward_distributor.stake_pool = ctx.accounts.stake_pool.key();
    reward_distributor.reward_mint = ctx.accounts.reward_mint.key();
    reward_distributor.reward_amount = ix.reward_amount;
    reward_distributor.reward_duration_seconds = ix.reward_duration_seconds as u128;
    reward_distributor.max_supply = ix.max_supply;
    reward_distributor.default_multiplier = ix.default_multiplier.unwrap_or(1);
    reward_distributor.multiplier_decimals = ix.multiplier_decimals.unwrap_or(0);
    reward_distributor.max_reward_seconds_received = ix.max_reward_seconds_received;
    Ok(())
}
