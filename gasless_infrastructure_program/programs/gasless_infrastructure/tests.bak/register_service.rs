pub mod common;

use std::str::FromStr;
use {
    common::{
		get_program_test,
		gasless_infrastructure_ix_interface,
		csl_spl_token_ix_interface,
		csl_spl_assoc_token_ix_interface,
	},
    solana_program_test::tokio,
    solana_sdk::{
        account::Account, pubkey::Pubkey, rent::Rent, signature::Keypair, signer::Signer, system_program,
    },
};


#[tokio::test]
async fn register_service_ix_success() {
	let mut program_test = get_program_test();

	// PROGRAMS
	program_test.prefer_bpf(true);

	program_test.add_program(
		"account_compression",
		Pubkey::from_str("cmtDvXumGCrqC1Age74AVPhSRVXJMd8PJS91L8KbNCK").unwrap(),
		None,
	);

	program_test.add_program(
		"noop",
		Pubkey::from_str("noopb9bkMVfRPU8AsbpTUg8AQkHtKwMYZiFUjNRtMmV").unwrap(),
		None,
	);

	program_test.add_program(
		"csl_spl_assoc_token",
		Pubkey::from_str("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL").unwrap(),
		None,
	);

	// DATA
	let fee_collector: Pubkey = Pubkey::default();
	let service_id: String = Default::default();
	let service_fee_bps: u16 = Default::default();
	let max_transaction_amount: u64 = Default::default();
	let allowed_programs: Vec<Pubkey> = vec![Pubkey::default()];

	// KEYPAIR
	let fee_payer_keypair = Keypair::new();
	let owner_keypair = Keypair::new();
	let usdc_vault_keypair = Keypair::new();
	let funding_keypair = Keypair::new();
	let usdc_mint_keypair = Keypair::new();
	let mint_keypair = Keypair::new();

	// PUBKEY
	let fee_payer_pubkey = fee_payer_keypair.pubkey();
	let owner_pubkey = owner_keypair.pubkey();
	let usdc_vault_pubkey = usdc_vault_keypair.pubkey();
	let funding_pubkey = funding_keypair.pubkey();
	let usdc_mint_pubkey = usdc_mint_keypair.pubkey();
	let wallet_pubkey = Pubkey::new_unique();
	let mint_pubkey = mint_keypair.pubkey();
	let token_program_pubkey = csl_spl_token_ix_interface::ID;

	// EXECUTABLE PUBKEY
	let system_program_pubkey = Pubkey::from_str("11111111111111111111111111111111").unwrap();
	let csl_spl_assoc_token_v0_0_0_pubkey = Pubkey::from_str("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL").unwrap();

	// PDA
	let (protocol_pda, _protocol_pda_bump) = Pubkey::find_program_address(
		&[
			b"gasless_protocol",
		],
		&gasless_infrastructure::ID,
	);

	let (service_pda, _service_pda_bump) = Pubkey::find_program_address(
		&[
			b"service",
			service_id.as_bytes().as_ref(),
		],
		&gasless_infrastructure::ID,
	);

	let (fee_vault_pda, _fee_vault_pda_bump) = Pubkey::find_program_address(
		&[
			b"fee_vault",
			service_pubkey.as_ref(),
		],
		&gasless_infrastructure::ID,
	);

	let (assoc_token_account_pda, _assoc_token_account_pda_bump) = Pubkey::find_program_address(
		&[
			wallet_pubkey.as_ref(),
			token_program_pubkey.as_ref(),
			mint_pubkey.as_ref(),
		],
		&csl_spl_token_ix_interface::ID,
	);

	// ACCOUNT PROGRAM TEST SETUP
	program_test.add_account(
		usdc_vault_pubkey,
		Account {
			lamports: 0,
			data: vec![],
			owner: system_program::ID,
			executable: false,
			rent_epoch: 0,
		},
	);

	program_test.add_account(
		fee_payer_pubkey,
		Account {
			lamports: 1_000_000_000_000,
			data: vec![],
			owner: system_program::ID,
			executable: false,
			rent_epoch: 0,
		},
	);

	program_test.add_account(
		owner_pubkey,
		Account {
			lamports: 0,
			data: vec![],
			owner: system_program::ID,
			executable: false,
			rent_epoch: 0,
		},
	);

	program_test.add_account(
		usdc_vault_pubkey,
		Account {
			lamports: 0,
			data: vec![],
			owner: system_program::ID,
			executable: false,
			rent_epoch: 0,
		},
	);

	program_test.add_account(
		funding_pubkey,
		Account {
			lamports: 1_000_000_000_000,
			data: vec![],
			owner: system_program::ID,
			executable: false,
			rent_epoch: 0,
		},
	);

	// INSTRUCTIONS
	let (mut banks_client, _, recent_blockhash) = program_test.start().await;

	let ix = gasless_infrastructure_ix_interface::register_service_ix_setup(
		&fee_payer_keypair,
		protocol_pda,
		service_pda,
		fee_vault_pda,
		&owner_keypair,
		&usdc_vault_keypair,
		usdc_mint_pubkey,
		system_program_pubkey,
		&funding_keypair,
		assoc_token_account_pda,
		wallet_pubkey,
		mint_pubkey,
		token_program_pubkey,
		csl_spl_assoc_token_v0_0_0_pubkey,
		fee_collector,
		&service_id,
		service_fee_bps,
		max_transaction_amount,
		allowed_programs,
		recent_blockhash,
	);

	let result = banks_client.process_transaction(ix).await;

	// ASSERTIONS
	assert!(result.is_ok());

}
