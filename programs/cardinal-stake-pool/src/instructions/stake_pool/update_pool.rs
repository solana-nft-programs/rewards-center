use crate::state::*;
use crate::utils::resize_account;
use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct UpdatePoolIx {
    requires_collections: Vec<Pubkey>,
    requires_creators: Vec<Pubkey>,
    requires_authorization: bool,
    authority: Pubkey,
    reset_on_unstake: bool,
    cooldown_seconds: Option<u32>,
    min_stake_seconds: Option<u32>,
    end_date: Option<i64>,
    stake_payment_amount: Option<u64>,
    unstake_payment_amount: Option<u64>,
    payment_mint: Option<Pubkey>,
    payment_manager: Option<Pubkey>,
}

#[derive(Accounts)]
#[instruction(ix: UpdatePoolIx)]
pub struct UpdatePoolCtx<'info> {
    #[account(mut, constraint = stake_pool.authority == payer.key())]
    stake_pool: Account<'info, StakePool>,

    #[account(mut)]
    payer: Signer<'info>,
    system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<UpdatePoolCtx>, ix: UpdatePoolIx) -> Result<()> {
    let stake_pool = &mut ctx.accounts.stake_pool;

    if let Some(payment_manager) = ix.payment_manager {
        assert_stake_pool_payment_manager(&payment_manager).expect("Payment manager error");
    }
    let new_stake_pool = StakePool {
        bump: stake_pool.bump,
        authority: ix.authority,
        total_staked: stake_pool.total_staked,
        reset_on_unstake: ix.reset_on_unstake,
        cooldown_seconds: ix.cooldown_seconds,
        min_stake_seconds: ix.min_stake_seconds,
        end_date: ix.end_date,
        stake_payment_amount: ix.stake_payment_amount,
        unstake_payment_amount: ix.stake_payment_amount,
        payment_mint: ix.payment_mint,
        payment_manager: ix.payment_manager,
        requires_authorization: ix.requires_authorization,
        requires_creators: ix.requires_creators,
        requires_collections: ix.requires_collections,
        identifier: stake_pool.identifier.clone(),
    };
    let new_space = new_stake_pool.try_to_vec()?.len() + 8;
    stake_pool.set_inner(new_stake_pool);

    resize_account(
        &stake_pool.to_account_info(),
        new_space,
        &ctx.accounts.payer.to_account_info(),
        &ctx.accounts.system_program.to_account_info(),
    )?;
    Ok(())
}
