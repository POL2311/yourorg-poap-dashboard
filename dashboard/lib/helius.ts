// lib/helius.ts
export const HELIUS_RPC_URL =
  process.env.HELIUS_RPC_URL ?? `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`

export const HELIUS_REST_URL =
  process.env.HELIUS_REST_URL ?? `https://api.helius.xyz/v0`
