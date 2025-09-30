use anchor_lang::prelude::*;

// Protocol constants
pub const MAX_FEE_BPS: u16 = 10000; // 100% in basis points
pub const DEFAULT_GAS_COST: u64 = 5000; // Default gas cost in lamports
pub const USDC_TO_SOL_CONVERSION: u64 = 1000; // Simplified conversion rate

// PDA seeds
pub const PROTOCOL_SEED: &[u8] = b"gasless_protocol";
pub const SERVICE_SEED: &[u8] = b"service";
pub const PERMIT_SEED: &[u8] = b"permit";
pub const RELAYER_SEED: &[u8] = b"relayer";
pub const FEE_VAULT_SEED: &[u8] = b"fee_vault";