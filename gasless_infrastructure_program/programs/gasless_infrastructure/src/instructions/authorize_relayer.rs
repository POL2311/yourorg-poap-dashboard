use crate::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(relayer: Pubkey)]
pub struct AuthorizeRelayer<'info> {
    #[account(mut)]
    pub fee_payer: Signer<'info>,

    #[account(
        seeds = [
            b"gasless_protocol",
        ],
        bump,
        constraint = protocol.admin == admin.key() @ GaslessInfrastructureError::UnauthorizedProtocolAdmin,
    )]
    pub protocol: Account<'info, GaslessProtocol>,

    #[account(
        init,
        space = 8 + 32 + 1 + 8 + 8 + 1, // discriminator + relayer + is_authorized + total_relayed + last_activity + bump
        payer = fee_payer,
        seeds = [
            b"relayer",
            relayer.as_ref(),
        ],
        bump,
    )]
    pub relayer_config: Account<'info, RelayerConfig>,

    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}

/// Authorize a relayer to execute gasless transactions
pub fn handler(
    ctx: Context<AuthorizeRelayer>,
    relayer: Pubkey,
) -> Result<()> {
    let protocol = &ctx.accounts.protocol;
    let relayer_config = &mut ctx.accounts.relayer_config;
    
    // Check protocol is active
    require!(protocol.is_active, GaslessInfrastructureError::ProtocolNotActive);
    
    // Initialize relayer config
    relayer_config.relayer = relayer;
    relayer_config.is_authorized = true;
    relayer_config.total_relayed = 0;
    relayer_config.last_activity = Clock::get()?.unix_timestamp;
    relayer_config.bump = ctx.bumps.relayer_config;
    
    msg!("Relayer authorized: {}", relayer);
    
    Ok(())
}