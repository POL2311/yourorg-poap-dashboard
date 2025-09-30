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
async fn authorize_relayer_ix_success() {
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
	let relayer: Pubkey = Pubkey::default();

	// KEYPAIR
	let fee_payer_keypair = Keypair::new();
	let admin_keypair = Keypair::new();

	// PUBKEY
	let fee_payer_pubkey = fee_payer_keypair.pubkey();
	let admin_pubkey = admin_keypair.pubkey();

	// EXECUTABLE PUBKEY
	let system_program_pubkey = Pubkey::from_str("11111111111111111111111111111111").unwrap();

	// PDA
	let (protocol_pda, _protocol_pda_bump) = Pubkey::find_program_address(
		&[
			b"gasless_protocol",
		],
		&gasless_infrastructure::ID,
	);

	let (relayer_config_pda, _relayer_config_pda_bump) = Pubkey::find_program_address(
		&[
			b"relayer",
			relayer.as_ref(),
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
		admin_pubkey,
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

	let ix = gasless_infrastructure_ix_interface::authorize_relayer_ix_setup(
		&fee_payer_keypair,
		protocol_pda,
		relayer_config_pda,
		&admin_keypair,
		system_program_pubkey,
		relayer,
		recent_blockhash,
	);

	let result = banks_client.process_transaction(ix).await;

	// ASSERTIONS
	assert!(result.is_ok());

}
