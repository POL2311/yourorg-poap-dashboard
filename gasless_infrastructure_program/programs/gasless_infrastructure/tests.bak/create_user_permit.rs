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
async fn create_user_permit_ix_success() {
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
	let user: Pubkey = Pubkey::default();
	let service_id: String = Default::default();
	let nonce: u64 = Default::default();
	let instruction_data: Vec<u8> = vec![Default::default()];
	let target_program: Pubkey = Pubkey::default();
	let expiry: i64 = Default::default();
	let max_fee: u64 = Default::default();
	let signature: Vec<u8> = vec![Default::default()];

	// KEYPAIR
	let fee_payer_keypair = Keypair::new();

	// PUBKEY
	let fee_payer_pubkey = fee_payer_keypair.pubkey();

	// EXECUTABLE PUBKEY
	let system_program_pubkey = Pubkey::from_str("11111111111111111111111111111111").unwrap();

	// PDA
	let (service_pda, _service_pda_bump) = Pubkey::find_program_address(
		&[
			b"service",
			service_id.as_bytes().as_ref(),
		],
		&gasless_infrastructure::ID,
	);

	let (user_permit_pda, _user_permit_pda_bump) = Pubkey::find_program_address(
		&[
			b"permit",
			user.as_ref(),
			service_pubkey.as_ref(),
			nonce.to_le_bytes().as_ref(),
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

	// INSTRUCTIONS
	let (mut banks_client, _, recent_blockhash) = program_test.start().await;

	let ix = gasless_infrastructure_ix_interface::create_user_permit_ix_setup(
		&fee_payer_keypair,
		service_pda,
		user_permit_pda,
		system_program_pubkey,
		user,
		&service_id,
		nonce,
		instruction_data,
		target_program,
		expiry,
		max_fee,
		signature,
		recent_blockhash,
	);

	let result = banks_client.process_transaction(ix).await;

	// ASSERTIONS
	assert!(result.is_ok());

}
