export interface GaslessConfig {
  apiUrl: string;
  serviceId: string;
  apiKey?: string;
}

export interface PermitData {
  userPublicKey: string;
  serviceId: string;
  instructionData: string;
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

export interface ServiceInfo {
  serviceId: string;
  owner: string;
  feeCollector: string;
  serviceFeeBps: number;
  maxTransactionAmount: number;
  allowedPrograms: string[];
  isActive: boolean;
  totalTransactions: number;
}

export interface AnalyticsData {
  totalPermits: number;
  executedPermits: number;
  expiredPermits: number;
  pendingPermits: number;
  totalFees: number;
  averageExecutionTime: number;
  dailyStats: {
    date: string;
    permits: number;
    executed: number;
    fees: number;
  }[];
}

export interface NFTMetadata {
  name: string;
  symbol: string;
  description?: string;
  image?: string;
  external_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

export interface MintNFTOptions {
  expiry?: number;
  maxFee?: number;
  metadata: NFTMetadata;
  recipient?: string; // If different from signer
}

export interface TokenTransferOptions {
  expiry?: number;
  maxFee?: number;
  amount: number;
  recipient: string;
  mint: string;
}

export interface GaslessError {
  code: string;
  message: string;
  details?: any;
}

export type PermitStatusType = 'pending' | 'executed' | 'expired' | 'failed';

export interface WalletContextType {
  publicKey: string | null;
  connected: boolean;
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
  signTransaction: (transaction: any) => Promise<any>;
}