use {crate::state::*, anchor_lang::prelude::*};

#[derive(Accounts)]
pub struct InitIdentifierCtx<'info> {
    #[account(
        init,
        payer = payer,
        space = IDENTIFIER_SIZE,
        seeds = [IDENTIFIER_PREFIX.as_bytes()],
        bump
    )]
    identifier: Account<'info, Identifier>,

    #[account(mut)]
    payer: Signer<'info>,
    system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitIdentifierCtx>) -> Result<()> {
    let identifier = &mut ctx.accounts.identifier;
    identifier.bump = *ctx.bumps.get("identifier").unwrap();
    identifier.count = 1;

    Ok(())
}
