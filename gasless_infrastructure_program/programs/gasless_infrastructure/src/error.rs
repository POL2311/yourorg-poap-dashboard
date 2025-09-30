// This file is auto-generated from the CIDL source.
// Editing this file directly is not recommended as it may be overwritten.
//
// Docs: https://docs.codigo.ai/c%C3%B3digo-interface-description-language/specification#errors

use anchor_lang::prelude::*;

#[error_code]
pub enum GaslessInfrastructureError {
	#[msg("Invalid user signature on permit")]
	InvalidSignature,
	#[msg("Permit has expired")]
	ExpiredPermit,
	#[msg("Invalid or already used nonce")]
	InvalidNonce,
	#[msg("Relayer is not authorized")]
	UnauthorizedRelayer,
	#[msg("Insufficient treasury funds for gas reimbursement")]
	InsufficientTreasury,
	#[msg("Service is not active")]
	ServiceNotActive,
	#[msg("Protocol is not active")]
	ProtocolNotActive,
	#[msg("Transaction amount exceeds maximum allowed")]
	ExceedsMaxAmount,
	#[msg("Target program is not whitelisted for this service")]
	ProgramNotWhitelisted,
	#[msg("Permit has already been executed")]
	PermitAlreadyExecuted,
	#[msg("Invalid fee parameters provided")]
	InvalidFeeParameters,
	#[msg("Only service owner can perform this action")]
	UnauthorizedServiceOwner,
	#[msg("Only protocol admin can perform this action")]
	UnauthorizedProtocolAdmin,
}
