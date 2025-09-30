use crate::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(
    master_treasury: Pubkey,
    protocol_fee_bps: u16,
)]
pub struct InitializeProtocol<'info> {
    #[account(mut)]
    pub fee_payer: Signer<'info>,

    #[account(
        init,
        space = 8 + 32 + 32 + 2 + 8 + 8 + 1 + 1, // discriminator + admin + master_treasury + protocol_fee_bps + total_services + total_transactions + is_active + bump
        payer = fee_payer,
        seeds = [
            b"gasless_protocol",
        ],
        bump,
    )]
    pub protocol: Account<'info, GaslessProtocol>,

    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}

/// Initialize the gasless protocol with global configuration
pub fn handler(
    ctx: Context<InitializeProtocol>,
    master_treasury: Pubkey,
    protocol_fee_bps: u16,
) -> Result<()> {
    // Validate fee parameters
    require!(protocol_fee_bps <= 10000, GaslessInfrastructureError::InvalidFeeParameters);
    
    let protocol = &mut ctx.accounts.protocol;
    
    // Initialize protocol configuration
    protocol.admin = ctx.accounts.admin.key();
    protocol.master_treasury = master_treasury;
    protocol.protocol_fee_bps = protocol_fee_bps;
    protocol.total_services = 0;
    protocol.total_transactions = 0;
    protocol.is_active = true;
    protocol.bump = ctx.bumps.protocol;
    
    msg!("Gasless protocol initialized");
    msg!("Admin: {}", protocol.admin);
    msg!("Master treasury: {}", protocol.master_treasury);
    msg!("Protocol fee: {} bps", protocol.protocol_fee_bps);
    
    Ok(())
}