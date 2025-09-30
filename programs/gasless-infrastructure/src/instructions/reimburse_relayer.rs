// En el programa Solana - Instrucción para reembolsar al relayer
#[derive(Accounts)]
pub struct ReimburseRelayer<'info> {
    #[account(mut)]
    pub protocol: Account<'info, GaslessProtocol>,
    
    #[account(mut)]
    pub service: Account<'info, ServiceProvider>,
    
    #[account(mut)]
    pub fee_vault: Account<'info, FeeVault>,
    
    /// La master wallet que paga los gas fees
    #[account(
        mut,
        constraint = master_treasury.key() == protocol.master_treasury
    )]
    pub master_treasury: Signer<'info>,
    
    /// El relayer que será reembolsado
    #[account(mut)]
    pub relayer: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn reimburse_relayer(
    ctx: Context<ReimburseRelayer>,
    gas_cost: u64,
    service_fee: u64,
    protocol_fee: u64,
) -> Result<()> {
    let protocol = &mut ctx.accounts.protocol;
    let service = &mut ctx.accounts.service;
    let fee_vault = &mut ctx.accounts.fee_vault;
    
    // 1. Reembolsar gas cost al relayer desde master treasury
    let reimburse_ix = system_instruction::transfer(
        &ctx.accounts.master_treasury.key(),
        &ctx.accounts.relayer.key(),
        gas_cost,
    );
    
    invoke(
        &reimburse_ix,
        &[
            ctx.accounts.master_treasury.to_account_info(),
            ctx.accounts.relayer.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
    )?;
    
    // 2. Cobrar service fee desde fee vault del servicio
    if service_fee > 0 {
        let service_fee_ix = system_instruction::transfer(
            &fee_vault.key(),
            &service.fee_collector,
            service_fee,
        );
        
        invoke_signed(
            &service_fee_ix,
            &[
                fee_vault.to_account_info(),
                ctx.accounts.service.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            &[&[
                b"fee_vault",
                service.key().as_ref(),
                &[fee_vault.bump],
            ]],
        )?;
    }
    
    // 3. Cobrar protocol fee para la master treasury
    if protocol_fee > 0 {
        let protocol_fee_ix = system_instruction::transfer(
            &fee_vault.key(),
            &protocol.master_treasury,
            protocol_fee,
        );
        
        invoke_signed(
            &protocol_fee_ix,
            &[
                fee_vault.to_account_info(),
                ctx.accounts.master_treasury.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            &[&[
                b"fee_vault",
                service.key().as_ref(),
                &[fee_vault.bump],
            ]],
        )?;
    }
    
    // Actualizar estadísticas
    protocol.total_transactions += 1;
    service.total_transactions += 1;
    fee_vault.total_gas_reimbursed += gas_cost;
    fee_vault.total_fees_collected += service_fee + protocol_fee;
    
    msg!("Relayer reimbursed: {} lamports", gas_cost);
    msg!("Service fee: {} lamports", service_fee);
    msg!("Protocol fee: {} lamports", protocol_fee);
    
    Ok(())
}