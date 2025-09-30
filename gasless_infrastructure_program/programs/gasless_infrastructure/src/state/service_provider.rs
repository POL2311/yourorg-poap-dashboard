
use anchor_lang::prelude::*;

#[account]
pub struct ServiceProvider {
	pub service_id: String,
	pub owner: Pubkey,
	pub fee_collector: Pubkey,
	pub treasury_vault: Pubkey,
	pub service_fee_bps: u16,
	pub max_transaction_amount: u64,
	pub allowed_programs: Vec<Pubkey>,
	pub is_active: bool,
	pub total_transactions: u64,
	pub bump: u8,
}
