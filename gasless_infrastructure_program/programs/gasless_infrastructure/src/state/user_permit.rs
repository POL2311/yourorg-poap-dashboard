
use anchor_lang::prelude::*;

#[account]
pub struct UserPermit {
	pub user: Pubkey,
	pub service: Pubkey,
	pub nonce: u64,
	pub instruction_data: Vec<u8>,
	pub target_program: Pubkey,
	pub expiry: i64,
	pub max_fee: u64,
	pub executed: bool,
	pub signature: Vec<u8>,
	pub bump: u8,
}
