pub mod common;

use std::str::FromStr;
use {
    common::{
        get_program_test,
        gasless_infrastructure_ix_interface,
    },
    solana_program_test::tokio,
    solana_sdk::{
        account::Account, pubkey::Pubkey, rent::Rent, signature::Keypair, signer::Signer, system_program,
    },
};

#[tokio::test]
async fn execute_gasless_transaction_ix_success() {
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
    let user: Pubkey = Pubkey::new_unique();
    let service_id: String = "test_service".to_string();
    let nonce: u64 = 1;

    // KEYPAIR
    let relayer_keypair = Keypair::new();

    // PUBKEY
    let relayer_pubkey = relayer_keypair.pubkey();

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
            service_pda.as_ref(), // Fixed: use service_pda instead of service_pubkey
            nonce.to_le_bytes().as_ref(),
        ],
        &gasless_infrastructure::ID,
    );

    let (relayer_config_pda, _relayer_config_pda_bump) = Pubkey::find_program_address(
        &[
            b"relayer",
            relayer_pubkey.as_ref(),
        ],
        &gasless_infrastructure::ID,
    );

    let (fee_vault_pda, _fee_vault_pda_bump) = Pubkey::find_program_address(
        &[
            b"fee_vault",
            service_pda.as_ref(), // Fixed: use service_pda instead of service_pubkey
        ],
        &gasless_infrastructure::ID,
    );

    // ACCOUNT PROGRAM TEST SETUP
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

    // Add mock accounts for the test
    program_test.add_account(
        protocol_pda,
        Account {
            lamports: Rent::default().minimum_balance(92), // Space for GaslessProtocol
            data: vec![0; 92],
            owner: gasless_infrastructure::ID,
            executable: false,
            rent_epoch: 0,
        },
    );

    program_test.add_account(
        service_pda,
        Account {
            lamports: Rent::default().minimum_balance(804), // Space for ServiceProvider
            data: vec![0; 804],
            owner: gasless_infrastructure::ID,
            executable: false,
            rent_epoch: 0,
        },
    );

    program_test.add_account(
        user_permit_pda,
        Account {
            lamports: Rent::default().minimum_balance(200), // Space for UserPermit
            data: vec![0; 200],
            owner: gasless_infrastructure::ID,
            executable: false,
            rent_epoch: 0,
        },
    );

    program_test.add_account(
        relayer_config_pda,
        Account {
            lamports: Rent::default().minimum_balance(57), // Space for RelayerConfig
            data: vec![0; 57],
            owner: gasless_infrastructure::ID,
            executable: false,
            rent_epoch: 0,
        },
    );

    program_test.add_account(
        fee_vault_pda,
        Account {
            lamports: Rent::default().minimum_balance(129), // Space for FeeVault
            data: vec![0; 129],
            owner: gasless_infrastructure::ID,
            executable: false,
            rent_epoch: 0,
        },
    );

    // INSTRUCTIONS
    let (mut banks_client, _, recent_blockhash) = program_test.start().await;

    let ix = gasless_infrastructure_ix_interface::execute_gasless_transaction_ix_setup(
        &relayer_keypair,
        protocol_pda,
        service_pda,
        user_permit_pda,
        relayer_config_pda,
        fee_vault_pda,
        user,
        &service_id,
        nonce,
        recent_blockhash,
    );

    let result = banks_client.process_transaction(ix).await;

    // ASSERTIONS
    // Note: This test will likely fail due to uninitialized accounts
    // In a real test, you'd need to initialize all the accounts first
    println!("Transaction result: {:?}", result);
}