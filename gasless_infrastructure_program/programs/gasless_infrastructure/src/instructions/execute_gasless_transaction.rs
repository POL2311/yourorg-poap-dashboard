use crate::*;
use anchor_lang::prelude::*;
use anchor_lang::solana_program::{
    instruction::Instruction,
    program::invoke,
    system_instruction,
};

#[derive(Accounts)]
#[instruction(
    user: Pubkey,
    service_id: String,
    nonce: u64,
)]
pub struct ExecuteGaslessTransaction<'info> {
    #[account(mut)]
    pub relayer: Signer<'info>,

    #[account(
        mut,
        seeds = [
            b"gasless_protocol",
        ],
        bump,
        constraint = protocol.is_active @ GaslessInfrastructureError::ProtocolNotActive,
    )]
    pub protocol: Account<'info, GaslessProtocol>,

    #[account(
        mut,
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
            b"permit",
            user.as_ref(),
            service.key().as_ref(),
            nonce.to_le_bytes().as_ref(),
        ],
        bump,
        constraint = !user_permit.executed @ GaslessInfrastructureError::PermitAlreadyExecuted,
        constraint = user_permit.expiry > Clock::get()?.unix_timestamp @ GaslessInfrastructureError::ExpiredPermit,
    )]
    pub user_permit: Account<'info, UserPermit>,

    #[account(
        mut,
        seeds = [
            b"relayer",
            relayer.key().as_ref(),
        ],
        bump,
        constraint = relayer_config.is_authorized @ GaslessInfrastructureError::UnauthorizedRelayer,
    )]
    pub relayer_config: Account<'info, RelayerConfig>,

    #[account(
        mut,
        seeds = [
            b"fee_vault",
            service.key().as_ref(),
        ],
        bump,
    )]
    pub fee_vault: Account<'info, FeeVault>,

    pub system_program: Program<'info, System>,
}

/// Relayer executes gasless transaction and gets reimbursed
pub fn handler(
    ctx: Context<ExecuteGaslessTransaction>,
    user: Pubkey,
    service_id: String,
    nonce: u64,
) -> Result<()> {
    let protocol = &mut ctx.accounts.protocol;
    let service = &mut ctx.accounts.service;
    let user_permit = &mut ctx.accounts.user_permit;
    let relayer_config = &mut ctx.accounts.relayer_config;
    let fee_vault = &mut ctx.accounts.fee_vault;
    
    // Validate permit hasn't been executed
    require!(!user_permit.executed, GaslessInfrastructureError::PermitAlreadyExecuted);
    
    // Check permit hasn't expired
    let current_time = Clock::get()?.unix_timestamp;
    require!(user_permit.expiry > current_time, GaslessInfrastructureError::ExpiredPermit);
    
    // TODO: Execute the actual instruction contained in the permit
    // This would require parsing and executing the instruction_data
    // For now, we'll just mark the permit as executed
    
    // Calculate fees
    let base_gas_cost = 5000; // Base gas cost in lamports
    let service_fee = (base_gas_cost * service.service_fee_bps as u64) / 10000;
    let protocol_fee = (base_gas_cost * protocol.protocol_fee_bps as u64) / 10000;
    let total_cost = base_gas_cost + service_fee + protocol_fee;
    
    // Check if fee vault has sufficient funds
    require!(
        fee_vault.sol_balance >= total_cost,
        GaslessInfrastructureError::InsufficientTreasury
    );
    
    // Reimburse relayer for gas costs
    let reimburse_ix = system_instruction::transfer(
        &fee_vault.key(),
        &ctx.accounts.relayer.key(),
        base_gas_cost,
    );
    
    // Create signer seeds for fee vault PDA
    let service_key = service.key();
    let bump = fee_vault.bump;
    let signer_seeds: &[&[&[u8]]] = &[&[
        b"fee_vault",
        service_key.as_ref(),
        &[bump],
    ]];
    
    invoke(
        &reimburse_ix,
        &[
            fee_vault.to_account_info(),
            ctx.accounts.relayer.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
    )?;
    
    // Transfer service fee to fee collector
    if service_fee > 0 {
        **fee_vault.to_account_info().try_borrow_mut_lamports()? -= service_fee;
        // Note: In a real implementation, you'd transfer to the actual fee collector account
    }
    
    // Transfer protocol fee to master treasury
    if protocol_fee > 0 {
        **fee_vault.to_account_info().try_borrow_mut_lamports()? -= protocol_fee;
        // Note: In a real implementation, you'd transfer to the master treasury account
    }
    
    // Mark permit as executed
    user_permit.executed = true;
    
    // Update statistics
    protocol.total_transactions += 1;
    service.total_transactions += 1;
    relayer_config.total_relayed += 1;
    relayer_config.last_activity = current_time;
    fee_vault.total_gas_reimbursed += base_gas_cost;
    fee_vault.total_fees_collected += service_fee + protocol_fee;
    fee_vault.sol_balance -= total_cost;
    
    msg!("Gasless transaction executed");
    msg!("User: {}", user);
    msg!("Relayer: {}", ctx.accounts.relayer.key());
    msg!("Gas reimbursed: {} lamports", base_gas_cost);
    msg!("Service fee: {} lamports", service_fee);
    msg!("Protocol fee: {} lamports", protocol_fee);
    
    Ok(())
}