
use anchor_lang::prelude::*;

#[account]
pub struct FeeVault {
	pub service: Pubkey,
	pub vault_authority: Pubkey,
	pub usdc_vault: Pubkey,
	pub sol_balance: u64,
	pub total_fees_collected: u64,
	pub total_gas_reimbursed: u64,
	pub bump: u8,
}
