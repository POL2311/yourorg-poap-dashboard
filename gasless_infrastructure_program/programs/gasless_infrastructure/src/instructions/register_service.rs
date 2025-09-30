use crate::*;
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};

#[derive(Accounts)]
#[instruction(
    fee_collector: Pubkey,
    service_id: String,
    service_fee_bps: u16,
    max_transaction_amount: u64,
    allowed_programs: Vec<Pubkey>,
)]
pub struct RegisterService<'info> {
    #[account(mut)]
    pub fee_payer: Signer<'info>,

    #[account(
        mut,
        seeds = [
            b"gasless_protocol",
        ],
        bump,
    )]
    pub protocol: Account<'info, GaslessProtocol>,

    #[account(
        init,
        space = 8 + 4 + service_id.len() + 32 + 32 + 32 + 2 + 8 + 4 + (allowed_programs.len() * 32) + 1 + 8 + 1, // discriminator + service_id + owner + fee_collector + treasury_vault + service_fee_bps + max_transaction_amount + allowed_programs + is_active + total_transactions + bump
        payer = fee_payer,
        seeds = [
            b"service",
            service_id.as_bytes().as_ref(),
        ],
        bump,
    )]
    pub service: Account<'info, ServiceProvider>,

    #[account(
        init,
        space = 8 + 32 + 32 + 32 + 8 + 8 + 8 + 1, // discriminator + service + vault_authority + usdc_vault + sol_balance + total_fees_collected + total_gas_reimbursed + bump
        payer = fee_payer,
        seeds = [
            b"fee_vault",
            service.key().as_ref(),
        ],
        bump,
    )]
    pub fee_vault: Account<'info, FeeVault>,

    pub owner: Signer<'info>,

    #[account(
        init,
        payer = fee_payer,
        associated_token::mint = usdc_mint,
        associated_token::authority = fee_vault,
    )]
    pub usdc_vault: Account<'info, TokenAccount>,

    pub usdc_mint: Account<'info, Mint>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

/// Register a new service to use gasless infrastructure
pub fn handler(
    ctx: Context<RegisterService>,
    fee_collector: Pubkey,
    service_id: String,
    service_fee_bps: u16,
    max_transaction_amount: u64,
    allowed_programs: Vec<Pubkey>,
) -> Result<()> {
    // Validate inputs
    require!(!service_id.is_empty(), GaslessInfrastructureError::InvalidFeeParameters);
    require!(service_fee_bps <= 10000, GaslessInfrastructureError::InvalidFeeParameters);
    require!(max_transaction_amount > 0, GaslessInfrastructureError::InvalidFeeParameters);
    require!(!allowed_programs.is_empty(), GaslessInfrastructureError::ProgramNotWhitelisted);
    
    let protocol = &mut ctx.accounts.protocol;
    let service = &mut ctx.accounts.service;
    let fee_vault = &mut ctx.accounts.fee_vault;
    
    // Check protocol is active
    require!(protocol.is_active, GaslessInfrastructureError::ProtocolNotActive);
    
    // Initialize service
    service.service_id = service_id.clone();
    service.owner = ctx.accounts.owner.key();
    service.fee_collector = fee_collector;
    service.treasury_vault = ctx.accounts.usdc_vault.key();
    service.service_fee_bps = service_fee_bps;
    service.max_transaction_amount = max_transaction_amount;
    service.allowed_programs = allowed_programs;
    service.is_active = true;
    service.total_transactions = 0;
    service.bump = ctx.bumps.service;
    
    // Initialize fee vault
    fee_vault.service = service.key();
    fee_vault.vault_authority = fee_vault.key(); // Self-authority for PDA
    fee_vault.usdc_vault = ctx.accounts.usdc_vault.key();
    fee_vault.sol_balance = 0;
    fee_vault.total_fees_collected = 0;
    fee_vault.total_gas_reimbursed = 0;
    fee_vault.bump = ctx.bumps.fee_vault;
    
    // Update protocol stats
    protocol.total_services += 1;
    
    msg!("Service registered: {}", service_id);
    msg!("Owner: {}", service.owner);
    msg!("Fee collector: {}", fee_collector);
    msg!("Service fee: {} bps", service_fee_bps);
    
    Ok(())
}