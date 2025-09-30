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
async fn mint_nft_gasless_ix_success() {
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

	program_test.add_program(
		"csl_spl_assoc_token",
		Pubkey::from_str("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL").unwrap(),
		None,
	);

	// DATA
	let user: Pubkey = Pubkey::default();
	let service_id: String = Default::default();
	let nonce: u64 = Default::default();

	// KEYPAIR
	let relayer_keypair = Keypair::new();
	let nft_mint_keypair = Keypair::new();
	let user_nft_account_keypair = Keypair::new();
	let funding_keypair = Keypair::new();
	let owner_keypair = Keypair::new();
	let mint_keypair = Keypair::new();

	// PUBKEY
	let relayer_pubkey = relayer_keypair.pubkey();
	let nft_mint_pubkey = nft_mint_keypair.pubkey();
	let user_nft_account_pubkey = user_nft_account_keypair.pubkey();
	let funding_pubkey = funding_keypair.pubkey();
	let owner_pubkey = owner_keypair.pubkey();
	let mint_pubkey = mint_keypair.pubkey();
	let wallet_pubkey = Pubkey::new_unique();
	let token_program_pubkey = csl_spl_token_ix_interface::ID;

	// EXECUTABLE PUBKEY
	let system_program_pubkey = Pubkey::from_str("11111111111111111111111111111111").unwrap();
	let csl_spl_token_v0_0_0_pubkey = Pubkey::from_str("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA").unwrap();
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

	let (user_permit_pda, _user_permit_pda_bump) = Pubkey::find_program_address(
		&[
			b"permit",
			user.as_ref(),
			service_pubkey.as_ref(),
			nonce.to_le_bytes().as_ref(),
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
		nft_mint_pubkey,
		Account {
			lamports: 0,
			data: vec![],
			owner: system_program::ID,
			executable: false,
			rent_epoch: 0,
		},
	);

	program_test.add_account(
		user_nft_account_pubkey,
		Account {
			lamports: 0,
			data: vec![],
			owner: system_program::ID,
			executable: false,
			rent_epoch: 0,
		},
	);

	program_test.add_account(
		relayer_pubkey,
		Account {
			lamports: 1_000_000_000_000,
			data: vec![],
			owner: system_program::ID,
			executable: false,
			rent_epoch: 0,
		},
	);

	program_test.add_account(
		nft_mint_pubkey,
		Account {
			lamports: 0,
			data: vec![],
			owner: system_program::ID,
			executable: false,
			rent_epoch: 0,
		},
	);

	program_test.add_account(
		user_nft_account_pubkey,
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

	let ix = gasless_infrastructure_ix_interface::mint_nft_gasless_ix_setup(
		&relayer_keypair,
		protocol_pda,
		service_pda,
		user_permit_pda,
		fee_vault_pda,
		&nft_mint_keypair,
		&user_nft_account_keypair,
		system_program_pubkey,
		mint_pubkey,
		&funding_keypair,
		assoc_token_account_pda,
		wallet_pubkey,
		token_program_pubkey,
		&owner_keypair,
		csl_spl_token_v0_0_0_pubkey,
		csl_spl_assoc_token_v0_0_0_pubkey,
		user,
		&service_id,
		nonce,
		recent_blockhash,
	);

	let result = banks_client.process_transaction(ix).await;

	// ASSERTIONS
	assert!(result.is_ok());

}
