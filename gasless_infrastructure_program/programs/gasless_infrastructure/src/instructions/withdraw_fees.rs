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
pub struct WithdrawFees<'info> {
    #[account(mut)]
    pub fee_payer: Signer<'info>,

    #[account(
        seeds = [
            b"service",
            service_id.as_bytes().as_ref(),
        ],
        bump,
        constraint = service.owner == owner.key() @ GaslessInfrastructureError::UnauthorizedServiceOwner,
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

    pub owner: Signer<'info>,

    #[account(
        mut,
        constraint = fee_collector_usdc_account.mint == usdc_mint.key(),
        constraint = fee_collector_usdc_account.owner == service.fee_collector,
    )]
    pub fee_collector_usdc_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = vault_usdc_account.mint == usdc_mint.key(),
        constraint = vault_usdc_account.key() == service.treasury_vault,
    )]
    pub vault_usdc_account: Account<'info, TokenAccount>,

    pub usdc_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
}

/// Withdraw accumulated fees from service vault
pub fn handler(
    ctx: Context<WithdrawFees>,
    service_id: String,
    amount: u64,
) -> Result<()> {
    let service = &ctx.accounts.service;
    let fee_vault = &mut ctx.accounts.fee_vault;
    
    // Validate amount
    require!(amount > 0, GaslessInfrastructureError::InvalidFeeParameters);
    
    // Check vault has sufficient balance
    require!(
        ctx.accounts.vault_usdc_account.amount >= amount,
        GaslessInfrastructureError::InsufficientTreasury
    );
    
    // Create signer seeds for fee vault PDA
    let service_key = service.key();
    let bump = fee_vault.bump;
    let signer_seeds: &[&[&[u8]]] = &[&[
        b"fee_vault",
        service_key.as_ref(),
        &[bump],
    ]];
    
    // Transfer USDC from vault to fee collector
    let cpi_accounts = Transfer {
        from: ctx.accounts.vault_usdc_account.to_account_info(),
        to: ctx.accounts.fee_collector_usdc_account.to_account_info(),
        authority: fee_vault.to_account_info(),
    };
    
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
    
    anchor_spl::token::transfer(cpi_ctx, amount)?;
    
    // Update fee vault balance
    let sol_equivalent = amount / 1000; // Simplified conversion
    fee_vault.sol_balance = fee_vault.sol_balance.saturating_sub(sol_equivalent);
    
    msg!("Fee withdrawal successful");
    msg!("Service: {}", service_id);
    msg!("Owner: {}", ctx.accounts.owner.key());
    msg!("Amount: {} USDC", amount);
    msg!("Fee collector: {}", service.fee_collector);
    
    Ok(())
}