use crate::*;
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, MintTo, Token, TokenAccount},
};

#[derive(Accounts)]
#[instruction(
    user: Pubkey,
    service_id: String,
    nonce: u64,
)]
pub struct MintNftGasless<'info> {
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
        seeds = [b"fee_vault", service.key().as_ref()],
        bump,
    )]
    pub fee_vault: Account<'info, FeeVault>,

    /// CHECK: Master treasury que pagará los costos
    #[account(
        mut,
        constraint = master_treasury.key() == protocol.master_treasury @ GaslessInfrastructureError::InvalidMasterTreasury
    )]
    pub master_treasury: UncheckedAccount<'info>,

    #[account(
        init,
        payer = master_treasury, // ✅ MASTER TREASURY PAGA
        mint::decimals = 0,
        mint::authority = relayer,
    )]
    pub nft_mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer = master_treasury, // ✅ MASTER TREASURY PAGA
        associated_token::mint = nft_mint,
        associated_token::authority = user_authority,
    )]
    pub user_nft_account: Account<'info, TokenAccount>,

    /// CHECK: Usuario que recibirá el NFT
    #[account(constraint = user_authority.key() == user @ GaslessInfrastructureError::InvalidUser)]
    pub user_authority: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

/// ✅ MINT NFT COMPLETAMENTE GASLESS PARA EL USUARIO
pub fn handler(
    ctx: Context<MintNftGasless>,
    user: Pubkey,
    _service_id: String,
    _nonce: u64,
) -> Result<()> {
    // ✅ 1. VALIDACIONES
    require!(
        !ctx.accounts.user_permit.executed,
        GaslessInfrastructureError::PermitAlreadyExecuted
    );

    let current_time = Clock::get()?.unix_timestamp;
    require!(
        ctx.accounts.user_permit.expiry > current_time,
        GaslessInfrastructureError::ExpiredPermit
    );

    require!(
        ctx.accounts.user_permit.user == user,
        GaslessInfrastructureError::InvalidUser
    );

    // ✅ 2. CALCULAR COSTOS REALES
    let mint_cost = Rent::get()?.minimum_balance(Mint::LEN); // Costo real de crear mint
    let token_account_cost = Rent::get()?.minimum_balance(TokenAccount::LEN); // Costo real de ATA
    let base_cost = mint_cost + token_account_cost + 5_000; // + fees de transacción
    
    let service_fee = (base_cost * ctx.accounts.service.service_fee_bps as u64) / 10_000;
    let protocol_fee = (base_cost * ctx.accounts.protocol.protocol_fee_bps as u64) / 10_000;
    let total_cost = base_cost + service_fee + protocol_fee;

    // ✅ 3. VERIFICAR QUE MASTER TREASURY TENGA FONDOS
    let master_treasury_balance = ctx.accounts.master_treasury.lamports();
    require!(
        master_treasury_balance >= total_cost,
        GaslessInfrastructureError::InsufficientMasterTreasury
    );

    // ✅ 4. MINTEAR NFT AL USUARIO (MASTER TREASURY YA PAGÓ EN INIT)
    let cpi_accounts = MintTo {
        mint: ctx.accounts.nft_mint.to_account_info(),
        to: ctx.accounts.user_nft_account.to_account_info(),
        authority: ctx.accounts.relayer.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    
    // Mintear 1 NFT al usuario
    token::mint_to(cpi_ctx, 1)?;

    // ✅ 5. REEMBOLSAR AL RELAYER (si pagó algo)
    let relayer_reimbursement = 2_000_000; // 0.002 SOL por procesamiento
    **ctx.accounts.master_treasury.try_borrow_mut_lamports()? -= relayer_reimbursement;
    **ctx.accounts.relayer.to_account_info().try_borrow_mut_lamports()? += relayer_reimbursement;

    // ✅ 6. COBRAR FEES
    if service_fee > 0 {
        **ctx.accounts.master_treasury.try_borrow_mut_lamports()? -= service_fee;
        ctx.accounts.fee_vault.total_fees_collected += service_fee;
    }

    if protocol_fee > 0 {
        **ctx.accounts.master_treasury.try_borrow_mut_lamports()? -= protocol_fee;
        ctx.accounts.protocol.total_fees_collected += protocol_fee;
    }

    // ✅ 7. ACTUALIZAR ESTADO
    ctx.accounts.user_permit.executed = true;
    ctx.accounts.protocol.total_transactions += 1;
    ctx.accounts.service.total_transactions += 1;
    ctx.accounts.fee_vault.total_gas_reimbursed += relayer_reimbursement;

    // ✅ 8. LOGS DE ÉXITO
    msg!("🎉 NFT MINTED GASLESSLY!");
    msg!("User: {}", user);
    msg!("NFT mint: {}", ctx.accounts.nft_mint.key());
    msg!("User token account: {}", ctx.accounts.user_nft_account.key());
    msg!("Total cost paid by master treasury: {} lamports", total_cost);
    msg!("Relayer reimbursement: {} lamports", relayer_reimbursement);
    msg!("Service fee: {} lamports", service_fee);
    msg!("Protocol fee: {} lamports", protocol_fee);

    Ok(())
}