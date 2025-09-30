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
async fn update_service_config_ix_success() {
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

	// DATA
	let service_id: String = Default::default();
	let new_fee_bps = None;
	let new_max_amount = None;
	let new_is_active = None;

	// KEYPAIR
	let fee_payer_keypair = Keypair::new();
	let owner_keypair = Keypair::new();

	// PUBKEY
	let fee_payer_pubkey = fee_payer_keypair.pubkey();
	let owner_pubkey = owner_keypair.pubkey();

	// PDA
	let (service_pda, _service_pda_bump) = Pubkey::find_program_address(
		&[
			b"service",
			service_id.as_bytes().as_ref(),
		],
		&gasless_infrastructure::ID,
	);

	// ACCOUNT PROGRAM TEST SETUP
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

	// INSTRUCTIONS
	let (mut banks_client, _, recent_blockhash) = program_test.start().await;

	let ix = gasless_infrastructure_ix_interface::update_service_config_ix_setup(
		&fee_payer_keypair,
		service_pda,
		&owner_keypair,
		&service_id,
		new_fee_bps,
		new_max_amount,
		new_is_active,
		recent_blockhash,
	);

	let result = banks_client.process_transaction(ix).await;

	// ASSERTIONS
	assert!(result.is_ok());

}
