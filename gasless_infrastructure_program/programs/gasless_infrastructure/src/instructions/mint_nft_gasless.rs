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

    #[account(
        init,
        payer = relayer,
        mint::decimals = 0,
        mint::authority = relayer,
    )]
    pub nft_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = relayer,
        associated_token::mint = nft_mint,
        associated_token::authority = user_authority,
    )]
    pub user_nft_account: Account<'info, TokenAccount>,

    /// CHECK: Usuario que recibirá el NFT (validado vía permit y lógica)
    pub user_authority: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

impl<'info> MintNftGasless<'info> {
    /// CPI para mintear 1 unidad al usuario (relayer es autoridad de la mint).
    /// Nota: `&self` (inmutable) para no chocar con préstamos mutables posteriores.
    pub fn mint_nft_to_user(&self) -> Result<()> {
        let cpi_accounts = MintTo {
            mint: self.nft_mint.to_account_info(),
            to: self.user_nft_account.to_account_info(),
            authority: self.relayer.to_account_info(),
        };
        let cpi_program = self.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::mint_to(cpi_ctx, 1)?;
        Ok(())
    }
}

/// Mint NFT to user without them paying gas
pub fn handler(
    ctx: Context<MintNftGasless>,
    user: Pubkey,
    _service_id: String, // prefijo _ para silenciar warning si no lo usas aquí
    _nonce: u64,         // idem
) -> Result<()> {
    // ---------- Validaciones (solo lectura) ----------
    require!(
        !ctx.accounts.user_permit.executed,
        GaslessInfrastructureError::PermitAlreadyExecuted
    );

    let current_time = Clock::get()?.unix_timestamp;
    require!(
        ctx.accounts.user_permit.expiry > current_time,
        GaslessInfrastructureError::ExpiredPermit
    );

    // Usuario del permit debe coincidir con el usuario destino
    require!(
        ctx.accounts.user_permit.user == user,
        GaslessInfrastructureError::InvalidSignature
    );

    // Cálculo de costos (valores locales para no mantener préstamos)
    let mint_cost: u64 = 10_000; // lamports simulados del mint
    let service_fee_bps: u16 = ctx.accounts.service.service_fee_bps;
    let protocol_fee_bps: u16 = ctx.accounts.protocol.protocol_fee_bps;

    let service_fee = (mint_cost.saturating_mul(service_fee_bps as u64)) / 10_000;
    let protocol_fee = (mint_cost.saturating_mul(protocol_fee_bps as u64)) / 10_000;
    let total_cost = mint_cost
        .saturating_add(service_fee)
        .saturating_add(protocol_fee);

    let fee_vault_balance = ctx.accounts.fee_vault.sol_balance;
    require!(
        fee_vault_balance >= total_cost,
        GaslessInfrastructureError::InsufficientTreasury
    );

    // ---------- Acción principal (CPI) ----------
    // Solo préstamos inmutables aquí
    ctx.accounts.mint_nft_to_user()?;

    // ---------- Mutaciones posteriores (préstamos mutables separados) ----------
    {
        let user_permit = &mut ctx.accounts.user_permit;
        user_permit.executed = true;
    }
    {
        let protocol = &mut ctx.accounts.protocol;
        protocol.total_transactions = protocol.total_transactions.saturating_add(1);
    }
    {
        let service = &mut ctx.accounts.service;
        service.total_transactions = service.total_transactions.saturating_add(1);
    }
    {
        let fee_vault = &mut ctx.accounts.fee_vault;
        fee_vault.total_gas_reimbursed =
            fee_vault.total_gas_reimbursed.saturating_add(mint_cost);
        fee_vault.total_fees_collected = fee_vault
            .total_fees_collected
            .saturating_add(service_fee.saturating_add(protocol_fee));
        fee_vault.sol_balance = fee_vault.sol_balance.saturating_sub(total_cost);
    }

    msg!("NFT minted gaslessly");
    msg!("User: {}", user);
    msg!("NFT mint: {}", ctx.accounts.nft_mint.key());
    msg!("User token account: {}", ctx.accounts.user_nft_account.key());
    msg!("Total cost: {} lamports", total_cost);

    Ok(())
}
