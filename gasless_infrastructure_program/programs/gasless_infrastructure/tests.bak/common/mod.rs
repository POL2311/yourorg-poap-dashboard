use {
	gasless_infrastructure::{
			entry,
			ID as PROGRAM_ID,
	},
	solana_sdk::{
		entrypoint::{ProcessInstruction, ProgramResult},
		pubkey::Pubkey,
	},
	anchor_lang::prelude::AccountInfo,
	solana_program_test::*,
};

// Type alias for the entry function pointer used to convert the entry function into a ProcessInstruction function pointer.
pub type ProgramEntry = for<'info> fn(
	program_id: &Pubkey,
	accounts: &'info [AccountInfo<'info>],
	instruction_data: &[u8],
) -> ProgramResult;

// Macro to convert the entry function into a ProcessInstruction function pointer.
#[macro_export]
macro_rules! convert_entry {
	($entry:expr) => {
		// Use unsafe block to perform memory transmutation.
		unsafe { core::mem::transmute::<ProgramEntry, ProcessInstruction>($entry) }
	};
}

pub fn get_program_test() -> ProgramTest {
	let program_test = ProgramTest::new(
		"gasless_infrastructure",
		PROGRAM_ID,
		processor!(convert_entry!(entry)),
	);
	program_test
}
	
pub mod gasless_infrastructure_ix_interface {

	use {
		solana_sdk::{
			hash::Hash,
			signature::{Keypair, Signer},
			instruction::Instruction,
			pubkey::Pubkey,
			transaction::Transaction,
		},
		gasless_infrastructure::{
			ID as PROGRAM_ID,
			accounts as gasless_infrastructure_accounts,
			instruction as gasless_infrastructure_instruction,
		},
		anchor_lang::{
			prelude::*,
			InstructionData,
		}
	};

	pub fn initialize_protocol_ix_setup(
		fee_payer: &Keypair,
		protocol: Pubkey,
		admin: &Keypair,
		system_program: Pubkey,
		master_treasury: Pubkey,
		protocol_fee_bps: u16,
		recent_blockhash: Hash,
	) -> Transaction {
		let accounts = gasless_infrastructure_accounts::InitializeProtocol {
			fee_payer: fee_payer.pubkey(),
			protocol: protocol,
			admin: admin.pubkey(),
			system_program: system_program,
		};

		let data = 	gasless_infrastructure_instruction::InitializeProtocol {
				master_treasury,
				protocol_fee_bps,
		};		let instruction = Instruction::new_with_bytes(PROGRAM_ID, &data.data(), accounts.to_account_metas(None));
		let mut transaction = Transaction::new_with_payer(
			&[instruction], 
			Some(&fee_payer.pubkey()),
		);

		transaction.sign(&[
			&fee_payer,
			&admin,
		], recent_blockhash);

		return transaction;
	}

	pub fn register_service_ix_setup(
		fee_payer: &Keypair,
		protocol: Pubkey,
		service: Pubkey,
		fee_vault: Pubkey,
		owner: &Keypair,
		usdc_vault: &Keypair,
		usdc_mint: Pubkey,
		system_program: Pubkey,
		funding: &Keypair,
		assoc_token_account: Pubkey,
		wallet: Pubkey,
		mint: Pubkey,
		token_program: Pubkey,
		csl_spl_assoc_token_v0_0_0: Pubkey,
		fee_collector: Pubkey,
		service_id: &String,
		service_fee_bps: u16,
		max_transaction_amount: u64,
		allowed_programs: Vec<Pubkey>,
		recent_blockhash: Hash,
	) -> Transaction {
		let accounts = gasless_infrastructure_accounts::RegisterService {
			fee_payer: fee_payer.pubkey(),
			protocol: protocol,
			service: service,
			fee_vault: fee_vault,
			owner: owner.pubkey(),
			usdc_vault: usdc_vault.pubkey(),
			usdc_mint: usdc_mint,
			system_program: system_program,
			funding: funding.pubkey(),
			assoc_token_account: assoc_token_account,
			wallet: wallet,
			mint: mint,
			token_program: token_program,
			csl_spl_assoc_token_v0_0_0: csl_spl_assoc_token_v0_0_0,
		};

		let data = 	gasless_infrastructure_instruction::RegisterService {
				fee_collector,
				service_id: service_id.clone(),
				service_fee_bps,
				max_transaction_amount,
				allowed_programs,
		};		let instruction = Instruction::new_with_bytes(PROGRAM_ID, &data.data(), accounts.to_account_metas(None));
		let mut transaction = Transaction::new_with_payer(
			&[instruction], 
			Some(&fee_payer.pubkey()),
		);

		transaction.sign(&[
			&fee_payer,
			&owner,
			&usdc_vault,
			&funding,
		], recent_blockhash);

		return transaction;
	}

	pub fn authorize_relayer_ix_setup(
		fee_payer: &Keypair,
		protocol: Pubkey,
		relayer_config: Pubkey,
		admin: &Keypair,
		system_program: Pubkey,
		relayer: Pubkey,
		recent_blockhash: Hash,
	) -> Transaction {
		let accounts = gasless_infrastructure_accounts::AuthorizeRelayer {
			fee_payer: fee_payer.pubkey(),
			protocol: protocol,
			relayer_config: relayer_config,
			admin: admin.pubkey(),
			system_program: system_program,
		};

		let data = 	gasless_infrastructure_instruction::AuthorizeRelayer {
				relayer,
		};		let instruction = Instruction::new_with_bytes(PROGRAM_ID, &data.data(), accounts.to_account_metas(None));
		let mut transaction = Transaction::new_with_payer(
			&[instruction], 
			Some(&fee_payer.pubkey()),
		);

		transaction.sign(&[
			&fee_payer,
			&admin,
		], recent_blockhash);

		return transaction;
	}

	pub fn create_user_permit_ix_setup(
		fee_payer: &Keypair,
		service: Pubkey,
		user_permit: Pubkey,
		system_program: Pubkey,
		user: Pubkey,
		service_id: &String,
		nonce: u64,
		instruction_data: Vec<u8>,
		target_program: Pubkey,
		expiry: i64,
		max_fee: u64,
		signature: Vec<u8>,
		recent_blockhash: Hash,
	) -> Transaction {
		let accounts = gasless_infrastructure_accounts::CreateUserPermit {
			fee_payer: fee_payer.pubkey(),
			service: service,
			user_permit: user_permit,
			system_program: system_program,
		};

		let data = 	gasless_infrastructure_instruction::CreateUserPermit {
				user,
				service_id: service_id.clone(),
				nonce,
				instruction_data,
				target_program,
				expiry,
				max_fee,
				signature,
		};		let instruction = Instruction::new_with_bytes(PROGRAM_ID, &data.data(), accounts.to_account_metas(None));
		let mut transaction = Transaction::new_with_payer(
			&[instruction], 
			Some(&fee_payer.pubkey()),
		);

		transaction.sign(&[
			&fee_payer,
		], recent_blockhash);

		return transaction;
	}

	pub fn execute_gasless_transaction_ix_setup(
		relayer: &Keypair,
		protocol: Pubkey,
		service: Pubkey,
		user_permit: Pubkey,
		relayer_config: Pubkey,
		fee_vault: Pubkey,
		user: Pubkey,
		service_id: &String,
		nonce: u64,
		recent_blockhash: Hash,
	) -> Transaction {
		let accounts = gasless_infrastructure_accounts::ExecuteGaslessTransaction {
			relayer: relayer.pubkey(),
			protocol: protocol,
			service: service,
			user_permit: user_permit,
			relayer_config: relayer_config,
			fee_vault: fee_vault,
		};

		let data = 	gasless_infrastructure_instruction::ExecuteGaslessTransaction {
				user,
				service_id: service_id.clone(),
				nonce,
		};		let instruction = Instruction::new_with_bytes(PROGRAM_ID, &data.data(), accounts.to_account_metas(None));
		let mut transaction = Transaction::new_with_payer(
			&[instruction], 
			Some(&relayer.pubkey()),
		);

		transaction.sign(&[
			&relayer,
		], recent_blockhash);

		return transaction;
	}

	pub fn mint_nft_gasless_ix_setup(
		relayer: &Keypair,
		protocol: Pubkey,
		service: Pubkey,
		user_permit: Pubkey,
		fee_vault: Pubkey,
		nft_mint: &Keypair,
		user_nft_account: &Keypair,
		system_program: Pubkey,
		mint: Pubkey,
		funding: &Keypair,
		assoc_token_account: Pubkey,
		wallet: Pubkey,
		token_program: Pubkey,
		owner: &Keypair,
		csl_spl_token_v0_0_0: Pubkey,
		csl_spl_assoc_token_v0_0_0: Pubkey,
		user: Pubkey,
		service_id: &String,
		nonce: u64,
		recent_blockhash: Hash,
	) -> Transaction {
		let accounts = gasless_infrastructure_accounts::MintNftGasless {
			relayer: relayer.pubkey(),
			protocol: protocol,
			service: service,
			user_permit: user_permit,
			fee_vault: fee_vault,
			nft_mint: nft_mint.pubkey(),
			user_nft_account: user_nft_account.pubkey(),
			system_program: system_program,
			mint: mint,
			funding: funding.pubkey(),
			assoc_token_account: assoc_token_account,
			wallet: wallet,
			token_program: token_program,
			owner: owner.pubkey(),
			csl_spl_token_v0_0_0: csl_spl_token_v0_0_0,
			csl_spl_assoc_token_v0_0_0: csl_spl_assoc_token_v0_0_0,
		};

		let data = 	gasless_infrastructure_instruction::MintNftGasless {
				user,
				service_id: service_id.clone(),
				nonce,
		};		let instruction = Instruction::new_with_bytes(PROGRAM_ID, &data.data(), accounts.to_account_metas(None));
		let mut transaction = Transaction::new_with_payer(
			&[instruction], 
			Some(&relayer.pubkey()),
		);

		transaction.partial_sign(&[
			&relayer,
			&nft_mint,
			&user_nft_account,
			&funding,
		], recent_blockhash);

		transaction.partial_sign(&[
			&owner,
		], recent_blockhash);

		return transaction;
	}

	pub fn deposit_treasury_ix_setup(
		fee_payer: &Keypair,
		service: Pubkey,
		fee_vault: Pubkey,
		depositor: &Keypair,
		depositor_usdc_account: Pubkey,
		vault_usdc_account: Pubkey,
		usdc_mint: Pubkey,
		source: Pubkey,
		mint: Pubkey,
		destination: Pubkey,
		authority: &Keypair,
		csl_spl_token_v0_0_0: Pubkey,
		service_id: &String,
		amount: u64,
		recent_blockhash: Hash,
	) -> Transaction {
		let accounts = gasless_infrastructure_accounts::DepositTreasury {
			fee_payer: fee_payer.pubkey(),
			service: service,
			fee_vault: fee_vault,
			depositor: depositor.pubkey(),
			depositor_usdc_account: depositor_usdc_account,
			vault_usdc_account: vault_usdc_account,
			usdc_mint: usdc_mint,
			source: source,
			mint: mint,
			destination: destination,
			authority: authority.pubkey(),
			csl_spl_token_v0_0_0: csl_spl_token_v0_0_0,
		};

		let data = 	gasless_infrastructure_instruction::DepositTreasury {
				service_id: service_id.clone(),
				amount,
		};		let instruction = Instruction::new_with_bytes(PROGRAM_ID, &data.data(), accounts.to_account_metas(None));
		let mut transaction = Transaction::new_with_payer(
			&[instruction], 
			Some(&fee_payer.pubkey()),
		);

		transaction.sign(&[
			&fee_payer,
			&depositor,
			&authority,
		], recent_blockhash);

		return transaction;
	}

	pub fn withdraw_fees_ix_setup(
		fee_payer: &Keypair,
		service: Pubkey,
		fee_vault: Pubkey,
		owner: &Keypair,
		fee_collector_usdc_account: Pubkey,
		vault_usdc_account: Pubkey,
		usdc_mint: Pubkey,
		source: Pubkey,
		mint: Pubkey,
		destination: Pubkey,
		authority: &Keypair,
		csl_spl_token_v0_0_0: Pubkey,
		service_id: &String,
		amount: u64,
		recent_blockhash: Hash,
	) -> Transaction {
		let accounts = gasless_infrastructure_accounts::WithdrawFees {
			fee_payer: fee_payer.pubkey(),
			service: service,
			fee_vault: fee_vault,
			owner: owner.pubkey(),
			fee_collector_usdc_account: fee_collector_usdc_account,
			vault_usdc_account: vault_usdc_account,
			usdc_mint: usdc_mint,
			source: source,
			mint: mint,
			destination: destination,
			authority: authority.pubkey(),
			csl_spl_token_v0_0_0: csl_spl_token_v0_0_0,
		};

		let data = 	gasless_infrastructure_instruction::WithdrawFees {
				service_id: service_id.clone(),
				amount,
		};		let instruction = Instruction::new_with_bytes(PROGRAM_ID, &data.data(), accounts.to_account_metas(None));
		let mut transaction = Transaction::new_with_payer(
			&[instruction], 
			Some(&fee_payer.pubkey()),
		);

		transaction.sign(&[
			&fee_payer,
			&owner,
			&authority,
		], recent_blockhash);

		return transaction;
	}

	pub fn update_service_config_ix_setup(
		fee_payer: &Keypair,
		service: Pubkey,
		owner: &Keypair,
		service_id: &String,
		new_fee_bps: Option<u16>,
		new_max_amount: Option<u64>,
		new_is_active: Option<bool>,
		recent_blockhash: Hash,
	) -> Transaction {
		let accounts = gasless_infrastructure_accounts::UpdateServiceConfig {
			fee_payer: fee_payer.pubkey(),
			service: service,
			owner: owner.pubkey(),
		};

		let data = 	gasless_infrastructure_instruction::UpdateServiceConfig {
				service_id: service_id.clone(),
				new_fee_bps,
				new_max_amount,
				new_is_active,
		};		let instruction = Instruction::new_with_bytes(PROGRAM_ID, &data.data(), accounts.to_account_metas(None));
		let mut transaction = Transaction::new_with_payer(
			&[instruction], 
			Some(&fee_payer.pubkey()),
		);

		transaction.sign(&[
			&fee_payer,
			&owner,
		], recent_blockhash);

		return transaction;
	}

}

pub mod csl_spl_token_ix_interface {

	use {
		solana_sdk::{
			hash::Hash,
			signature::{Keypair, Signer},
			instruction::Instruction,
			pubkey::Pubkey,
			transaction::Transaction,
		},
		csl_spl_token::{
			ID as PROGRAM_ID,
			accounts as csl_spl_token_accounts,
			instruction as csl_spl_token_instruction,
		},
		anchor_lang::{
			prelude::*,
			InstructionData,
		}
	};

	declare_id!("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

}

pub mod csl_spl_assoc_token_ix_interface {

	use {
		solana_sdk::{
			hash::Hash,
			signature::{Keypair, Signer},
			instruction::Instruction,
			pubkey::Pubkey,
			transaction::Transaction,
		},
		csl_spl_assoc_token::{
			ID as PROGRAM_ID,
			accounts as csl_spl_assoc_token_accounts,
			instruction as csl_spl_assoc_token_instruction,
		},
		anchor_lang::{
			prelude::*,
			InstructionData,
		}
	};

	declare_id!("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");

}
