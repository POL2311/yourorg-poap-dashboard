import { NextRequest, NextResponse } from 'next/server'

const API_KEY = process.env.HELIUS_API_KEY!
const NETWORK = (process.env.HELIUS_NETWORK || 'devnet').toLowerCase()
const RPC_URL =
  NETWORK === 'mainnet'
    ? `https://mainnet.helius-rpc.com/?api-key=${API_KEY}`
    : `https://devnet.helius-rpc.com/?api-key=${API_KEY}`

// SPL Token Program
const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'

// Util para normalizar balances
function readUiAmount(acc: any) {
  const amt = acc?.account?.data?.parsed?.info?.tokenAmount
  if (!amt) return { amount: '0', decimals: 0, uiAmount: 0 }
  const decimals = Number(amt.decimals || 0)
  const amount = String(amt.amount || '0')
  const uiAmount = Number(amt.uiAmount || 0)
  return { amount, decimals, uiAmount }
}

/**
 * GET /api/wallet/claims?owner=<pubkey>&mints=<mint1,mint2,...>
 * - owner: dirección del usuario
 * - mints (opcional): lista de mints de campañas para filtrar
 */
export async function GET(req: NextRequest) {
  const owner = req.nextUrl.searchParams.get('owner')
  const mintsParam = req.nextUrl.searchParams.get('mints')

  if (!owner) {
    return NextResponse.json({ error: 'Missing owner' }, { status: 400 })
  }

  const mintsFilter = mintsParam
    ? new Set(mintsParam.split(',').map((s) => s.trim()).filter(Boolean))
    : null

  try {
    // 1) Trae TODOS los token accounts (SPL) del owner
    const rpcRes = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      // NO caches en dev para evitar 304s y revalidaciones raras
      cache: 'no-store',
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'claims',
        method: 'getTokenAccountsByOwner',
        params: [
          owner,
          { programId: TOKEN_PROGRAM_ID },
          { encoding: 'jsonParsed' }
        ]
      })
    })

    const json = await rpcRes.json()

    if (!rpcRes.ok || json?.error) {
      return NextResponse.json(
        { error: json?.error?.message || `RPC ${rpcRes.status}` },
        { status: rpcRes.status || 500 }
      )
    }

    const value = json?.result?.value ?? []

    // 2) Mapea cuentas -> mint/balance
    const items = value.map((acc: any) => {
      const mint = acc?.account?.data?.parsed?.info?.mint as string
      const { amount, decimals, uiAmount } = readUiAmount(acc)
      return {
        tokenAccount: acc?.pubkey,
        mint,
        amount,
        decimals,
        uiAmount
      }
    })

    // 3) Filtra: >0 y (si se pasan mints) que pertenezcan a tus campañas
    const filtered = items.filter((it: any) => {
      if (it.uiAmount <= 0) return false
      if (mintsFilter && !mintsFilter.has(it.mint)) return false
      return true
    })

    // 4) Agrega por mint (una “claim” por campaña normalmente es 1 token)
    const byMint = new Map<string, { mint: string; totalUi: number; accounts: number }>()
    for (const it of filtered) {
      const prev = byMint.get(it.mint) || { mint: it.mint, totalUi: 0, accounts: 0 }
      prev.totalUi += it.uiAmount
      prev.accounts += 1
      byMint.set(it.mint, prev)
    }

    const claims = Array.from(byMint.values())

    return NextResponse.json({
      owner,
      network: NETWORK,
      totalDistinctMints: claims.length,
      totalUiAmount: claims.reduce((s, c) => s + c.totalUi, 0),
      claims,
      rawCount: filtered.length // nº de token accounts con balance > 0
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}
