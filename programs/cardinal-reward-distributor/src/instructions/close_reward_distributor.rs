use anchor_lang::AccountsClose;

use {
    crate::{errors::ErrorCode, state::*},
    anchor_lang::prelude::*,
    anchor_spl::token::{self, Mint, SetAuthority, Token, TokenAccount},
    cardinal_stake_pool::state::StakePool,
    spl_token::instruction::AuthorityType,
};

#[derive(Accounts)]
pub struct CloseCtx<'info> {
    #[account(mut, constraint = reward_distributor.stake_pool == stake_pool.key())]
    reward_distributor: Box<Account<'info, RewardDistributor>>,
    stake_pool: Box<Account<'info, StakePool>>,

    #[account(mut)]
    reward_mint: Box<Account<'info, Mint>>,

    #[account(mut, constraint = signer.key() == stake_pool.authority @ErrorCode::InvalidAuthority)]
    signer: Signer<'info>,

    token_program: Program<'info, Token>,
}

pub fn handler<'key, 'accounts, 'remaining, 'info>(ctx: Context<'key, 'accounts, 'remaining, 'info, CloseCtx<'info>>) -> Result<()> {
    let reward_distributor = &mut ctx.accounts.reward_distributor;
    let reward_distributor_seed = &[REWARD_DISTRIBUTOR_SEED.as_bytes(), reward_distributor.stake_pool.as_ref(), &[reward_distributor.bump]];
    let reward_distributor_signer = &[&reward_distributor_seed[..]];

    let remaining_accs = &mut ctx.remaining_accounts.iter();
    match reward_distributor.kind {
        k if k == RewardDistributorKind::Mint as u8 => {
            let cpi_accounts = SetAuthority {
                account_or_mint: ctx.accounts.reward_mint.to_account_info(),
                current_authority: reward_distributor.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_context = CpiContext::new(cpi_program, cpi_accounts).with_signer(reward_distributor_signer);
            token::set_authority(cpi_context, AuthorityType::MintTokens, Some(ctx.accounts.signer.key()))?;
        }
        k if k == RewardDistributorKind::Treasury as u8 => {
            let reward_distributor_token_account_info = next_account_info(remaining_accs)?;
            let reward_distributor_token_account = Account::<TokenAccount>::try_from(reward_distributor_token_account_info)?;
            let authority_token_account_info = next_account_info(remaining_accs)?;
            let authority_token_account = Account::<TokenAccount>::try_from(authority_token_account_info)?;

            let cpi_accounts = token::Transfer {
                from: reward_distributor_token_account.to_account_info(),
                to: authority_token_account.to_account_info(),
                authority: reward_distributor.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_context = CpiContext::new(cpi_program, cpi_accounts).with_signer(reward_distributor_signer);
            token::transfer(cpi_context, reward_distributor_token_account.amount)?;

            let cpi_accounts = token::CloseAccount {
                account: reward_distributor_token_account.to_account_info(),
                destination: authority_token_account.to_account_info(),
                authority: reward_distributor.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_context = CpiContext::new(cpi_program, cpi_accounts).with_signer(reward_distributor_signer);
            token::close_account(cpi_context)?;
        }
        _ => return Err(error!(ErrorCode::InvalidRewardDistributorKind)),
    }

    ctx.accounts.reward_distributor.close(ctx.accounts.signer.to_account_info())?;
    Ok(())
}
