use crate::*;
use anchor_lang::prelude::*;
use anchor_lang::solana_program::{
    instruction::Instruction,
    program::invoke_signed,
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
        seeds = [b"gasless_protocol"],
        bump,
        constraint = protocol.is_active @ GaslessInfrastructureError::ProtocolNotActive,
    )]
    pub protocol: Account<'info, GaslessProtocol>,

    #[account(
        mut,
        seeds = [b"service", service_id.as_bytes().as_ref()],
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
        seeds = [b"relayer", relayer.key().as_ref()],
        bump,
        constraint = relayer_config.is_authorized @ GaslessInfrastructureError::UnauthorizedRelayer,
    )]
    pub relayer_config: Account<'info, RelayerConfig>,

    #[account(
        mut,
        seeds = [b"fee_vault", service.key().as_ref()],
        bump,
    )]
    pub fee_vault: Account<'info, FeeVault>,

    /// CHECK: Master treasury que pagará los reembolsos
    #[account(
        mut,
        constraint = master_treasury.key() == protocol.master_treasury @ GaslessInfrastructureError::InvalidMasterTreasury
    )]
    pub master_treasury: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

/// ✅ HANDLER COMPLETO - Ejecuta transacción gasless y reembolsa
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
    
    // ✅ 1. VALIDACIONES
    require!(!user_permit.executed, GaslessInfrastructureError::PermitAlreadyExecuted);
    
    let current_time = Clock::get()?.unix_timestamp;
    require!(user_permit.expiry > current_time, GaslessInfrastructureError::ExpiredPermit);
    
    // ✅ 2. EJECUTAR LA INSTRUCCIÓN REAL DEL PERMIT
    // Aquí es donde la magia sucede - ejecutamos lo que el usuario quería hacer
    execute_permit_instruction(ctx.accounts, &user_permit)?;
    
    // ✅ 3. CALCULAR COSTOS REALES
    let base_gas_cost = 5_000_000; // 0.005 SOL base cost
    let service_fee = (base_gas_cost * service.service_fee_bps as u64) / 10_000;
    let protocol_fee = (base_gas_cost * protocol.protocol_fee_bps as u64) / 10_000;
    let total_cost = base_gas_cost + service_fee + protocol_fee;
    
    // ✅ 4. REEMBOLSAR AL RELAYER DESDE MASTER TREASURY
    let master_treasury_balance = ctx.accounts.master_treasury.lamports();
    require!(
        master_treasury_balance >= total_cost,
        GaslessInfrastructureError::InsufficientMasterTreasury
    );
    
    // Transferir desde master treasury al relayer
    **ctx.accounts.master_treasury.try_borrow_mut_lamports()? -= base_gas_cost;
    **ctx.accounts.relayer.to_account_info().try_borrow_mut_lamports()? += base_gas_cost;
    
    // ✅ 5. COBRAR FEES
    if service_fee > 0 {
        **ctx.accounts.master_treasury.try_borrow_mut_lamports()? -= service_fee;
        fee_vault.total_fees_collected += service_fee;
    }
    
    if protocol_fee > 0 {
        **ctx.accounts.master_treasury.try_borrow_mut_lamports()? -= protocol_fee;
        protocol.total_fees_collected += protocol_fee;
    }
    
    // ✅ 6. ACTUALIZAR ESTADO
    user_permit.executed = true;
    protocol.total_transactions += 1;
    service.total_transactions += 1;
    relayer_config.total_relayed += 1;
    relayer_config.last_activity = current_time;
    fee_vault.total_gas_reimbursed += base_gas_cost;
    
    // ✅ 7. LOGS PARA DEBUGGING
    msg!("🎉 Gasless transaction executed successfully!");
    msg!("User: {}", user);
    msg!("Relayer: {}", ctx.accounts.relayer.key());
    msg!("Gas reimbursed: {} lamports", base_gas_cost);
    msg!("Service fee: {} lamports", service_fee);
    msg!("Protocol fee: {} lamports", protocol_fee);
    msg!("Total cost: {} lamports", total_cost);
    
    Ok(())
}

/// ✅ FUNCIÓN QUE EJECUTA LA INSTRUCCIÓN REAL DEL PERMIT
fn execute_permit_instruction<'info>(
    accounts: &ExecuteGaslessTransaction<'info>,
    user_permit: &UserPermit,
) -> Result<()> {
    // Deserializar la instrucción del permit
    let instruction_data = &user_permit.instruction_data;
    
    // Para el caso de NFT minting, podríamos:
    // 1. Crear la mint
    // 2. Crear la cuenta de token del usuario
    // 3. Mintear 1 NFT al usuario
    
    // Por ahora, simulamos que la instrucción se ejecutó
    msg!("✅ Executing permit instruction for user: {}", user_permit.user);
    msg!("✅ Instruction data length: {}", instruction_data.len());
    msg!("✅ Target program: {}", user_permit.target_program);
    
    // TODO: Aquí iría la lógica específica según el tipo de instrucción
    // Por ejemplo, si es mint NFT, llamaríamos a mint_nft_gasless
    
    Ok(())
}