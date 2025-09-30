import {
  Keypair,
  PublicKey,
  type AccountMeta,
  type TransactionInstruction,
  type TransactionSignature,
} from "@solana/web3.js";
import { useCallback, useEffect } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import * as programClient from "~/solana/client";

// Props interface for the useProgram hook
export interface UseProgramProps {
  // Optional override for the VITE_SOLANA_PROGRAM_ID env var
  programId?: string;
}

// Error structure returned from sendAndConfirmTx if transaction fails
type SendAndConfirmTxError = {
  message: string;
  logs: string[];
  stack: string | undefined;
};

// Result structure returned from sendAndConfirmTx
type SendAndConfirmTxResult = {
  // Signature of successful transaction
  signature?: string;

  // Error details if transaction fails
  error?: SendAndConfirmTxError;
};

// Helper function to send and confirm a transaction, with error handling
const sendAndConfirmTx = async (
  fn: () => Promise<TransactionSignature>,
): Promise<SendAndConfirmTxResult> => {
  try {
    const signature = await fn();
    return {
      signature,
    };
  } catch (e: any) {
    let message = `An unknown error occurred: ${e}`;
    let logs = [];
    let stack = "";

    if ("logs" in e && e.logs instanceof Array) {
      logs = e.logs;
    }

    if ("stack" in e) {
      stack = e.stack;
    }

    if ("message" in e) {
      message = e.message;
    }

    return {
      error: {
        logs,
        stack,
        message,
      },
    };
  }
};

const useProgram = (props?: UseProgramProps | undefined) => {
  const { connection } = useConnection();

  useEffect(() => {
    let prgId = import.meta.env.VITE_SOLANA_PROGRAM_ID as string | undefined;

    if (props?.programId) {
      prgId = props.programId;
    }

    if (!prgId) {
      throw new Error(
        "the program id must be provided either by the useProgram props or the env var VITE_SOLANA_PROGRAM_ID",
      );
    }

    programClient.initializeClient(new PublicKey(prgId));
  }, [props?.programId, connection.rpcEndpoint]);

  /**
   * Initialize the gasless protocol with global configuration
   *
   * Accounts:
   * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
   * 1. `[writable]` protocol: {@link GaslessProtocol} Protocol configuration account
   * 2. `[signer]` admin: {@link PublicKey} Protocol administrator
   * 3. `[]` system_program: {@link PublicKey} Auto-generated, for account initialization
   *
   * Data:
   * - master_treasury: {@link PublicKey} Master treasury wallet
   * - protocol_fee_bps: {@link number} Protocol fee in basis points
   *
   * @returns {@link TransactionInstruction}
   */
  const initializeProtocol = useCallback(programClient.initializeProtocol, [])

  /**
   * Initialize the gasless protocol with global configuration
   *
   * Accounts:
   * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
   * 1. `[writable]` protocol: {@link GaslessProtocol} Protocol configuration account
   * 2. `[signer]` admin: {@link PublicKey} Protocol administrator
   * 3. `[]` system_program: {@link PublicKey} Auto-generated, for account initialization
   *
   * Data:
   * - master_treasury: {@link PublicKey} Master treasury wallet
   * - protocol_fee_bps: {@link number} Protocol fee in basis points
   *
   * @returns {@link SendAndConfirmTxResult}
   */
  const initializeProtocolSendAndConfirm = useCallback(async (
    args: Omit<programClient.InitializeProtocolArgs, "feePayer" | "admin"> & {
    signers: {
        feePayer: Keypair,
        admin: Keypair,
    }}, 
    remainingAccounts: Array<AccountMeta> = []
  ): Promise<SendAndConfirmTxResult> => sendAndConfirmTx(() => programClient.initializeProtocolSendAndConfirm(args, remainingAccounts)), [])

  /**
   * Register a new service to use gasless infrastructure
   *
   * Accounts:
   * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
   * 1. `[writable]` protocol: {@link GaslessProtocol} Protocol configuration
   * 2. `[writable]` service: {@link ServiceProvider} Service provider account
   * 3. `[writable]` fee_vault: {@link FeeVault} Fee vault for this service
   * 4. `[signer]` owner: {@link PublicKey} Service owner
   * 5. `[writable, signer]` usdc_vault: {@link PublicKey} USDC vault for fee payments
   * 6. `[]` usdc_mint: {@link Mint} USDC mint
   * 7. `[]` system_program: {@link PublicKey} Auto-generated, for account initialization
   * 8. `[writable, signer]` funding: {@link PublicKey} Funding account (must be a system account)
   * 9. `[writable]` assoc_token_account: {@link PublicKey} Associated token account address to be created
   * 10. `[]` wallet: {@link PublicKey} Wallet address for the new associated token account
   * 11. `[]` mint: {@link Mint} The token mint for the new associated token account
   * 12. `[]` token_program: {@link PublicKey} SPL Token program
   * 13. `[]` csl_spl_assoc_token_v0_0_0: {@link PublicKey} Auto-generated, CslSplAssocTokenProgram v0.0.0
   *
   * Data:
   * - fee_collector: {@link PublicKey} Fee collector account
   * - service_id: {@link string} Unique service identifier
   * - service_fee_bps: {@link number} Service fee in basis points
   * - max_transaction_amount: {@link BigInt} Maximum transaction amount
   * - allowed_programs: {@link PublicKey[]} Whitelisted programs
   *
   * @returns {@link TransactionInstruction}
   */
  const registerService = useCallback(programClient.registerService, [])

  /**
   * Register a new service to use gasless infrastructure
   *
   * Accounts:
   * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
   * 1. `[writable]` protocol: {@link GaslessProtocol} Protocol configuration
   * 2. `[writable]` service: {@link ServiceProvider} Service provider account
   * 3. `[writable]` fee_vault: {@link FeeVault} Fee vault for this service
   * 4. `[signer]` owner: {@link PublicKey} Service owner
   * 5. `[writable, signer]` usdc_vault: {@link PublicKey} USDC vault for fee payments
   * 6. `[]` usdc_mint: {@link Mint} USDC mint
   * 7. `[]` system_program: {@link PublicKey} Auto-generated, for account initialization
   * 8. `[writable, signer]` funding: {@link PublicKey} Funding account (must be a system account)
   * 9. `[writable]` assoc_token_account: {@link PublicKey} Associated token account address to be created
   * 10. `[]` wallet: {@link PublicKey} Wallet address for the new associated token account
   * 11. `[]` mint: {@link Mint} The token mint for the new associated token account
   * 12. `[]` token_program: {@link PublicKey} SPL Token program
   * 13. `[]` csl_spl_assoc_token_v0_0_0: {@link PublicKey} Auto-generated, CslSplAssocTokenProgram v0.0.0
   *
   * Data:
   * - fee_collector: {@link PublicKey} Fee collector account
   * - service_id: {@link string} Unique service identifier
   * - service_fee_bps: {@link number} Service fee in basis points
   * - max_transaction_amount: {@link BigInt} Maximum transaction amount
   * - allowed_programs: {@link PublicKey[]} Whitelisted programs
   *
   * @returns {@link SendAndConfirmTxResult}
   */
  const registerServiceSendAndConfirm = useCallback(async (
    args: Omit<programClient.RegisterServiceArgs, "feePayer" | "owner" | "usdcVault" | "funding"> & {
    signers: {
        feePayer: Keypair,
        owner: Keypair,
        usdcVault: Keypair,
        funding: Keypair,
    }}, 
    remainingAccounts: Array<AccountMeta> = []
  ): Promise<SendAndConfirmTxResult> => sendAndConfirmTx(() => programClient.registerServiceSendAndConfirm(args, remainingAccounts)), [])

  /**
   * Authorize a relayer to execute gasless transactions
   *
   * Accounts:
   * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
   * 1. `[]` protocol: {@link GaslessProtocol} Protocol configuration
   * 2. `[writable]` relayer_config: {@link RelayerConfig} Relayer configuration account
   * 3. `[signer]` admin: {@link PublicKey} Protocol admin
   * 4. `[]` system_program: {@link PublicKey} Auto-generated, for account initialization
   *
   * Data:
   * - relayer: {@link PublicKey} Relayer to authorize
   *
   * @returns {@link TransactionInstruction}
   */
  const authorizeRelayer = useCallback(programClient.authorizeRelayer, [])

  /**
   * Authorize a relayer to execute gasless transactions
   *
   * Accounts:
   * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
   * 1. `[]` protocol: {@link GaslessProtocol} Protocol configuration
   * 2. `[writable]` relayer_config: {@link RelayerConfig} Relayer configuration account
   * 3. `[signer]` admin: {@link PublicKey} Protocol admin
   * 4. `[]` system_program: {@link PublicKey} Auto-generated, for account initialization
   *
   * Data:
   * - relayer: {@link PublicKey} Relayer to authorize
   *
   * @returns {@link SendAndConfirmTxResult}
   */
  const authorizeRelayerSendAndConfirm = useCallback(async (
    args: Omit<programClient.AuthorizeRelayerArgs, "feePayer" | "admin"> & {
    signers: {
        feePayer: Keypair,
        admin: Keypair,
    }}, 
    remainingAccounts: Array<AccountMeta> = []
  ): Promise<SendAndConfirmTxResult> => sendAndConfirmTx(() => programClient.authorizeRelayerSendAndConfirm(args, remainingAccounts)), [])

  /**
   * Create a permit record for off-chain signed transaction
   *
   * Accounts:
   * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
   * 1. `[]` service: {@link ServiceProvider} Service provider
   * 2. `[writable]` user_permit: {@link UserPermit} User permit account
   * 3. `[]` system_program: {@link PublicKey} Auto-generated, for account initialization
   *
   * Data:
   * - user: {@link PublicKey} User who signed the permit
   * - service_id: {@link string} Service identifier
   * - nonce: {@link BigInt} Unique nonce
   * - instruction_data: {@link number[]} Instruction data to execute
   * - target_program: {@link PublicKey} Target program
   * - expiry: {@link BigInt} Permit expiry timestamp
   * - max_fee: {@link BigInt} Maximum fee
   * - signature: {@link number[]} User's signature
   *
   * @returns {@link TransactionInstruction}
   */
  const createUserPermit = useCallback(programClient.createUserPermit, [])

  /**
   * Create a permit record for off-chain signed transaction
   *
   * Accounts:
   * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
   * 1. `[]` service: {@link ServiceProvider} Service provider
   * 2. `[writable]` user_permit: {@link UserPermit} User permit account
   * 3. `[]` system_program: {@link PublicKey} Auto-generated, for account initialization
   *
   * Data:
   * - user: {@link PublicKey} User who signed the permit
   * - service_id: {@link string} Service identifier
   * - nonce: {@link BigInt} Unique nonce
   * - instruction_data: {@link number[]} Instruction data to execute
   * - target_program: {@link PublicKey} Target program
   * - expiry: {@link BigInt} Permit expiry timestamp
   * - max_fee: {@link BigInt} Maximum fee
   * - signature: {@link number[]} User's signature
   *
   * @returns {@link SendAndConfirmTxResult}
   */
  const createUserPermitSendAndConfirm = useCallback(async (
    args: Omit<programClient.CreateUserPermitArgs, "feePayer"> & {
    signers: {
        feePayer: Keypair,
    }}, 
    remainingAccounts: Array<AccountMeta> = []
  ): Promise<SendAndConfirmTxResult> => sendAndConfirmTx(() => programClient.createUserPermitSendAndConfirm(args, remainingAccounts)), [])

  /**
   * Relayer executes gasless transaction and gets reimbursed
   *
   * Accounts:
   * 0. `[writable, signer]` relayer: {@link PublicKey} 
   * 1. `[writable]` protocol: {@link GaslessProtocol} Protocol configuration
   * 2. `[writable]` service: {@link ServiceProvider} Service provider
   * 3. `[writable]` user_permit: {@link UserPermit} User permit to execute
   * 4. `[writable]` relayer_config: {@link RelayerConfig} Relayer configuration
   * 5. `[writable]` fee_vault: {@link FeeVault} Fee vault for reimbursement
   *
   * Data:
   * - user: {@link PublicKey} User who signed permit
   * - service_id: {@link string} Service identifier
   * - nonce: {@link BigInt} Permit nonce
   *
   * @returns {@link TransactionInstruction}
   */
  const executeGaslessTransaction = useCallback(programClient.executeGaslessTransaction, [])

  /**
   * Relayer executes gasless transaction and gets reimbursed
   *
   * Accounts:
   * 0. `[writable, signer]` relayer: {@link PublicKey} 
   * 1. `[writable]` protocol: {@link GaslessProtocol} Protocol configuration
   * 2. `[writable]` service: {@link ServiceProvider} Service provider
   * 3. `[writable]` user_permit: {@link UserPermit} User permit to execute
   * 4. `[writable]` relayer_config: {@link RelayerConfig} Relayer configuration
   * 5. `[writable]` fee_vault: {@link FeeVault} Fee vault for reimbursement
   *
   * Data:
   * - user: {@link PublicKey} User who signed permit
   * - service_id: {@link string} Service identifier
   * - nonce: {@link BigInt} Permit nonce
   *
   * @returns {@link SendAndConfirmTxResult}
   */
  const executeGaslessTransactionSendAndConfirm = useCallback(async (
    args: Omit<programClient.ExecuteGaslessTransactionArgs, "relayer"> & {
    signers: {
        relayer: Keypair,
    }}, 
    remainingAccounts: Array<AccountMeta> = []
  ): Promise<SendAndConfirmTxResult> => sendAndConfirmTx(() => programClient.executeGaslessTransactionSendAndConfirm(args, remainingAccounts)), [])

  /**
   * Mint NFT to user without them paying gas
   *
   * Accounts:
   * 0. `[writable, signer]` relayer: {@link PublicKey} 
   * 1. `[writable]` protocol: {@link GaslessProtocol} Protocol configuration
   * 2. `[writable]` service: {@link ServiceProvider} Service provider
   * 3. `[writable]` user_permit: {@link UserPermit} User permit for NFT mint
   * 4. `[writable]` fee_vault: {@link FeeVault} Fee vault for reimbursement
   * 5. `[writable, signer]` nft_mint: {@link Mint} NFT mint account
   * 6. `[writable, signer]` user_nft_account: {@link PublicKey} User's NFT token account
   * 7. `[]` system_program: {@link PublicKey} Auto-generated, for account initialization
   * 8. `[writable]` mint: {@link Mint} 
   * 9. `[writable, signer]` funding: {@link PublicKey} Funding account (must be a system account)
   * 10. `[writable]` assoc_token_account: {@link PublicKey} Associated token account address to be created
   * 11. `[]` wallet: {@link PublicKey} Wallet address for the new associated token account
   * 12. `[]` token_program: {@link PublicKey} SPL Token program
   * 13. `[signer]` owner: {@link PublicKey} The mint's minting authority.
   * 14. `[]` csl_spl_token_v0_0_0: {@link PublicKey} Auto-generated, CslSplTokenProgram v0.0.0
   * 15. `[]` csl_spl_assoc_token_v0_0_0: {@link PublicKey} Auto-generated, CslSplAssocTokenProgram v0.0.0
   *
   * Data:
   * - user: {@link PublicKey} NFT recipient
   * - service_id: {@link string} Service identifier
   * - nonce: {@link BigInt} Permit nonce
   *
   * @returns {@link TransactionInstruction}
   */
  const mintNftGasless = useCallback(programClient.mintNftGasless, [])

  /**
   * Mint NFT to user without them paying gas
   *
   * Accounts:
   * 0. `[writable, signer]` relayer: {@link PublicKey} 
   * 1. `[writable]` protocol: {@link GaslessProtocol} Protocol configuration
   * 2. `[writable]` service: {@link ServiceProvider} Service provider
   * 3. `[writable]` user_permit: {@link UserPermit} User permit for NFT mint
   * 4. `[writable]` fee_vault: {@link FeeVault} Fee vault for reimbursement
   * 5. `[writable, signer]` nft_mint: {@link Mint} NFT mint account
   * 6. `[writable, signer]` user_nft_account: {@link PublicKey} User's NFT token account
   * 7. `[]` system_program: {@link PublicKey} Auto-generated, for account initialization
   * 8. `[writable]` mint: {@link Mint} 
   * 9. `[writable, signer]` funding: {@link PublicKey} Funding account (must be a system account)
   * 10. `[writable]` assoc_token_account: {@link PublicKey} Associated token account address to be created
   * 11. `[]` wallet: {@link PublicKey} Wallet address for the new associated token account
   * 12. `[]` token_program: {@link PublicKey} SPL Token program
   * 13. `[signer]` owner: {@link PublicKey} The mint's minting authority.
   * 14. `[]` csl_spl_token_v0_0_0: {@link PublicKey} Auto-generated, CslSplTokenProgram v0.0.0
   * 15. `[]` csl_spl_assoc_token_v0_0_0: {@link PublicKey} Auto-generated, CslSplAssocTokenProgram v0.0.0
   *
   * Data:
   * - user: {@link PublicKey} NFT recipient
   * - service_id: {@link string} Service identifier
   * - nonce: {@link BigInt} Permit nonce
   *
   * @returns {@link SendAndConfirmTxResult}
   */
  const mintNftGaslessSendAndConfirm = useCallback(async (
    args: Omit<programClient.MintNftGaslessArgs, "relayer" | "nftMint" | "userNftAccount" | "funding" | "owner"> & {
    signers: {
        relayer: Keypair,
        nftMint: Keypair,
        userNftAccount: Keypair,
        funding: Keypair,
        owner: Keypair,
    }}, 
    remainingAccounts: Array<AccountMeta> = []
  ): Promise<SendAndConfirmTxResult> => sendAndConfirmTx(() => programClient.mintNftGaslessSendAndConfirm(args, remainingAccounts)), [])

  /**
   * Deposit funds to service treasury for gas coverage
   *
   * Accounts:
   * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
   * 1. `[]` service: {@link ServiceProvider} Service provider
   * 2. `[writable]` fee_vault: {@link FeeVault} Fee vault to deposit into
   * 3. `[writable, signer]` depositor: {@link PublicKey} Account depositing funds
   * 4. `[writable]` depositor_usdc_account: {@link PublicKey} Depositor's USDC account
   * 5. `[writable]` vault_usdc_account: {@link PublicKey} Vault's USDC account
   * 6. `[]` usdc_mint: {@link Mint} USDC mint
   * 7. `[writable]` source: {@link PublicKey} The source account.
   * 8. `[]` mint: {@link Mint} The token mint.
   * 9. `[writable]` destination: {@link PublicKey} The destination account.
   * 10. `[signer]` authority: {@link PublicKey} The source account's owner/delegate.
   * 11. `[]` csl_spl_token_v0_0_0: {@link PublicKey} Auto-generated, CslSplTokenProgram v0.0.0
   *
   * Data:
   * - service_id: {@link string} Service identifier
   * - amount: {@link BigInt} Amount to deposit
   *
   * @returns {@link TransactionInstruction}
   */
  const depositTreasury = useCallback(programClient.depositTreasury, [])

  /**
   * Deposit funds to service treasury for gas coverage
   *
   * Accounts:
   * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
   * 1. `[]` service: {@link ServiceProvider} Service provider
   * 2. `[writable]` fee_vault: {@link FeeVault} Fee vault to deposit into
   * 3. `[writable, signer]` depositor: {@link PublicKey} Account depositing funds
   * 4. `[writable]` depositor_usdc_account: {@link PublicKey} Depositor's USDC account
   * 5. `[writable]` vault_usdc_account: {@link PublicKey} Vault's USDC account
   * 6. `[]` usdc_mint: {@link Mint} USDC mint
   * 7. `[writable]` source: {@link PublicKey} The source account.
   * 8. `[]` mint: {@link Mint} The token mint.
   * 9. `[writable]` destination: {@link PublicKey} The destination account.
   * 10. `[signer]` authority: {@link PublicKey} The source account's owner/delegate.
   * 11. `[]` csl_spl_token_v0_0_0: {@link PublicKey} Auto-generated, CslSplTokenProgram v0.0.0
   *
   * Data:
   * - service_id: {@link string} Service identifier
   * - amount: {@link BigInt} Amount to deposit
   *
   * @returns {@link SendAndConfirmTxResult}
   */
  const depositTreasurySendAndConfirm = useCallback(async (
    args: Omit<programClient.DepositTreasuryArgs, "feePayer" | "depositor" | "authority"> & {
    signers: {
        feePayer: Keypair,
        depositor: Keypair,
        authority: Keypair,
    }}, 
    remainingAccounts: Array<AccountMeta> = []
  ): Promise<SendAndConfirmTxResult> => sendAndConfirmTx(() => programClient.depositTreasurySendAndConfirm(args, remainingAccounts)), [])

  /**
   * Withdraw accumulated fees from service vault
   *
   * Accounts:
   * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
   * 1. `[]` service: {@link ServiceProvider} Service provider
   * 2. `[writable]` fee_vault: {@link FeeVault} Fee vault to withdraw from
   * 3. `[signer]` owner: {@link PublicKey} Service owner
   * 4. `[writable]` fee_collector_usdc_account: {@link PublicKey} Fee collector's USDC account
   * 5. `[writable]` vault_usdc_account: {@link PublicKey} Vault's USDC account
   * 6. `[]` usdc_mint: {@link Mint} USDC mint
   * 7. `[writable]` source: {@link PublicKey} The source account.
   * 8. `[]` mint: {@link Mint} The token mint.
   * 9. `[writable]` destination: {@link PublicKey} The destination account.
   * 10. `[signer]` authority: {@link PublicKey} The source account's owner/delegate.
   * 11. `[]` csl_spl_token_v0_0_0: {@link PublicKey} Auto-generated, CslSplTokenProgram v0.0.0
   *
   * Data:
   * - service_id: {@link string} Service identifier
   * - amount: {@link BigInt} Amount to withdraw
   *
   * @returns {@link TransactionInstruction}
   */
  const withdrawFees = useCallback(programClient.withdrawFees, [])

  /**
   * Withdraw accumulated fees from service vault
   *
   * Accounts:
   * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
   * 1. `[]` service: {@link ServiceProvider} Service provider
   * 2. `[writable]` fee_vault: {@link FeeVault} Fee vault to withdraw from
   * 3. `[signer]` owner: {@link PublicKey} Service owner
   * 4. `[writable]` fee_collector_usdc_account: {@link PublicKey} Fee collector's USDC account
   * 5. `[writable]` vault_usdc_account: {@link PublicKey} Vault's USDC account
   * 6. `[]` usdc_mint: {@link Mint} USDC mint
   * 7. `[writable]` source: {@link PublicKey} The source account.
   * 8. `[]` mint: {@link Mint} The token mint.
   * 9. `[writable]` destination: {@link PublicKey} The destination account.
   * 10. `[signer]` authority: {@link PublicKey} The source account's owner/delegate.
   * 11. `[]` csl_spl_token_v0_0_0: {@link PublicKey} Auto-generated, CslSplTokenProgram v0.0.0
   *
   * Data:
   * - service_id: {@link string} Service identifier
   * - amount: {@link BigInt} Amount to withdraw
   *
   * @returns {@link SendAndConfirmTxResult}
   */
  const withdrawFeesSendAndConfirm = useCallback(async (
    args: Omit<programClient.WithdrawFeesArgs, "feePayer" | "owner" | "authority"> & {
    signers: {
        feePayer: Keypair,
        owner: Keypair,
        authority: Keypair,
    }}, 
    remainingAccounts: Array<AccountMeta> = []
  ): Promise<SendAndConfirmTxResult> => sendAndConfirmTx(() => programClient.withdrawFeesSendAndConfirm(args, remainingAccounts)), [])

  /**
   * Update service configuration parameters
   *
   * Accounts:
   * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
   * 1. `[writable]` service: {@link ServiceProvider} Service to update
   * 2. `[signer]` owner: {@link PublicKey} Service owner
   *
   * Data:
   * - service_id: {@link string} Service identifier
   * - new_fee_bps: {@link number | undefined} New service fee in basis points
   * - new_max_amount: {@link BigInt | undefined} New maximum transaction amount
   * - new_is_active: {@link boolean | undefined} New active status
   *
   * @returns {@link TransactionInstruction}
   */
  const updateServiceConfig = useCallback(programClient.updateServiceConfig, [])

  /**
   * Update service configuration parameters
   *
   * Accounts:
   * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
   * 1. `[writable]` service: {@link ServiceProvider} Service to update
   * 2. `[signer]` owner: {@link PublicKey} Service owner
   *
   * Data:
   * - service_id: {@link string} Service identifier
   * - new_fee_bps: {@link number | undefined} New service fee in basis points
   * - new_max_amount: {@link BigInt | undefined} New maximum transaction amount
   * - new_is_active: {@link boolean | undefined} New active status
   *
   * @returns {@link SendAndConfirmTxResult}
   */
  const updateServiceConfigSendAndConfirm = useCallback(async (
    args: Omit<programClient.UpdateServiceConfigArgs, "feePayer" | "owner"> & {
    signers: {
        feePayer: Keypair,
        owner: Keypair,
    }}, 
    remainingAccounts: Array<AccountMeta> = []
  ): Promise<SendAndConfirmTxResult> => sendAndConfirmTx(() => programClient.updateServiceConfigSendAndConfirm(args, remainingAccounts)), [])


  const getGaslessProtocol = useCallback(programClient.getGaslessProtocol, [])
  const getServiceProvider = useCallback(programClient.getServiceProvider, [])
  const getUserPermit = useCallback(programClient.getUserPermit, [])
  const getRelayerConfig = useCallback(programClient.getRelayerConfig, [])
  const getFeeVault = useCallback(programClient.getFeeVault, [])
  const getMintFromCslSplToken = useCallback(programClient.CslSplTokenGetters.getMint, [])
  const getAccountFromCslSplToken = useCallback(programClient.CslSplTokenGetters.getAccount, [])

  const deriveGaslessProtocol = useCallback(programClient.deriveGaslessProtocolPDA,[])
  const deriveServiceProvider = useCallback(programClient.deriveServiceProviderPDA,[])
  const deriveUserPermit = useCallback(programClient.deriveUserPermitPDA,[])
  const deriveRelayerConfig = useCallback(programClient.deriveRelayerConfigPDA,[])
  const deriveFeeVault = useCallback(programClient.deriveFeeVaultPDA,[])
  const deriveAccountFromCslSplToken = useCallback(programClient.CslSplTokenPDAs.deriveAccountPDA, [])

  return {
    initializeProtocol,
    initializeProtocolSendAndConfirm,
    registerService,
    registerServiceSendAndConfirm,
    authorizeRelayer,
    authorizeRelayerSendAndConfirm,
    createUserPermit,
    createUserPermitSendAndConfirm,
    executeGaslessTransaction,
    executeGaslessTransactionSendAndConfirm,
    mintNftGasless,
    mintNftGaslessSendAndConfirm,
    depositTreasury,
    depositTreasurySendAndConfirm,
    withdrawFees,
    withdrawFeesSendAndConfirm,
    updateServiceConfig,
    updateServiceConfigSendAndConfirm,
    getGaslessProtocol,
    getServiceProvider,
    getUserPermit,
    getRelayerConfig,
    getFeeVault,
    getMintFromCslSplToken,
    getAccountFromCslSplToken,
    deriveGaslessProtocol,
    deriveServiceProvider,
    deriveUserPermit,
    deriveRelayerConfig,
    deriveFeeVault,
    deriveAccountFromCslSplToken,
  };
};

export { useProgram };