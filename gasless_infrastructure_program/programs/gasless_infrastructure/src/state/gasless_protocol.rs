
use anchor_lang::prelude::*;

#[account]
pub struct GaslessProtocol {
	pub admin: Pubkey,
	pub master_treasury: Pubkey,
	pub protocol_fee_bps: u16,
	pub total_services: u64,
	pub total_transactions: u64,
	pub is_active: bool,
	pub bump: u8,
}
