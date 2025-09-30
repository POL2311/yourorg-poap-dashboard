import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import type { WalletAdapter } from '@solana/wallet-adapter-base';
import axios, { AxiosInstance } from 'axios';
import bs58 from 'bs58';

// -------- Helpers / Types --------
type SignMessageCapable = WalletAdapter & {
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
};
function canSignMessage(wallet: WalletAdapter): wallet is SignMessageCapable {
  return typeof (wallet as any)?.signMessage === 'function';
}
function requireString(name: string, v: unknown): string {
  if (typeof v !== 'string' || v.length === 0) {
    throw new Error(`Campo requerido "${name}" ausente o vacío`);
  }
  return v;
}
function requireNumber(name: string, v: unknown): number {
  if (typeof v !== 'number' || Number.isNaN(v)) {
    throw new Error(`Campo requerido "${name}" no es número`);
  }
  return v;
}
function toBytesStr(name: string, v: unknown) {
  return Buffer.from(requireString(name, v));
}
function toBytesBase64(name: string, v: unknown) {
  return Buffer.from(requireString(name, v), 'base64');
}

// -------- SDK API --------
export interface GaslessConfig {
  apiUrl: string;
  serviceId: string;
  apiKey?: string;
}

export interface PermitData {
  userPublicKey: string;
  serviceId: string;
  instructionData: string; // base64
  targetProgram: string;
  expiry: number;
  maxFee: number;
}

export interface PermitResponse {
  permitId: string;
  nonce: number;
  transactionSignature: string;
  status: 'pending' | 'executed' | 'expired';
}

export interface PermitStatus {
  permitId: string;
  status: 'pending' | 'executed' | 'expired';
  userPublicKey: string;
  serviceId: string;
  nonce: number;
  expiry: number;
  maxFee: number;
  transactionSignature?: string;
  executedAt?: string;
  createdAt: string;
}

export class GaslessSDK {
  private api: AxiosInstance;
  private config: GaslessConfig;

  constructor(config: GaslessConfig) {
    if (!config || !config.apiUrl) throw new Error('GaslessSDK: apiUrl requerido');
    if (!config.serviceId) throw new Error('GaslessSDK: serviceId requerido');

    this.config = config;
    this.api = axios.create({
      baseURL: config.apiUrl,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { Authorization: `Bearer ${config.apiKey}` }),
      },
    });
  }

  /** Create and submit a gasless permit for execution */
  async createPermit(
    wallet: WalletAdapter,
    instruction: TransactionInstruction,
    options: { expiry?: number; maxFee?: number } = {},
  ): Promise<PermitResponse> {
    if (!wallet.publicKey) throw new Error('Wallet not connected');

    const expiry = options.expiry ?? Math.floor(Date.now() / 1000) + 3600; // 1h
    const maxFee = options.maxFee ?? 10_000_000; // 0.01 SOL

    // Serializa data de la instrucción (si no trae data, usa buffer vacío)
    const instructionData = this.serializeInstruction(instruction);

    const permitData: PermitData = {
      userPublicKey: wallet.publicKey.toString(),
      serviceId: this.config.serviceId,
      instructionData: Buffer.from(instructionData).toString('base64'),
      targetProgram: instruction.programId.toString(),
      expiry,
      maxFee,
    };

    // Firma
    const signature = await this.signPermit(wallet, permitData);

    // Envía al backend
    const response = await this.api.post('/api/permits/create', {
      ...permitData,
      signature: bs58.encode(signature),
    });

    if (!response.data?.success) {
      throw new Error(response.data?.error || 'Failed to create permit');
    }
    return response.data.data;
  }

  /** Get permit status */
  async getPermitStatus(permitId: string): Promise<PermitStatus> {
    const response = await this.api.get(`/api/permits/${permitId}/status`);
    if (!response.data?.success) {
      throw new Error(response.data?.error || 'Failed to get permit status');
    }
    return response.data.data;
  }

  /** Get user permits */
  async getUserPermits(
    userPublicKey: string,
    options: { status?: 'pending' | 'executed' | 'expired'; page?: number; limit?: number } = {},
  ): Promise<PermitStatus[]> {
    const params = new URLSearchParams();
    if (options.status) params.append('status', options.status);
    if (options.page) params.append('page', String(options.page));
    if (options.limit) params.append('limit', String(options.limit));

    const response = await this.api.get(`/api/permits/user/${userPublicKey}?${params.toString()}`);
    if (!response.data?.success) {
      throw new Error(response.data?.error || 'Failed to get user permits');
    }
    return response.data.data;
  }

  /** Wait for permit execution with polling */
  async waitForExecution(
    permitId: string,
    options: { timeout?: number; pollInterval?: number } = {},
  ): Promise<PermitStatus> {
    const timeout = options.timeout ?? 30_000;
    const pollInterval = options.pollInterval ?? 2_000;
    const start = Date.now();

    while (Date.now() - start < timeout) {
      const status = await this.getPermitStatus(permitId);
      if (status.status === 'executed') return status;
      if (status.status === 'expired') throw new Error('Permit expired before execution');
      await new Promise((r) => setTimeout(r, pollInterval));
    }
    throw new Error('Timeout waiting for permit execution');
  }

  /** (stub) Mint NFT gaslessly */
  async mintNFTGasless(): Promise<never> {
    throw new Error('NFT minting not implemented yet');
  }

  /** Execute array of instructions gaslessly */
  async executeGasless(
    wallet: WalletAdapter,
    instructions: TransactionInstruction[],
    options: { expiry?: number; maxFee?: number } = {},
  ): Promise<PermitResponse[]> {
    const out: PermitResponse[] = [];
    for (const ix of instructions) {
      out.push(await this.createPermit(wallet, ix, options));
    }
    return out;
  }

  /** Validate permit signature off-chain */
  async validateSignature(permitData: PermitData & { signature: string }): Promise<boolean> {
    const response = await this.api.post('/api/permits/validate-signature', permitData);
    if (!response.data?.success) {
      throw new Error(response.data?.error || 'Failed to validate signature');
    }
    return Boolean(response.data.data?.isValid);
  }

  // -------- internals --------
private async signPermit(wallet: WalletAdapter, permitData: PermitData): Promise<Uint8Array> {
  if (!canSignMessage(wallet)) {
    throw new Error('Wallet does not support message signing');
  }
  const message = this.createPermitMessage(permitData); // Uint8Array de TEXTO
  // Copia defensiva para asegurar que es un Uint8Array simple
  const bytes = message instanceof Uint8Array ? message : new Uint8Array(message as any);
  const signature = await wallet.signMessage(bytes);
  return signature;
}

/** Mensaje canónico en TEXTO para signMessage */
private createPermitMessage(permitData: PermitData): Uint8Array {
  const payload = {
    domain: 'gasless-infra',
    type: 'permit',
    version: 1,
    user: permitData.userPublicKey,
    serviceId: permitData.serviceId,
    targetProgram: permitData.targetProgram,
    expiry: permitData.expiry,
    maxFee: permitData.maxFee,
    instructionDataBase64: permitData.instructionData,
    nonce: 0
  };

  const humanReadable =
    'Gasless Permit\n' +
    '--------------------------------\n' +
    JSON.stringify(payload);

  return new TextEncoder().encode(humanReadable); // <- TEXTO UTF-8
}


  private serializeInstruction(instruction: TransactionInstruction): Uint8Array {
    if (!instruction) throw new Error('Instruction inválida');
    // si no trae data, devolvemos buffer vacío (correcto para placeholders)
    return instruction.data ?? new Uint8Array();
  }
}

// Export types (ESM necesita extensión .js tras build)
export * from './types.js';
export default GaslessSDK;
