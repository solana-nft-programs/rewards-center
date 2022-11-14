use crate::errors::ErrorCode;
use crate::state::*;
use anchor_lang::prelude::*;
use anchor_spl::token::Mint;
use anchor_spl::token::SetAuthority;
use anchor_spl::token::Token;
use anchor_spl::token::TokenAccount;
use anchor_spl::token::{self};
use cardinal_stake_pool::state::StakePool;
use spl_token::instruction::AuthorityType;

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

pub fn handler<'key, 'accounts, 'remaining, 'info>(ctx: Context<'key, 'accounts, 'remaining, 'info, InitRewardDistributorCtx<'info>>, ix: InitRewardDistributorIx) -> Result<()> {
    let reward_distributor = &mut ctx.accounts.reward_distributor;
    reward_distributor.bump = *ctx.bumps.get("reward_distributor").unwrap();
    reward_distributor.kind = ix.kind;
    reward_distributor.authority = ctx.accounts.authority.key();
    reward_distributor.stake_pool = ctx.accounts.stake_pool.key();
    reward_distributor.reward_mint = ctx.accounts.reward_mint.key();
    reward_distributor.reward_amount = ix.reward_amount;
    reward_distributor.reward_duration_seconds = ix.reward_duration_seconds as u128;
    reward_distributor.max_supply = ix.max_supply;
    reward_distributor.default_multiplier = ix.default_multiplier.unwrap_or(1);
    reward_distributor.multiplier_decimals = ix.multiplier_decimals.unwrap_or(0);
    reward_distributor.max_reward_seconds_received = ix.max_reward_seconds_received;

    let remaining_accs = &mut ctx.remaining_accounts.iter();
    match ix.kind {
        k if k == RewardDistributorKind::Mint as u8 => {
            let cpi_accounts = SetAuthority {
                account_or_mint: ctx.accounts.reward_mint.to_account_info(),
                current_authority: ctx.accounts.authority.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_context = CpiContext::new(cpi_program, cpi_accounts);
            token::set_authority(cpi_context, AuthorityType::MintTokens, Some(reward_distributor.key()))?;
        }
        k if k == RewardDistributorKind::Treasury as u8 => {
            if ix.supply.is_none() && ix.max_supply.is_none() {
                return Err(error!(ErrorCode::SupplyRequired));
            }
            let reward_distributor_token_account_info = next_account_info(remaining_accs)?;
            let reward_distributor_token_account = Account::<TokenAccount>::try_from(reward_distributor_token_account_info)?;
            let authority_token_account_info = next_account_info(remaining_accs)?;
            let authority_token_account = Account::<TokenAccount>::try_from(authority_token_account_info)?;

            let cpi_accounts = token::Transfer {
                from: authority_token_account.to_account_info(),
                to: reward_distributor_token_account.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_context = CpiContext::new(cpi_program, cpi_accounts);
            token::transfer(cpi_context, ix.supply.unwrap_or_else(|| ix.max_supply.unwrap()))?;
        }
        _ => return Err(error!(ErrorCode::InvalidRewardDistributorKind)),
    }
    Ok(())
}
