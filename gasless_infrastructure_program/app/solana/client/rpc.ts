import BN from "bn.js";
import {
  AnchorProvider,
  IdlAccounts,
  Program,
  web3,
} from "@coral-xyz/anchor";
import { MethodsBuilder } from "@coral-xyz/anchor/dist/cjs/program/namespace/methods";
import { GaslessInfrastructure } from "../../../target/types/gasless_infrastructure";
import idl from "../../../target/idl/gasless_infrastructure.json";
import * as pda from "./pda";

import { CslSplToken } from "../../target/types/csl_spl_token";
import idlCslSplToken from "../../target/idl/csl_spl_token.json";

import { CslSplAssocToken } from "../../target/types/csl_spl_assoc_token";
import idlCslSplAssocToken from "../../target/idl/csl_spl_assoc_token.json";



let _program: Program<GaslessInfrastructure>;
let _programCslSplToken: Program<CslSplToken>;
let _programCslSplAssocToken: Program<CslSplAssocToken>;


export const initializeClient = (
    programId: web3.PublicKey,
    anchorProvider = AnchorProvider.env(),
) => {
    _program = new Program<GaslessInfrastructure>(
        idl as GaslessInfrastructure,
        anchorProvider,
    );

    _programCslSplToken = new Program<CslSplToken>(
        idlCslSplToken as never,
        new web3.PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
        anchorProvider,
    );
    _programCslSplAssocToken = new Program<CslSplAssocToken>(
        idlCslSplAssocToken as never,
        new web3.PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"),
        anchorProvider,
    );

};

export type InitializeProtocolArgs = {
  feePayer: web3.PublicKey;
  admin: web3.PublicKey;
  masterTreasury: web3.PublicKey;
  protocolFeeBps: number;
};

/**
 * ### Returns a {@link MethodsBuilder}
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
 */
export const initializeProtocolBuilder = (
	args: InitializeProtocolArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): MethodsBuilder<GaslessInfrastructure, never> => {
  const [protocolPubkey] = pda.deriveGaslessProtocolPDA(_program.programId);

  return _program
    .methods
    .initializeProtocol(
      args.masterTreasury,
      args.protocolFeeBps,
    )
    .accountsStrict({
      feePayer: args.feePayer,
      protocol: protocolPubkey,
      admin: args.admin,
      systemProgram: new web3.PublicKey("11111111111111111111111111111111"),
    })
    .remainingAccounts(remainingAccounts);
};

/**
 * ### Returns a {@link web3.TransactionInstruction}
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
 */
export const initializeProtocol = (
	args: InitializeProtocolArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionInstruction> =>
    initializeProtocolBuilder(args, remainingAccounts).instruction();

/**
 * ### Returns a {@link web3.TransactionSignature}
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
 */
export const initializeProtocolSendAndConfirm = async (
  args: Omit<InitializeProtocolArgs, "feePayer" | "admin"> & {
    signers: {
      feePayer: web3.Signer,
      admin: web3.Signer,
    },
  },
  remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionSignature> => {
  const preInstructions: Array<web3.TransactionInstruction> = [];


  return initializeProtocolBuilder({
      ...args,
      feePayer: args.signers.feePayer.publicKey,
      admin: args.signers.admin.publicKey,
    }, remainingAccounts)
    .preInstructions(preInstructions)
    .signers([args.signers.feePayer, args.signers.admin])
    .rpc();
}

export type RegisterServiceArgs = {
  feePayer: web3.PublicKey;
  owner: web3.PublicKey;
  usdcVault: web3.PublicKey;
  usdcMint: web3.PublicKey;
  funding: web3.PublicKey;
  wallet: web3.PublicKey;
  mint: web3.PublicKey;
  feeCollector: web3.PublicKey;
  serviceId: string;
  serviceFeeBps: number;
  maxTransactionAmount: bigint;
  allowedPrograms: web3.PublicKey[];
};

/**
 * ### Returns a {@link MethodsBuilder}
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
 */
export const registerServiceBuilder = (
	args: RegisterServiceArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): MethodsBuilder<GaslessInfrastructure, never> => {
  const [protocolPubkey] = pda.deriveGaslessProtocolPDA(_program.programId);
    const [servicePubkey] = pda.deriveServiceProviderPDA({
        serviceId: args.serviceId,
    }, _program.programId);
    const [feeVaultPubkey] = pda.deriveFeeVaultPDA({
        service: args.service,
    }, _program.programId);
    const [assocTokenAccountPubkey] = pda.CslSplTokenPDAs.deriveAccountPDA({
        wallet: args.wallet,
        tokenProgram: new web3.PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
        mint: args.mint,
    }, new web3.PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"));

  return _program
    .methods
    .registerService(
      args.feeCollector,
      args.serviceId,
      args.serviceFeeBps,
      new BN(args.maxTransactionAmount.toString()),
      args.allowedPrograms,
    )
    .accountsStrict({
      feePayer: args.feePayer,
      protocol: protocolPubkey,
      service: servicePubkey,
      feeVault: feeVaultPubkey,
      owner: args.owner,
      usdcVault: args.usdcVault,
      usdcMint: args.usdcMint,
      systemProgram: new web3.PublicKey("11111111111111111111111111111111"),
      funding: args.funding,
      assocTokenAccount: assocTokenAccountPubkey,
      wallet: args.wallet,
      mint: args.mint,
      tokenProgram: new web3.PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
      cslSplAssocTokenV000: new web3.PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"),
    })
    .remainingAccounts(remainingAccounts);
};

/**
 * ### Returns a {@link web3.TransactionInstruction}
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
 */
export const registerService = (
	args: RegisterServiceArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionInstruction> =>
    registerServiceBuilder(args, remainingAccounts).instruction();

/**
 * ### Returns a {@link web3.TransactionSignature}
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
 */
export const registerServiceSendAndConfirm = async (
  args: Omit<RegisterServiceArgs, "feePayer" | "owner" | "usdcVault" | "funding"> & {
    signers: {
      feePayer: web3.Signer,
      owner: web3.Signer,
      usdcVault: web3.Signer,
      funding: web3.Signer,
    },
  },
  remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionSignature> => {
  const preInstructions: Array<web3.TransactionInstruction> = [];


  return registerServiceBuilder({
      ...args,
      feePayer: args.signers.feePayer.publicKey,
      owner: args.signers.owner.publicKey,
      usdcVault: args.signers.usdcVault.publicKey,
      funding: args.signers.funding.publicKey,
    }, remainingAccounts)
    .preInstructions(preInstructions)
    .signers([args.signers.feePayer, args.signers.owner, args.signers.usdcVault, args.signers.funding])
    .rpc();
}

export type AuthorizeRelayerArgs = {
  feePayer: web3.PublicKey;
  admin: web3.PublicKey;
  relayer: web3.PublicKey;
};

/**
 * ### Returns a {@link MethodsBuilder}
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
 */
export const authorizeRelayerBuilder = (
	args: AuthorizeRelayerArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): MethodsBuilder<GaslessInfrastructure, never> => {
  const [protocolPubkey] = pda.deriveGaslessProtocolPDA(_program.programId);
    const [relayerConfigPubkey] = pda.deriveRelayerConfigPDA({
        relayer: args.relayer,
    }, _program.programId);

  return _program
    .methods
    .authorizeRelayer(
      args.relayer,
    )
    .accountsStrict({
      feePayer: args.feePayer,
      protocol: protocolPubkey,
      relayerConfig: relayerConfigPubkey,
      admin: args.admin,
      systemProgram: new web3.PublicKey("11111111111111111111111111111111"),
    })
    .remainingAccounts(remainingAccounts);
};

/**
 * ### Returns a {@link web3.TransactionInstruction}
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
 */
export const authorizeRelayer = (
	args: AuthorizeRelayerArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionInstruction> =>
    authorizeRelayerBuilder(args, remainingAccounts).instruction();

/**
 * ### Returns a {@link web3.TransactionSignature}
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
 */
export const authorizeRelayerSendAndConfirm = async (
  args: Omit<AuthorizeRelayerArgs, "feePayer" | "admin"> & {
    signers: {
      feePayer: web3.Signer,
      admin: web3.Signer,
    },
  },
  remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionSignature> => {
  const preInstructions: Array<web3.TransactionInstruction> = [];


  return authorizeRelayerBuilder({
      ...args,
      feePayer: args.signers.feePayer.publicKey,
      admin: args.signers.admin.publicKey,
    }, remainingAccounts)
    .preInstructions(preInstructions)
    .signers([args.signers.feePayer, args.signers.admin])
    .rpc();
}

export type CreateUserPermitArgs = {
  feePayer: web3.PublicKey;
  user: web3.PublicKey;
  serviceId: string;
  nonce: bigint;
  instructionData: number[];
  targetProgram: web3.PublicKey;
  expiry: bigint;
  maxFee: bigint;
  signature: number[];
};

/**
 * ### Returns a {@link MethodsBuilder}
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
 */
export const createUserPermitBuilder = (
	args: CreateUserPermitArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): MethodsBuilder<GaslessInfrastructure, never> => {
    const [servicePubkey] = pda.deriveServiceProviderPDA({
        serviceId: args.serviceId,
    }, _program.programId);
    const [userPermitPubkey] = pda.deriveUserPermitPDA({
        user: args.user,
        service: args.service,
        nonce: args.nonce,
    }, _program.programId);

  return _program
    .methods
    .createUserPermit(
      args.user,
      args.serviceId,
      new BN(args.nonce.toString()),
      Buffer.from(args.instructionData),
      args.targetProgram,
      new BN(args.expiry.toString()),
      new BN(args.maxFee.toString()),
      Buffer.from(args.signature),
    )
    .accountsStrict({
      feePayer: args.feePayer,
      service: servicePubkey,
      userPermit: userPermitPubkey,
      systemProgram: new web3.PublicKey("11111111111111111111111111111111"),
    })
    .remainingAccounts(remainingAccounts);
};

/**
 * ### Returns a {@link web3.TransactionInstruction}
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
 */
export const createUserPermit = (
	args: CreateUserPermitArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionInstruction> =>
    createUserPermitBuilder(args, remainingAccounts).instruction();

/**
 * ### Returns a {@link web3.TransactionSignature}
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
 */
export const createUserPermitSendAndConfirm = async (
  args: Omit<CreateUserPermitArgs, "feePayer"> & {
    signers: {
      feePayer: web3.Signer,
    },
  },
  remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionSignature> => {
  const preInstructions: Array<web3.TransactionInstruction> = [];


  return createUserPermitBuilder({
      ...args,
      feePayer: args.signers.feePayer.publicKey,
    }, remainingAccounts)
    .preInstructions(preInstructions)
    .signers([args.signers.feePayer])
    .rpc();
}

export type ExecuteGaslessTransactionArgs = {
  relayer: web3.PublicKey;
  user: web3.PublicKey;
  serviceId: string;
  nonce: bigint;
};

/**
 * ### Returns a {@link MethodsBuilder}
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
 */
export const executeGaslessTransactionBuilder = (
	args: ExecuteGaslessTransactionArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): MethodsBuilder<GaslessInfrastructure, never> => {
  const [protocolPubkey] = pda.deriveGaslessProtocolPDA(_program.programId);
    const [servicePubkey] = pda.deriveServiceProviderPDA({
        serviceId: args.serviceId,
    }, _program.programId);
    const [userPermitPubkey] = pda.deriveUserPermitPDA({
        user: args.user,
        service: args.service,
        nonce: args.nonce,
    }, _program.programId);
    const [relayerConfigPubkey] = pda.deriveRelayerConfigPDA({
        relayer: args.relayer,
    }, _program.programId);
    const [feeVaultPubkey] = pda.deriveFeeVaultPDA({
        service: args.service,
    }, _program.programId);

  return _program
    .methods
    .executeGaslessTransaction(
      args.user,
      args.serviceId,
      new BN(args.nonce.toString()),
    )
    .accountsStrict({
      relayer: args.relayer,
      protocol: protocolPubkey,
      service: servicePubkey,
      userPermit: userPermitPubkey,
      relayerConfig: relayerConfigPubkey,
      feeVault: feeVaultPubkey,
    })
    .remainingAccounts(remainingAccounts);
};

/**
 * ### Returns a {@link web3.TransactionInstruction}
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
 */
export const executeGaslessTransaction = (
	args: ExecuteGaslessTransactionArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionInstruction> =>
    executeGaslessTransactionBuilder(args, remainingAccounts).instruction();

/**
 * ### Returns a {@link web3.TransactionSignature}
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
 */
export const executeGaslessTransactionSendAndConfirm = async (
  args: Omit<ExecuteGaslessTransactionArgs, "relayer"> & {
    signers: {
      relayer: web3.Signer,
    },
  },
  remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionSignature> => {
  const preInstructions: Array<web3.TransactionInstruction> = [];


  return executeGaslessTransactionBuilder({
      ...args,
      relayer: args.signers.relayer.publicKey,
    }, remainingAccounts)
    .preInstructions(preInstructions)
    .signers([args.signers.relayer])
    .rpc();
}

export type MintNftGaslessArgs = {
  relayer: web3.PublicKey;
  nftMint: web3.PublicKey;
  userNftAccount: web3.PublicKey;
  mint: web3.PublicKey;
  funding: web3.PublicKey;
  wallet: web3.PublicKey;
  owner: web3.PublicKey;
  user: web3.PublicKey;
  serviceId: string;
  nonce: bigint;
};

/**
 * ### Returns a {@link MethodsBuilder}
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
 */
export const mintNftGaslessBuilder = (
	args: MintNftGaslessArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): MethodsBuilder<GaslessInfrastructure, never> => {
  const [protocolPubkey] = pda.deriveGaslessProtocolPDA(_program.programId);
    const [servicePubkey] = pda.deriveServiceProviderPDA({
        serviceId: args.serviceId,
    }, _program.programId);
    const [userPermitPubkey] = pda.deriveUserPermitPDA({
        user: args.user,
        service: args.service,
        nonce: args.nonce,
    }, _program.programId);
    const [feeVaultPubkey] = pda.deriveFeeVaultPDA({
        service: args.service,
    }, _program.programId);
    const [assocTokenAccountPubkey] = pda.CslSplTokenPDAs.deriveAccountPDA({
        wallet: args.wallet,
        tokenProgram: new web3.PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
        mint: args.mint,
    }, new web3.PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"));

  return _program
    .methods
    .mintNftGasless(
      args.user,
      args.serviceId,
      new BN(args.nonce.toString()),
    )
    .accountsStrict({
      relayer: args.relayer,
      protocol: protocolPubkey,
      service: servicePubkey,
      userPermit: userPermitPubkey,
      feeVault: feeVaultPubkey,
      nftMint: args.nftMint,
      userNftAccount: args.userNftAccount,
      systemProgram: new web3.PublicKey("11111111111111111111111111111111"),
      mint: args.mint,
      funding: args.funding,
      assocTokenAccount: assocTokenAccountPubkey,
      wallet: args.wallet,
      tokenProgram: new web3.PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
      owner: args.owner,
      cslSplTokenV000: new web3.PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
      cslSplAssocTokenV000: new web3.PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"),
    })
    .remainingAccounts(remainingAccounts);
};

/**
 * ### Returns a {@link web3.TransactionInstruction}
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
 */
export const mintNftGasless = (
	args: MintNftGaslessArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionInstruction> =>
    mintNftGaslessBuilder(args, remainingAccounts).instruction();

/**
 * ### Returns a {@link web3.TransactionSignature}
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
 */
export const mintNftGaslessSendAndConfirm = async (
  args: Omit<MintNftGaslessArgs, "relayer" | "nftMint" | "userNftAccount" | "funding" | "owner"> & {
    signers: {
      relayer: web3.Signer,
      nftMint: web3.Signer,
      userNftAccount: web3.Signer,
      funding: web3.Signer,
      owner: web3.Signer,
    },
  },
  remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionSignature> => {
  const preInstructions: Array<web3.TransactionInstruction> = [];


  return mintNftGaslessBuilder({
      ...args,
      relayer: args.signers.relayer.publicKey,
      nftMint: args.signers.nftMint.publicKey,
      userNftAccount: args.signers.userNftAccount.publicKey,
      funding: args.signers.funding.publicKey,
      owner: args.signers.owner.publicKey,
    }, remainingAccounts)
    .preInstructions(preInstructions)
    .signers([args.signers.relayer, args.signers.nftMint, args.signers.userNftAccount, args.signers.funding, args.signers.owner])
    .rpc();
}

export type DepositTreasuryArgs = {
  feePayer: web3.PublicKey;
  depositor: web3.PublicKey;
  depositorUsdcAccount: web3.PublicKey;
  vaultUsdcAccount: web3.PublicKey;
  usdcMint: web3.PublicKey;
  source: web3.PublicKey;
  mint: web3.PublicKey;
  destination: web3.PublicKey;
  authority: web3.PublicKey;
  serviceId: string;
  amount: bigint;
};

/**
 * ### Returns a {@link MethodsBuilder}
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
 */
export const depositTreasuryBuilder = (
	args: DepositTreasuryArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): MethodsBuilder<GaslessInfrastructure, never> => {
    const [servicePubkey] = pda.deriveServiceProviderPDA({
        serviceId: args.serviceId,
    }, _program.programId);
    const [feeVaultPubkey] = pda.deriveFeeVaultPDA({
        service: args.service,
    }, _program.programId);

  return _program
    .methods
    .depositTreasury(
      args.serviceId,
      new BN(args.amount.toString()),
    )
    .accountsStrict({
      feePayer: args.feePayer,
      service: servicePubkey,
      feeVault: feeVaultPubkey,
      depositor: args.depositor,
      depositorUsdcAccount: args.depositorUsdcAccount,
      vaultUsdcAccount: args.vaultUsdcAccount,
      usdcMint: args.usdcMint,
      source: args.source,
      mint: args.mint,
      destination: args.destination,
      authority: args.authority,
      cslSplTokenV000: new web3.PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
    })
    .remainingAccounts(remainingAccounts);
};

/**
 * ### Returns a {@link web3.TransactionInstruction}
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
 */
export const depositTreasury = (
	args: DepositTreasuryArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionInstruction> =>
    depositTreasuryBuilder(args, remainingAccounts).instruction();

/**
 * ### Returns a {@link web3.TransactionSignature}
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
 */
export const depositTreasurySendAndConfirm = async (
  args: Omit<DepositTreasuryArgs, "feePayer" | "depositor" | "authority"> & {
    signers: {
      feePayer: web3.Signer,
      depositor: web3.Signer,
      authority: web3.Signer,
    },
  },
  remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionSignature> => {
  const preInstructions: Array<web3.TransactionInstruction> = [];


  return depositTreasuryBuilder({
      ...args,
      feePayer: args.signers.feePayer.publicKey,
      depositor: args.signers.depositor.publicKey,
      authority: args.signers.authority.publicKey,
    }, remainingAccounts)
    .preInstructions(preInstructions)
    .signers([args.signers.feePayer, args.signers.depositor, args.signers.authority])
    .rpc();
}

export type WithdrawFeesArgs = {
  feePayer: web3.PublicKey;
  owner: web3.PublicKey;
  feeCollectorUsdcAccount: web3.PublicKey;
  vaultUsdcAccount: web3.PublicKey;
  usdcMint: web3.PublicKey;
  source: web3.PublicKey;
  mint: web3.PublicKey;
  destination: web3.PublicKey;
  authority: web3.PublicKey;
  serviceId: string;
  amount: bigint;
};

/**
 * ### Returns a {@link MethodsBuilder}
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
 */
export const withdrawFeesBuilder = (
	args: WithdrawFeesArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): MethodsBuilder<GaslessInfrastructure, never> => {
    const [servicePubkey] = pda.deriveServiceProviderPDA({
        serviceId: args.serviceId,
    }, _program.programId);
    const [feeVaultPubkey] = pda.deriveFeeVaultPDA({
        service: args.service,
    }, _program.programId);

  return _program
    .methods
    .withdrawFees(
      args.serviceId,
      new BN(args.amount.toString()),
    )
    .accountsStrict({
      feePayer: args.feePayer,
      service: servicePubkey,
      feeVault: feeVaultPubkey,
      owner: args.owner,
      feeCollectorUsdcAccount: args.feeCollectorUsdcAccount,
      vaultUsdcAccount: args.vaultUsdcAccount,
      usdcMint: args.usdcMint,
      source: args.source,
      mint: args.mint,
      destination: args.destination,
      authority: args.authority,
      cslSplTokenV000: new web3.PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
    })
    .remainingAccounts(remainingAccounts);
};

/**
 * ### Returns a {@link web3.TransactionInstruction}
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
 */
export const withdrawFees = (
	args: WithdrawFeesArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionInstruction> =>
    withdrawFeesBuilder(args, remainingAccounts).instruction();

/**
 * ### Returns a {@link web3.TransactionSignature}
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
 */
export const withdrawFeesSendAndConfirm = async (
  args: Omit<WithdrawFeesArgs, "feePayer" | "owner" | "authority"> & {
    signers: {
      feePayer: web3.Signer,
      owner: web3.Signer,
      authority: web3.Signer,
    },
  },
  remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionSignature> => {
  const preInstructions: Array<web3.TransactionInstruction> = [];


  return withdrawFeesBuilder({
      ...args,
      feePayer: args.signers.feePayer.publicKey,
      owner: args.signers.owner.publicKey,
      authority: args.signers.authority.publicKey,
    }, remainingAccounts)
    .preInstructions(preInstructions)
    .signers([args.signers.feePayer, args.signers.owner, args.signers.authority])
    .rpc();
}

export type UpdateServiceConfigArgs = {
  feePayer: web3.PublicKey;
  owner: web3.PublicKey;
  serviceId: string;
  newFeeBps: number | undefined;
  newMaxAmount: bigint | undefined;
  newIsActive: boolean | undefined;
};

/**
 * ### Returns a {@link MethodsBuilder}
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
 */
export const updateServiceConfigBuilder = (
	args: UpdateServiceConfigArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): MethodsBuilder<GaslessInfrastructure, never> => {
    const [servicePubkey] = pda.deriveServiceProviderPDA({
        serviceId: args.serviceId,
    }, _program.programId);

  return _program
    .methods
    .updateServiceConfig(
      args.serviceId,
      args.newFeeBps,
      args.newMaxAmount ? new BN(args.newMaxAmount.toString()) : undefined,
      args.newIsActive,
    )
    .accountsStrict({
      feePayer: args.feePayer,
      service: servicePubkey,
      owner: args.owner,
    })
    .remainingAccounts(remainingAccounts);
};

/**
 * ### Returns a {@link web3.TransactionInstruction}
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
 */
export const updateServiceConfig = (
	args: UpdateServiceConfigArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionInstruction> =>
    updateServiceConfigBuilder(args, remainingAccounts).instruction();

/**
 * ### Returns a {@link web3.TransactionSignature}
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
 */
export const updateServiceConfigSendAndConfirm = async (
  args: Omit<UpdateServiceConfigArgs, "feePayer" | "owner"> & {
    signers: {
      feePayer: web3.Signer,
      owner: web3.Signer,
    },
  },
  remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionSignature> => {
  const preInstructions: Array<web3.TransactionInstruction> = [];


  return updateServiceConfigBuilder({
      ...args,
      feePayer: args.signers.feePayer.publicKey,
      owner: args.signers.owner.publicKey,
    }, remainingAccounts)
    .preInstructions(preInstructions)
    .signers([args.signers.feePayer, args.signers.owner])
    .rpc();
}

// Getters

export const getGaslessProtocol = (
    publicKey: web3.PublicKey,
    commitment?: web3.Commitment
): Promise<IdlAccounts<GaslessInfrastructure>["gaslessProtocol"]> => _program.account.gaslessProtocol.fetch(publicKey, commitment);

export const getServiceProvider = (
    publicKey: web3.PublicKey,
    commitment?: web3.Commitment
): Promise<IdlAccounts<GaslessInfrastructure>["serviceProvider"]> => _program.account.serviceProvider.fetch(publicKey, commitment);

export const getUserPermit = (
    publicKey: web3.PublicKey,
    commitment?: web3.Commitment
): Promise<IdlAccounts<GaslessInfrastructure>["userPermit"]> => _program.account.userPermit.fetch(publicKey, commitment);

export const getRelayerConfig = (
    publicKey: web3.PublicKey,
    commitment?: web3.Commitment
): Promise<IdlAccounts<GaslessInfrastructure>["relayerConfig"]> => _program.account.relayerConfig.fetch(publicKey, commitment);

export const getFeeVault = (
    publicKey: web3.PublicKey,
    commitment?: web3.Commitment
): Promise<IdlAccounts<GaslessInfrastructure>["feeVault"]> => _program.account.feeVault.fetch(publicKey, commitment);
export module CslSplTokenGetters {
    export const getMint = (
        publicKey: web3.PublicKey,
        commitment?: web3.Commitment
    ): Promise<IdlAccounts<CslSplToken>["mint"]> => _programCslSplToken.account.mint.fetch(publicKey, commitment);
    
    export const getAccount = (
        publicKey: web3.PublicKey,
        commitment?: web3.Commitment
    ): Promise<IdlAccounts<CslSplToken>["account"]> => _programCslSplToken.account.account.fetch(publicKey, commitment);
}

