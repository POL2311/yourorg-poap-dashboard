pub mod common;

use {
    common::{
        get_program_test,
        gasless_infrastructure_ix_interface,
    },
    solana_program_test::tokio,
    solana_sdk::{
        account::Account, 
        pubkey::Pubkey, 
        signature::Keypair, 
        signer::Signer, 
        system_program,
    },
};

#[tokio::test]
async fn initialize_protocol_ix_success() {
    let mut program_test = get_program_test();

    // DATA
    let master_treasury = Pubkey::new_unique();
    let protocol_fee_bps: u16 = 500; // 5% fee

    // KEYPAIRS
    let fee_payer_keypair = Keypair::new();
    let admin_keypair = Keypair::new();

    // PDA
    let (protocol_pda, _protocol_pda_bump) = Pubkey::find_program_address(
        &[b"gasless_protocol"],
        &gasless_infrastructure::ID,
    );

    // ACCOUNT SETUP
    program_test.add_account(
        fee_payer_keypair.pubkey(),
        Account {
            lamports: 1_000_000_000_000,
            data: vec![],
            owner: system_program::ID,
            executable: false,
            rent_epoch: 0,
        },
    );

    program_test.add_account(
        admin_keypair.pubkey(),
        Account {
            lamports: 1_000_000_000,
            data: vec![],
            owner: system_program::ID,
            executable: false,
            rent_epoch: 0,
        },
    );

    // START TEST
    let (mut banks_client, _, recent_blockhash) = program_test.start().await;

    let ix = gasless_infrastructure_ix_interface::initialize_protocol_ix_setup(
        &fee_payer_keypair,
        protocol_pda,
        &admin_keypair,
        system_program::ID,
        master_treasury,
        protocol_fee_bps,
        recent_blockhash,
    );

    let result = banks_client.process_transaction(ix).await;

    // ASSERTIONS
    assert!(result.is_ok(), "Initialize protocol transaction should succeed");

    // Verify the protocol account was created
    let protocol_account = banks_client.get_account(protocol_pda).await.unwrap();
    assert!(protocol_account.is_some(), "Protocol account should exist");
    
    let account_data = protocol_account.unwrap();
    assert_eq!(account_data.owner, gasless_infrastructure::ID);
    assert!(account_data.data.len() > 0, "Protocol account should have data");
}