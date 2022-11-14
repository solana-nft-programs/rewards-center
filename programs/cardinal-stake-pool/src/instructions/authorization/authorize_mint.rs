use {
    crate::{errors::ErrorCode, state::*},
    anchor_lang::prelude::*,
};

#[derive(Accounts)]
#[instruction(mint: Pubkey)]
pub struct AuthorizeMintCtx<'info> {
    #[account(mut)]
    stake_pool: Account<'info, StakePool>,
    #[account(
        init,
        payer = payer,
        space = STAKE_POOL_SIZE,
        seeds = [STAKE_AUTHORIZATION_PREFIX.as_bytes(), stake_pool.key().as_ref(), mint.as_ref()],
        bump
    )]
    stake_authorization_record: Account<'info, StakeAuthorizationRecord>,

    #[account(mut, constraint = payer.key() == stake_pool.authority @ ErrorCode::InvalidPoolAuthority)]
    payer: Signer<'info>,
    system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<AuthorizeMintCtx>, mint: Pubkey) -> Result<()> {
    let stake_authorization_record = &mut ctx.accounts.stake_authorization_record;
    stake_authorization_record.bump = *ctx.bumps.get("stake_authorization_record").unwrap();
    stake_authorization_record.pool = ctx.accounts.stake_pool.key();
    stake_authorization_record.mint = mint;

    Ok(())
}
