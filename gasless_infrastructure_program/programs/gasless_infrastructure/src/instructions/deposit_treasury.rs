use crate::*;
use anchor_lang::prelude::*;
use anchor_spl::{
    token::{Mint, Token, TokenAccount, Transfer},
};

#[derive(Accounts)]
#[instruction(
    service_id: String,
    amount: u64,
)]
pub struct DepositTreasury<'info> {
    #[account(mut)]
    pub fee_payer: Signer<'info>,

    #[account(
        seeds = [
            b"service",
            service_id.as_bytes().as_ref(),
        ],
        bump,
        constraint = service.is_active @ GaslessInfrastructureError::ServiceNotActive,
    )]
    pub service: Account<'info, ServiceProvider>,

    #[account(
        mut,
        seeds = [
            b"fee_vault",
            service.key().as_ref(),
        ],
        bump,
    )]
    pub fee_vault: Account<'info, FeeVault>,

    #[account(mut)]
    pub depositor: Signer<'info>,

    #[account(
        mut,
        constraint = depositor_usdc_account.mint == usdc_mint.key(),
        constraint = depositor_usdc_account.owner == depositor.key(),
    )]
    pub depositor_usdc_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = vault_usdc_account.mint == usdc_mint.key(),
        constraint = vault_usdc_account.key() == service.treasury_vault,
    )]
    pub vault_usdc_account: Account<'info, TokenAccount>,

    pub usdc_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
}

/// Deposit funds to service treasury for gas coverage
pub fn handler(
    ctx: Context<DepositTreasury>,
    service_id: String,
    amount: u64,
) -> Result<()> {
    let fee_vault = &mut ctx.accounts.fee_vault;
    
    // Validate amount
    require!(amount > 0, GaslessInfrastructureError::InvalidFeeParameters);
    
    // Transfer USDC from depositor to vault
    let cpi_accounts = Transfer {
        from: ctx.accounts.depositor_usdc_account.to_account_info(),
        to: ctx.accounts.vault_usdc_account.to_account_info(),
        authority: ctx.accounts.depositor.to_account_info(),
    };
    
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    
    anchor_spl::token::transfer(cpi_ctx, amount)?;
    
    // Update fee vault balance (in SOL equivalent for simplicity)
    // In a real implementation, you'd convert USDC to SOL equivalent
    let sol_equivalent = amount / 1000; // Simplified conversion
    fee_vault.sol_balance += sol_equivalent;
    
    msg!("Treasury deposit successful");
    msg!("Service: {}", service_id);
    msg!("Depositor: {}", ctx.accounts.depositor.key());
    msg!("Amount: {} USDC", amount);
    msg!("SOL equivalent added: {} lamports", sol_equivalent);
    
    Ok(())
}