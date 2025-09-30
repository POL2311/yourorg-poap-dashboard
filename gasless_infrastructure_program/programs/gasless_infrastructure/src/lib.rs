pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;
pub use error::*;

declare_id!("55NZkybMneNX4a1C9dDTtWUq1iv3NRprpgMxRSjRoUSX");

#[program]
pub mod gasless_infrastructure {
    use super::*;

    /// Initialize the gasless protocol with global configuration
    pub fn initialize_protocol(
        ctx: Context<InitializeProtocol>, 
        master_treasury: Pubkey, 
        protocol_fee_bps: u16
    ) -> Result<()> {
        initialize_protocol::handler(ctx, master_treasury, protocol_fee_bps)
    }

    /// Register a new service to use gasless infrastructure
    pub fn register_service(
        ctx: Context<RegisterService>, 
        fee_collector: Pubkey, 
        service_id: String, 
        service_fee_bps: u16, 
        max_transaction_amount: u64, 
        allowed_programs: Vec<Pubkey>
    ) -> Result<()> {
        register_service::handler(ctx, fee_collector, service_id, service_fee_bps, max_transaction_amount, allowed_programs)
    }

    /// Authorize a relayer to execute gasless transactions
    pub fn authorize_relayer(
        ctx: Context<AuthorizeRelayer>, 
        relayer: Pubkey
    ) -> Result<()> {
        authorize_relayer::handler(ctx, relayer)
    }

    /// Create a permit record for off-chain signed transaction
    pub fn create_user_permit(
        ctx: Context<CreateUserPermit>, 
        user: Pubkey, 
        service_id: String, 
        nonce: u64, 
        instruction_data: Vec<u8>, 
        target_program: Pubkey, 
        expiry: i64, 
        max_fee: u64, 
        signature: Vec<u8>
    ) -> Result<()> {
        create_user_permit::handler(ctx, user, service_id, nonce, instruction_data, target_program, expiry, max_fee, signature)
    }

    /// Relayer executes gasless transaction and gets reimbursed
    pub fn execute_gasless_transaction(
        ctx: Context<ExecuteGaslessTransaction>, 
        user: Pubkey, 
        service_id: String, 
        nonce: u64
    ) -> Result<()> {
        execute_gasless_transaction::handler(ctx, user, service_id, nonce)
    }

    /// Mint NFT to user without them paying gas
    pub fn mint_nft_gasless(
        ctx: Context<MintNftGasless>, 
        user: Pubkey, 
        service_id: String, 
        nonce: u64
    ) -> Result<()> {
        mint_nft_gasless::handler(ctx, user, service_id, nonce)
    }

    /// Deposit funds to service treasury for gas coverage
    pub fn deposit_treasury(
        ctx: Context<DepositTreasury>, 
        service_id: String, 
        amount: u64
    ) -> Result<()> {
        deposit_treasury::handler(ctx, service_id, amount)
    }

    /// Withdraw accumulated fees from service vault
    pub fn withdraw_fees(
        ctx: Context<WithdrawFees>, 
        service_id: String, 
        amount: u64
    ) -> Result<()> {
        withdraw_fees::handler(ctx, service_id, amount)
    }

    /// Update service configuration parameters
    pub fn update_service_config(
        ctx: Context<UpdateServiceConfig>, 
        service_id: String, 
        new_fee_bps: Option<u16>, 
        new_max_amount: Option<u64>, 
        new_is_active: Option<bool>
    ) -> Result<()> {
        update_service_config::handler(ctx, service_id, new_fee_bps, new_max_amount, new_is_active)
    }
}