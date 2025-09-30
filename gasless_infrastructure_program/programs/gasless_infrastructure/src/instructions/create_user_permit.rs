use crate::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(
    user: Pubkey,
    service_id: String,
    nonce: u64,
    instruction_data: Vec<u8>,
    target_program: Pubkey,
    expiry: i64,
    max_fee: u64,
    signature: Vec<u8>,
)]
pub struct CreateUserPermit<'info> {
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
        init,
        space = 8 + 32 + 32 + 8 + 4 + instruction_data.len() + 32 + 8 + 8 + 1 + 4 + signature.len() + 1, // discriminator + user + service + nonce + instruction_data + target_program + expiry + max_fee + executed + signature + bump
        payer = fee_payer,
        seeds = [
            b"permit",
            user.as_ref(),
            service.key().as_ref(),
            nonce.to_le_bytes().as_ref(),
        ],
        bump,
    )]
    pub user_permit: Account<'info, UserPermit>,

    pub system_program: Program<'info, System>,
}

/// Create a permit record for off-chain signed transaction
pub fn handler(
    ctx: Context<CreateUserPermit>,
    user: Pubkey,
    service_id: String,
    nonce: u64,
    instruction_data: Vec<u8>,
    target_program: Pubkey,
    expiry: i64,
    max_fee: u64,
    signature: Vec<u8>,
) -> Result<()> {
    let service = &ctx.accounts.service;
    let user_permit = &mut ctx.accounts.user_permit;
    let current_time = Clock::get()?.unix_timestamp;
    
    // Validate inputs
    require!(expiry > current_time, GaslessInfrastructureError::ExpiredPermit);
    require!(!instruction_data.is_empty(), GaslessInfrastructureError::InvalidNonce);
    require!(!signature.is_empty(), GaslessInfrastructureError::InvalidSignature);
    require!(max_fee > 0, GaslessInfrastructureError::InvalidFeeParameters);
    
    // Check if target program is whitelisted
    require!(
        service.allowed_programs.contains(&target_program),
        GaslessInfrastructureError::ProgramNotWhitelisted
    );
    
    // TODO: Verify user signature against permit data
    // This would require implementing signature verification logic
    
    // Initialize permit
    user_permit.user = user;
    user_permit.service = service.key();
    user_permit.nonce = nonce;
    user_permit.instruction_data = instruction_data;
    user_permit.target_program = target_program;
    user_permit.expiry = expiry;
    user_permit.max_fee = max_fee;
    user_permit.executed = false;
    user_permit.signature = signature;
    user_permit.bump = ctx.bumps.user_permit;
    
    msg!("User permit created for user: {}", user);
    msg!("Service: {}", service_id);
    msg!("Nonce: {}", nonce);
    msg!("Target program: {}", target_program);
    msg!("Expiry: {}", expiry);
    
    Ok(())
}