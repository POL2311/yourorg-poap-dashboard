use crate::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(
    service_id: String,
    new_fee_bps: Option<u16>,
    new_max_amount: Option<u64>,
    new_is_active: Option<bool>,
)]
pub struct UpdateServiceConfig<'info> {
    #[account(mut)]
    pub fee_payer: Signer<'info>,

    #[account(
        mut,
        seeds = [
            b"service",
            service_id.as_bytes().as_ref(),
        ],
        bump,
        constraint = service.owner == owner.key() @ GaslessInfrastructureError::UnauthorizedServiceOwner,
    )]
    pub service: Account<'info, ServiceProvider>,

    pub owner: Signer<'info>,
}

/// Update service configuration parameters
pub fn handler(
    ctx: Context<UpdateServiceConfig>,
    service_id: String,
    new_fee_bps: Option<u16>,
    new_max_amount: Option<u64>,
    new_is_active: Option<bool>,
) -> Result<()> {
    let service = &mut ctx.accounts.service;
    
    // Update fee if provided
    if let Some(fee_bps) = new_fee_bps {
        require!(fee_bps <= 10000, GaslessInfrastructureError::InvalidFeeParameters);
        service.service_fee_bps = fee_bps;
        msg!("Service fee updated to: {} bps", fee_bps);
    }
    
    // Update max amount if provided
    if let Some(max_amount) = new_max_amount {
        require!(max_amount > 0, GaslessInfrastructureError::InvalidFeeParameters);
        service.max_transaction_amount = max_amount;
        msg!("Max transaction amount updated to: {}", max_amount);
    }
    
    // Update active status if provided
    if let Some(is_active) = new_is_active {
        service.is_active = is_active;
        msg!("Service active status updated to: {}", is_active);
    }
    
    msg!("Service configuration updated");
    msg!("Service: {}", service_id);
    msg!("Owner: {}", ctx.accounts.owner.key());
    
    Ok(())
}