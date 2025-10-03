// sdk/src/index.ts - SDK MEJORADO CON SMART CONTRACT INTEGRATION
import { PublicKey, TransactionInstruction, Connection, Keypair } from '@solana/web3.js';
import type { WalletAdapter } from '@solana/wallet-adapter-base';
import axios, { AxiosInstance } from 'axios';
import bs58 from 'bs58';
import * as anchor from '@coral-xyz/anchor';

// -------- Helpers / Types --------
type SignMessageCapable = WalletAdapter & {
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
};

function canSignMessage(wallet: WalletAdapter): wallet is SignMessageCapable {
  return typeof (wallet as any)?.signMessage === 'function';
}

// -------- SDK API --------
export interface GaslessConfig {
  apiUrl: string;
  serviceId: string;
  apiKey?: string;
  programId?: string; // Program ID del smart contract
  rpcUrl?: string;
}

export interface NFTClaimRequest {
  userPublicKey: string;
  signature: string;
  message: string;
  nonce: number;
  expiry: number;
}

export interface NFTClaimResponse {
  success: boolean;
  data?: {
    nftMint: string;
    userTokenAccount: string;
    transactionSignature: string;
    gasCostPaidByProtocol: number;
    message: string;
  };
  error?: string;
}

export interface PermitData {
  userPublicKey: string;
  serviceId: string;
  instructionData: string; // base64
  targetProgram: string;
  expiry: number;
  maxFee: number;
  nonce: number;
}

export class GaslessSDK {
  private api: AxiosInstance;
  private config: GaslessConfig;
  private connection?: Connection;
  private program?: anchor.Program;

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

    // Inicializar conexión si se proporciona RPC
    if (config.rpcUrl) {
      this.connection = new Connection(config.rpcUrl, 'confirmed');
    }
  }

  /**
   * 🎯 MÉTODO PRINCIPAL: Claim NFT con firma off-chain
   * Este es el flujo que quieres: Usuario firma → Smart Contract → NFT gratis
   */
  async claimNFTWithSignature(wallet: WalletAdapter): Promise<NFTClaimResponse> {
    if (!wallet.publicKey) throw new Error('Wallet not connected');

    try {
      console.log('🎯 Starting gasless NFT claim with signature...');
      console.log(`👤 User: ${wallet.publicKey.toString()}`);

      // 1. Generar nonce y expiry
      const nonce = Math.floor(Math.random() * 1000000);
      const expiry = Math.floor(Date.now() / 1000) + 3600; // 1 hora

      // 2. Crear mensaje para firmar
      const message = this.createNFTClaimMessage({
        userPublicKey: wallet.publicKey.toString(),
        serviceId: this.config.serviceId,
        action: 'claim_nft',
        nonce,
        expiry
      });

      console.log('📝 Message to sign:', message);

      // 3. Firmar mensaje (GRATIS para el usuario)
      const signature = await this.signMessage(wallet, message);
      console.log('✅ Message signed successfully');

      // 4. Enviar al backend/smart contract
      const claimRequest: NFTClaimRequest = {
        userPublicKey: wallet.publicKey.toString(),
        signature: bs58.encode(signature),
        message,
        nonce,
        expiry
      };

      console.log('📤 Sending claim request to smart contract...');

      // 5. Llamar al endpoint que interactúa con el smart contract
      const response = await this.api.post('/api/nft/claim-with-smart-contract', claimRequest);

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to claim NFT');
      }

      console.log('🎉 NFT claimed successfully via smart contract!');
      return response.data;

    } catch (error) {
      console.error('❌ Error claiming NFT:', error);
      throw error;
    }
  }

  /**
   * 🎨 MÉTODO MÁGICO: Claim NFT sin firmas (para demos)
   */
  async claimNFTMagical(wallet: WalletAdapter): Promise<NFTClaimResponse> {
    if (!wallet.publicKey) throw new Error('Wallet not connected');

    try {
      console.log('✨ Starting magical NFT claim (no signatures)...');
      
      const response = await this.api.post('/api/nft/claim-magical', {
        userPublicKey: wallet.publicKey.toString()
      });

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to claim NFT');
      }

      return response.data;
    } catch (error) {
      console.error('❌ Error in magical NFT claim:', error);
      throw error;
    }
  }

  /**
   * 📊 Obtener estadísticas del protocolo
   */
  async getProtocolStats(): Promise<any> {
    const response = await this.api.get('/api/protocol/stats');
    if (!response.data?.success) {
      throw new Error(response.data?.error || 'Failed to get protocol stats');
    }
    return response.data.data;
  }

  /**
   * 💰 Obtener balance de la master wallet
   */
  async getMasterWalletBalance(): Promise<any> {
    const response = await this.api.get('/api/protocol/master-wallet-balance');
    if (!response.data?.success) {
      throw new Error(response.data?.error || 'Failed to get master wallet balance');
    }
    return response.data.data;
  }

  /**
   * 🎨 Obtener NFTs del usuario
   */
  async getUserNFTs(userPublicKey: string): Promise<any[]> {
    const response = await this.api.get(`/api/nft/user/${userPublicKey}`);
    if (!response.data?.success) {
      throw new Error(response.data?.error || 'Failed to get user NFTs');
    }
    return response.data.data;
  }

  // -------- MÉTODOS INTERNOS --------

  /**
   * Crear mensaje canónico para claim de NFT
   */
  private createNFTClaimMessage(data: {
    userPublicKey: string;
    serviceId: string;
    action: string;
    nonce: number;
    expiry: number;
  }): string {
    const payload = {
      domain: 'gasless-nft-claim',
      action: data.action,
      user: data.userPublicKey,
      serviceId: data.serviceId,
      nonce: data.nonce,
      expiry: data.expiry,
      timestamp: Math.floor(Date.now() / 1000)
    };

    return `Gasless NFT Claim\n` +
           `====================\n` +
           `🎨 You are claiming a FREE NFT!\n` +
           `💰 Cost to you: $0.00\n` +
           `⚡ Gas paid by: Protocol Master Wallet\n` +
           `\n` +
           `Details:\n` +
           `User: ${payload.user}\n` +
           `Service: ${payload.serviceId}\n` +
           `Nonce: ${payload.nonce}\n` +
           `Expires: ${new Date(payload.expiry * 1000).toISOString()}\n` +
           `\n` +
           `By signing this message, you authorize the\n` +
           `smart contract to mint an NFT to your wallet\n` +
           `without you paying any transaction fees.\n` +
           `\n` +
           `This signature is FREE and does not cost gas.`;
  }

  /**
   * Firmar mensaje con wallet
   */
  private async signMessage(wallet: WalletAdapter, message: string): Promise<Uint8Array> {
    if (!canSignMessage(wallet)) {
      throw new Error('Wallet does not support message signing');
    }

    const messageBytes = new TextEncoder().encode(message);
    const signature = await wallet.signMessage(messageBytes);
    return signature;
  }

  // -------- MÉTODOS DE COMPATIBILIDAD --------

  /** Create and submit a gasless permit for execution */
  async createPermit(
    wallet: WalletAdapter,
    instruction: TransactionInstruction,
    options: { expiry?: number; maxFee?: number } = {},
  ): Promise<any> {
    // Redirigir a NFT claim si es una instrucción de NFT
    if (instruction.programId.toString().includes('nft') || 
        this.config.serviceId.includes('nft')) {
      return this.claimNFTWithSignature(wallet);
    }

    // Implementación original para otros casos
    throw new Error('General permits not implemented yet. Use claimNFTWithSignature() for NFTs.');
  }

  /** Execute array of instructions gaslessly */
  async executeGasless(
    wallet: WalletAdapter,
    instructions: TransactionInstruction[],
    options: { expiry?: number; maxFee?: number } = {},
  ): Promise<any[]> {
    // Para NFTs, usar el método específico
    if (instructions.length === 1 && this.config.serviceId.includes('nft')) {
      const result = await this.claimNFTWithSignature(wallet);
      return [result];
    }

    throw new Error('Batch execution not implemented yet. Use claimNFTWithSignature() for NFTs.');
  }

  private serializeInstruction(instruction: TransactionInstruction): Uint8Array {
    return instruction.data ?? new Uint8Array();
  }
}

// Export types
export * from './types.js';
export default GaslessSDK;