
use anchor_lang::prelude::*;

#[account]
pub struct RelayerConfig {
	pub relayer: Pubkey,
	pub is_authorized: bool,
	pub total_relayed: u64,
	pub last_activity: i64,
	pub bump: u8,
}
