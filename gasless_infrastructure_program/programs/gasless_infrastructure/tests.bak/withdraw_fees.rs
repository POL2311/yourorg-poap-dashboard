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
async fn withdraw_fees_ix_success() {
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
		"csl_spl_token",
		Pubkey::from_str("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA").unwrap(),
		None,
	);

	// DATA
	let service_id: String = Default::default();
	let amount: u64 = Default::default();

	// KEYPAIR
	let fee_payer_keypair = Keypair::new();
	let owner_keypair = Keypair::new();
	let authority_keypair = Keypair::new();
	let usdc_mint_keypair = Keypair::new();
	let mint_keypair = Keypair::new();

	// PUBKEY
	let fee_payer_pubkey = fee_payer_keypair.pubkey();
	let owner_pubkey = owner_keypair.pubkey();
	let authority_pubkey = authority_keypair.pubkey();
	let fee_collector_usdc_account_pubkey = Pubkey::new_unique();
	let vault_usdc_account_pubkey = Pubkey::new_unique();
	let usdc_mint_pubkey = usdc_mint_keypair.pubkey();
	let source_pubkey = Pubkey::new_unique();
	let mint_pubkey = mint_keypair.pubkey();
	let destination_pubkey = Pubkey::new_unique();

	// EXECUTABLE PUBKEY
	let csl_spl_token_v0_0_0_pubkey = Pubkey::from_str("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA").unwrap();

	// PDA
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

	program_test.add_account(
		authority_pubkey,
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

	let ix = gasless_infrastructure_ix_interface::withdraw_fees_ix_setup(
		&fee_payer_keypair,
		service_pda,
		fee_vault_pda,
		&owner_keypair,
		fee_collector_usdc_account_pubkey,
		vault_usdc_account_pubkey,
		usdc_mint_pubkey,
		source_pubkey,
		mint_pubkey,
		destination_pubkey,
		&authority_keypair,
		csl_spl_token_v0_0_0_pubkey,
		&service_id,
		amount,
		recent_blockhash,
	);

	let result = banks_client.process_transaction(ix).await;

	// ASSERTIONS
	assert!(result.is_ok());

}
