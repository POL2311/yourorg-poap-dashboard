import React, { useMemo, useState, useCallback } from 'react'
import { Connection, PublicKey } from '@solana/web3.js'
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react'
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'
import toast, { Toaster } from 'react-hot-toast'
import axios from 'axios'

import '@solana/wallet-adapter-react-ui/styles.css'

// === CONFIG ===
const endpoint = 'https://api.devnet.solana.com' // solana-test-validator
const apiUrl = import.meta.env.VITE_GASLESS_API_URL as string || 'http://localhost:3000'

if (!apiUrl) {
  throw new Error('VITE_GASLESS_API_URL no está definido en .env');
}

export default function NFTClaimApp() {
  const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()], [])
  const connection = useMemo(() => new Connection(endpoint, 'confirmed'), [])

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div style={{ 
            padding: 24, 
            fontFamily: 'system-ui, sans-serif',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            minHeight: '100vh',
            color: 'white'
          }}>
            <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
              <h1 style={{ fontSize: 48, marginBottom: 16, textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
                🎨 Free NFT Claim
              </h1>
              
              <p style={{ fontSize: 18, marginBottom: 32, opacity: 0.9 }}>
                Claim your free NFT without paying any gas fees!<br/>
                Powered by Gasless Infrastructure ⚡
              </p>

              <div style={{ 
                background: 'rgba(255,255,255,0.1)', 
                padding: 20, 
                borderRadius: 12, 
                marginBottom: 24,
                backdropFilter: 'blur(10px)'
              }}>
                <p style={{ margin: '8px 0', fontSize: 14, opacity: 0.8 }}>
                  🌐 Network: <code>Devnet</code><br/>
                  🔗 API: <code>{apiUrl}</code>
                </p>
              </div>

              <div style={{ marginBottom: 32 }}>
                <WalletMultiButton style={{
                  background: 'linear-gradient(45deg, #ff6b6b, #ee5a24)',
                  border: 'none',
                  borderRadius: 25,
                  padding: '12px 24px',
                  fontSize: 16,
                  fontWeight: 'bold',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                }} />
              </div>

              <ClaimSection />
            </div>
          </div>

          <Toaster 
            position="top-right" 
            toastOptions={{ 
              duration: 6000,
              style: {
                background: '#363636',
                color: '#fff',
                borderRadius: 10,
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
              }
            }} 
          />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

function ClaimSection() {
  const { publicKey } = useWallet()
  const [isLoading, setIsLoading] = useState(false)
  const [lastClaimedNFT, setLastClaimedNFT] = useState<{
    mint: string;
    transaction: string;
  } | null>(null)

  const onClaimNFT = useCallback(async () => {
    if (!publicKey) {
      toast.error('Please connect your wallet first!')
      return
    }

    setIsLoading(true)
    const loadingToast = toast.loading('🎨 Minting your free NFT...')

    try {
      // ✅ LLAMADA DIRECTA AL BACKEND - SIN FIRMA REQUERIDA
      const response = await axios.post(`${apiUrl}/api/permits/claim-nft-simple`, {
        userPublicKey: publicKey.toString()
      })

      if (response.data.success) {
        const { nftMint, transactionSignature, userTokenAccount } = response.data.data
        
        setLastClaimedNFT({
          mint: nftMint,
          transaction: transactionSignature
        })

        toast.dismiss(loadingToast)
        toast.success(
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: 8 }}>
              🎉 NFT Claimed Successfully!
            </div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>
              No gas fees paid • Powered by Gasless Infrastructure
            </div>
          </div>,
          { duration: 8000 }
        )

        // Mostrar detalles adicionales
        setTimeout(() => {
          toast.success(
            <div>
              <div>🎨 NFT Mint: {nftMint.slice(0, 8)}...{nftMint.slice(-8)}</div>
              <div>📦 Transaction: {transactionSignature.slice(0, 8)}...{transactionSignature.slice(-8)}</div>
            </div>,
            { duration: 10000 }
          )
        }, 2000)

      } else {
        throw new Error(response.data.error || 'Failed to claim NFT')
      }

    } catch (error: any) {
      console.error('❌ Error claiming NFT:', error)
      toast.dismiss(loadingToast)
      
      const errorMessage = error.response?.data?.error || error.message || 'Failed to claim NFT'
      toast.error(`❌ ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }, [publicKey])

  if (!publicKey) {
    return (
      <div style={{ 
        background: 'rgba(255,255,255,0.1)', 
        padding: 32, 
        borderRadius: 16,
        backdropFilter: 'blur(10px)'
      }}>
        <p style={{ fontSize: 18, margin: 0 }}>
          👆 Connect your wallet to claim your free NFT
        </p>
      </div>
    )
  }

  return (
    <div style={{ 
      background: 'rgba(255,255,255,0.1)', 
      padding: 32, 
      borderRadius: 16,
      backdropFilter: 'blur(10px)'
    }}>
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 16, marginBottom: 8 }}>
          🎯 Connected: <code>{publicKey.toBase58().slice(0, 8)}...{publicKey.toBase58().slice(-8)}</code>
        </p>
      </div>

      <button
        onClick={onClaimNFT}
        disabled={isLoading}
        style={{
          background: isLoading 
            ? 'linear-gradient(45deg, #95a5a6, #7f8c8d)' 
            : 'linear-gradient(45deg, #2ecc71, #27ae60)',
          color: 'white',
          border: 'none',
          borderRadius: 25,
          padding: '16px 32px',
          fontSize: 18,
          fontWeight: 'bold',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
          transition: 'all 0.3s ease',
          transform: isLoading ? 'scale(0.95)' : 'scale(1)',
          minWidth: 200
        }}
      >
        {isLoading ? '🎨 Minting...' : '🚀 Claim Free NFT'}
      </button>

      <div style={{ marginTop: 16, fontSize: 14, opacity: 0.8 }}>
        ✨ No signatures required • No gas fees • Instant delivery
      </div>

      {lastClaimedNFT && (
        <div style={{ 
          marginTop: 24, 
          padding: 16, 
          background: 'rgba(46, 204, 113, 0.2)',
          borderRadius: 12,
          border: '1px solid rgba(46, 204, 113, 0.3)'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: 8 }}>
            🎉 Last Claimed NFT:
          </div>
          <div style={{ fontSize: 12, wordBreak: 'break-all' }}>
            🎨 Mint: <code>{lastClaimedNFT.mint}</code><br/>
            📦 TX: <code>{lastClaimedNFT.transaction}</code>
          </div>
          <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
            Check your wallet - the NFT should appear shortly!
          </div>
        </div>
      )}
    </div>
  )
}