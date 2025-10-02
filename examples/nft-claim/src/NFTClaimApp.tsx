import React, { useMemo, useState, useCallback } from 'react'
import { Connection, PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js'
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react'
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'
import { GaslessSDK } from '@gasless-infra/sdk'
import toast, { Toaster } from 'react-hot-toast'

import '@solana/wallet-adapter-react-ui/styles.css'

// === CONFIG ===
const endpoint = 'http://localhost:8899' // solana-test-validator
const apiUrl = import.meta.env.VITE_GASLESS_API_URL as string
const serviceId = import.meta.env.VITE_GASLESS_SERVICE_ID as string

if (!apiUrl) throw new Error('VITE_GASLESS_API_URL no está definido en .env')
if (!serviceId) throw new Error('VITE_GASLESS_SERVICE_ID no está definido en .env')

// Instrucción dummy (válida pero “no-op”) contra SystemProgram
function buildDummyIx(payer: PublicKey): TransactionInstruction {
  return new TransactionInstruction({
    programId: SystemProgram.programId,
    keys: [{ pubkey: payer, isSigner: false, isWritable: false }],
    data: Buffer.from([]),
  })
}

export default function NFTClaimApp() {
  const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()], [])
  // La conexión no se usa directamente, pero mantenerla no molesta:
  useMemo(() => new Connection(endpoint, 'confirmed'), [])
  const [sdk] = useState(() => new GaslessSDK({ apiUrl, serviceId }))

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
            <h1 style={{ fontSize: 40, marginBottom: 8 }}>🎨 NFT Claim Example</h1>

            <p style={{ margin: '8px 0' }}>
              RPC: <code>{endpoint}</code>
              <br />
              API: <code>{apiUrl}</code>
              <br />
              Service ID: <code>{serviceId}</code>
            </p>

            <div style={{ margin: '16px 0' }}>
              <WalletMultiButton />
            </div>

            <ClaimSection sdk={sdk} />
          </div>

          <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

function ClaimSection({ sdk }: { sdk: GaslessSDK }) {
  const { wallet, publicKey } = useWallet()

const onClaim = useCallback(async () => {
  try {
    if (!wallet?.adapter || !publicKey) throw new Error('Conecta tu wallet primero')
    const adapter = wallet.adapter as any
    if (typeof adapter.signMessage !== 'function') throw new Error('Tu wallet no soporta signMessage')

    console.log('[UI] apiUrl =', import.meta.env.VITE_GASLESS_API_URL)
    console.log('[UI] serviceId =', import.meta.env.VITE_GASLESS_SERVICE_ID)
    console.log('[UI] publicKey =', publicKey.toBase58())

    const ix = buildDummyIx(publicKey)
    console.log('[UI] calling sdk.createPermit...')
    const permit = await sdk.createPermit(adapter, ix, {
      expiry: Math.floor(Date.now() / 1000) + 15 * 60,
      maxFee: 5_000_000,
    })
    console.log('[UI] permit response =', permit)
    toast.success(`Permit creado (nonce ${permit.nonce})`)
  } catch (e: any) {
    console.error('[UI] onClaim error:', e)
    toast.error(e?.message ?? 'Error al crear el permit')
  }
}, [wallet, publicKey, sdk])


  if (!publicKey) {
    return <p>Conecta tu wallet para continuar.</p>
  }

  return (
    <div style={{ marginTop: 12 }}>
      <p>Wallet: {publicKey.toBase58()}</p>
      <button
        onClick={onClaim}
        style={{
          marginTop: 8,
          padding: '10px 16px',
          fontSize: 16,
          borderRadius: 8,
          cursor: 'pointer',
        }}
      >
        🚀 Claim NFT (permit)
      </button>
    </div>
  )
}
