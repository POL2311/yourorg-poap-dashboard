import React, { useMemo, useState, useCallback } from 'react'
import { Connection, PublicKey } from '@solana/web3.js'
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react'
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'
import toast, { Toaster } from 'react-hot-toast'
import axios from 'axios'

import '@solana/wallet-adapter-react-ui/styles.css'

// === CONFIG ===
const endpoint = process.env.VITE_SOLANA_RPC_URL || 'http://localhost:8899'
const apiUrl = import.meta.env.VITE_GASLESS_API_URL as string || 'http://localhost:3000'

console.log('🔧 Config:', { endpoint, apiUrl });

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
            <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
              <h1 style={{ fontSize: 48, marginBottom: 16, textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
                🎨 Real NFT Gasless Magic
              </h1>
              
              <p style={{ fontSize: 18, marginBottom: 32, opacity: 0.9 }}>
                Mint <strong>REAL NFTs</strong> without paying any gas fees!<br/>
                <strong>✨ Token-2022 + Metadata • No gas fees • Instant delivery ✨</strong>
              </p>

              <div style={{ 
                background: 'rgba(255,255,255,0.1)', 
                padding: 20, 
                borderRadius: 12, 
                marginBottom: 24,
                backdropFilter: 'blur(10px)'
              }}>
                <p style={{ margin: '8px 0', fontSize: 14, opacity: 0.8 }}>
                  🌐 Network: <code>{endpoint.includes('localhost') ? 'Localnet' : 'Devnet'}</code><br/>
                  🔗 API: <code>{apiUrl}</code><br/>
                  ⚡ Real NFT minting with Token-2022 + Metadata
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

              <RealNFTClaimSection />
            </div>
          </div>

          <Toaster 
            position="top-right" 
            toastOptions={{ 
              duration: 10000,
              style: {
                background: '#363636',
                color: '#fff',
                borderRadius: 10,
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                maxWidth: '500px'
              }
            }} 
          />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

function RealNFTClaimSection() {
  const { publicKey } = useWallet()
  const [isLoading, setIsLoading] = useState(false)
  const [claimedNFTs, setClaimedNFTs] = useState<any[]>([])
  const [relayerStats, setRelayerStats] = useState<any>(null)

  // Cargar estadísticas del relayer
  const loadRelayerStats = useCallback(async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/relayer/stats`)
      if (response.data.success) {
        setRelayerStats(response.data.data)
      }
    } catch (error) {
      console.error('Error loading relayer stats:', error)
    }
  }, [])

  // Cargar datos iniciales
  React.useEffect(() => {
    loadRelayerStats()
  }, [loadRelayerStats])

  const onMagicalClaim = useCallback(async () => {
    if (!publicKey) {
      toast.error('Please connect your wallet first!')
      return
    }

    setIsLoading(true)
    const loadingToast = toast.loading('🎨 Minting your REAL NFT with Token-2022...')

    try {
      console.log('🎯 Starting REAL NFT mint for:', publicKey.toString())

      // ✨ LLAMADA DIRECTA AL ENDPOINT CORRECTO
      const response = await axios.post(`${apiUrl}/api/nft/claim-magical`, {
        userPublicKey: publicKey.toString()
      })

      console.log('📦 Response:', response.data)

      if (response.data.success) {
        const { 
          nftMint, 
          transactionSignature, 
          userTokenAccount, 
          gasCostPaidByRelayer,
          metadata,
          relayerPublicKey
        } = response.data.data
        
        toast.dismiss(loadingToast)
        
        // Mostrar éxito con detalles del NFT real
        toast.success(
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: 8, fontSize: 16 }}>
              🎉 REAL NFT Minted Successfully!
            </div>
            <div style={{ fontSize: 12, opacity: 0.9 }}>
              ✨ Token-2022 + Metadata • Gas paid by relayer: {gasCostPaidByRelayer} lamports
            </div>
          </div>,
          { duration: 12000 }
        )

        // Mostrar detalles técnicos del NFT real
        setTimeout(() => {
          toast.success(
            <div style={{ fontSize: 12 }}>
              <div style={{ fontWeight: 'bold', marginBottom: 4 }}>🎨 {metadata.name}</div>
              <div>📍 Mint: {nftMint.slice(0, 12)}...{nftMint.slice(-12)}</div>
              <div>📦 Token Account: {userTokenAccount.slice(0, 12)}...{userTokenAccount.slice(-12)}</div>
              <div>📦 TX: {transactionSignature.slice(0, 12)}...{transactionSignature.slice(-12)}</div>
              <div>⚡ Relayer: {relayerPublicKey.slice(0, 12)}...{relayerPublicKey.slice(-12)}</div>
            </div>,
            { duration: 15000 }
          )
        }, 2000)

        // Agregar NFT a la lista local
        const newNFT = {
          mint: nftMint,
          tokenAccount: userTokenAccount,
          transaction: transactionSignature,
          metadata,
          timestamp: new Date().toISOString(),
          gasCost: gasCostPaidByRelayer
        }
        setClaimedNFTs(prev => [newNFT, ...prev])

        // Recargar stats del relayer
        await loadRelayerStats()

        // Mostrar instrucciones para ver el NFT
        setTimeout(() => {
          toast(
            <div style={{ fontSize: 12 }}>
              <div style={{ fontWeight: 'bold', marginBottom: 4 }}>📱 How to see your NFT:</div>
              <div>1. Open your wallet (Phantom, Solflare)</div>
              <div>2. Go to NFTs/Collectibles section</div>
              <div>3. Look for "{metadata.name}"</div>
              <div>4. It may take 1-2 minutes to appear</div>
            </div>,
            { duration: 20000, icon: '💡' }
          )
        }, 4000)

      } else {
        throw new Error(response.data.error || 'Failed to mint NFT')
      }

    } catch (error: any) {
      console.error('❌ Error minting real NFT:', error)
      toast.dismiss(loadingToast)
      
      const errorMessage = error.response?.data?.error || error.message || 'Failed to mint NFT'
      toast.error(`❌ ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }, [publicKey, loadRelayerStats])

  if (!publicKey) {
    return (
      <div style={{ 
        background: 'rgba(255,255,255,0.1)', 
        padding: 32, 
        borderRadius: 16,
        backdropFilter: 'blur(10px)'
      }}>
        <p style={{ fontSize: 18, margin: 0 }}>
          👆 Connect your wallet to mint real NFTs
        </p>
        <p style={{ fontSize: 14, marginTop: 8, opacity: 0.8 }}>
          Real Token-2022 NFTs with metadata, no gas fees! ✨
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
        {relayerStats && (
          <div style={{ fontSize: 12, opacity: 0.8, marginTop: 8 }}>
            💰 Relayer Balance: {relayerStats.balance.toFixed(4)} SOL • 🌐 {relayerStats.network}
          </div>
        )}
      </div>

      <button
        onClick={onMagicalClaim}
        disabled={isLoading || (relayerStats && relayerStats.balance < 0.01)}
        style={{
          background: isLoading 
            ? 'linear-gradient(45deg, #95a5a6, #7f8c8d)' 
            : (relayerStats && relayerStats.balance < 0.01)
            ? 'linear-gradient(45deg, #e74c3c, #c0392b)'
            : 'linear-gradient(45deg, #2ecc71, #27ae60)',
          color: 'white',
          border: 'none',
          borderRadius: 25,
          padding: '16px 32px',
          fontSize: 18,
          fontWeight: 'bold',
          cursor: isLoading || (relayerStats && relayerStats.balance < 0.01) ? 'not-allowed' : 'pointer',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
          transition: 'all 0.3s ease',
          transform: isLoading ? 'scale(0.95)' : 'scale(1)',
          minWidth: 280
        }}
      >
        {isLoading 
          ? '🎨 Minting Real NFT...' 
          : (relayerStats && relayerStats.balance < 0.01)
          ? '💰 Relayer Low Balance'
          : '✨ Mint Real NFT (Token-2022)'}
      </button>

      <div style={{ marginTop: 16, fontSize: 14, opacity: 0.8 }}>
        🚀 Real Token-2022 NFT • Zero cost • Instant delivery • Pure magic
      </div>

      {relayerStats && relayerStats.balance < 0.01 && (
        <div style={{ 
          marginTop: 16, 
          padding: 12, 
          background: 'rgba(231, 76, 60, 0.2)',
          borderRadius: 8,
          fontSize: 12
        }}>
          ⚠️ Relayer balance too low. Need at least 0.01 SOL for minting.
        </div>
      )}

      {claimedNFTs.length > 0 && (
        <div style={{ 
          marginTop: 24, 
          padding: 16, 
          background: 'rgba(46, 204, 113, 0.2)',
          borderRadius: 12,
          border: '1px solid rgba(46, 204, 113, 0.3)'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: 12 }}>
            🎨 Your Real NFTs ({claimedNFTs.length}):
          </div>
          {claimedNFTs.slice(0, 3).map((nft, index) => (
            <div key={nft.mint} style={{ 
              fontSize: 12, 
              marginBottom: 12,
              padding: 12,
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 8
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{nft.metadata.name}</div>
              <div>🎨 Mint: {nft.mint.slice(0, 16)}...{nft.mint.slice(-16)}</div>
              <div>📦 Token Account: {nft.tokenAccount.slice(0, 16)}...{nft.tokenAccount.slice(-16)}</div>
              <div>📦 Transaction: {nft.transaction.slice(0, 16)}...{nft.transaction.slice(-16)}</div>
              <div>⏰ {new Date(nft.timestamp).toLocaleString()}</div>
              <div>💰 Gas Cost: {nft.gasCost} lamports (paid by relayer)</div>
              <div style={{ marginTop: 4, fontSize: 10, opacity: 0.8 }}>
                💡 Check your wallet's NFT section to see this Token-2022 NFT!
              </div>
            </div>
          ))}
          {claimedNFTs.length > 3 && (
            <div style={{ fontSize: 12, opacity: 0.8, textAlign: 'center' }}>
              ... and {claimedNFTs.length - 3} more real NFTs!
            </div>
          )}
        </div>
      )}
    </div>
  )
}