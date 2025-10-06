import React, { useMemo, useState, useCallback } from 'react'
import { Connection, PublicKey } from '@solana/web3.js'
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react'
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'
import toast, { Toaster } from 'react-hot-toast'
import axios from 'axios'

import '@solana/wallet-adapter-react-ui/styles.css'

// === CONFIG ===
const endpoint = 'https://api.devnet.solana.com'  // FIXED: removed extra colon
const apiUrl = 'http://localhost:3000'  // Direct API URL

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
                🎨 Devnet Gasless NFT
              </h1>
              
              <p style={{ fontSize: 18, marginBottom: 32, opacity: 0.9 }}>
                Mint real NFTs on <strong>Solana Devnet</strong> without gas fees!<br/>
                <strong>✨ Real blockchain transactions • Zero cost • Instant delivery ✨</strong>
              </p>

              <div style={{ 
                background: 'rgba(255,255,255,0.1)', 
                padding: 20, 
                borderRadius: 12, 
                marginBottom: 24,
                backdropFilter: 'blur(10px)'
              }}>
                <p style={{ margin: '8px 0', fontSize: 14, opacity: 0.8 }}>
                  🌐 Network: <code>Solana Devnet</code><br/>
                  🔗 API: <code>{apiUrl}</code><br/>
                  ⚡ Real devnet transactions with automatic gas payment
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

              <DevnetNFTClaimSection />
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

function DevnetNFTClaimSection() {
  const { publicKey } = useWallet()
  const [isLoading, setIsLoading] = useState(false)
  const [claimedNFTs, setClaimedNFTs] = useState<any[]>([])
  const [relayerStats, setRelayerStats] = useState<any>(null)

  // Load relayer stats
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

  // Load initial data
  React.useEffect(() => {
    loadRelayerStats()
  }, [loadRelayerStats])

  // 🎯 DEVNET NFT CLAIM - Direct API call
  const onDevnetClaim = useCallback(async () => {
    if (!publicKey) {
      toast.error('Please connect your wallet first!')
      return
    }

    setIsLoading(true)
    const loadingToast = toast.loading('🎨 Minting real NFT on Solana Devnet...')

    try {
      console.log('🎯 DEVNET NFT CLAIM STARTED')
      console.log(`👤 User: ${publicKey.toString()}`)
      console.log(`🌐 Network: Solana Devnet`)
      console.log(`🔗 API URL: ${apiUrl}/api/nft/claim-magical`)

      // Direct API call to backend
      const response = await axios.post(`${apiUrl}/api/nft/claim-magical`, {
        userPublicKey: publicKey.toString(),
        serviceId: 'devnet-demo-service'
      })

      console.log('📦 API Response:', response.data)

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
        
        // Show success
        toast.success(
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: 8, fontSize: 16 }}>
              🎉 DEVNET NFT MINTED!
            </div>
            <div style={{ fontSize: 12, opacity: 0.9 }}>
              ✨ Real Solana Devnet transaction • Gas paid by relayer: {gasCostPaidByRelayer} lamports
            </div>
          </div>,
          { duration: 12000 }
        )

        // Show devnet explorer link
        setTimeout(() => {
          toast.success(
            <div style={{ fontSize: 12 }}>
              <div style={{ fontWeight: 'bold', marginBottom: 4 }}>🎨 {metadata.name}</div>
              <div>📍 Mint: {nftMint.slice(0, 12)}...{nftMint.slice(-12)}</div>
              <div>📦 TX: {transactionSignature.slice(0, 12)}...{transactionSignature.slice(-12)}</div>
              <div>🔗 <a href={`https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`} target="_blank" style={{color: '#4ade80'}}>View on Devnet Explorer</a></div>
            </div>,
            { duration: 20000 }
          )
        }, 2000)

        // Add NFT to local list
        const newNFT = {
          mint: nftMint,
          tokenAccount: userTokenAccount,
          transaction: transactionSignature,
          metadata,
          timestamp: new Date().toISOString(),
          gasCost: gasCostPaidByRelayer
        }
        setClaimedNFTs(prev => [newNFT, ...prev])

        // Reload relayer stats
        await loadRelayerStats()

      } else {
        throw new Error(response.data.error || 'Failed to mint NFT')
      }

    } catch (error: any) {
      console.error('❌ Error minting devnet NFT:', error)
      toast.dismiss(loadingToast)
      
      const errorMessage = error.response?.data?.error || error.message || 'Failed to mint NFT'
      toast.error(`❌ ${errorMessage}`)
      
      // Show debugging info
      toast.error(
        <div style={{ fontSize: 12 }}>
          <div>🔍 Debug info:</div>
          <div>API URL: {apiUrl}</div>
          <div>User: {publicKey.toString()}</div>
          <div>Network: Solana Devnet</div>
          <div>Check backend is running on port 3000</div>
        </div>,
        { duration: 15000 }
      )
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
          👆 Connect your wallet to mint NFTs on Devnet
        </p>
        <p style={{ fontSize: 14, marginTop: 8, opacity: 0.8 }}>
          Real Solana Devnet transactions, zero gas fees! ✨
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
        onClick={onDevnetClaim}
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
          minWidth: 320
        }}
      >
        {isLoading 
          ? '🎨 Minting on Devnet...' 
          : (relayerStats && relayerStats.balance < 0.01)
          ? '💰 Relayer Low Balance'
          : '🚀 Mint NFT on Devnet'}
      </button>

      <div style={{ marginTop: 16, fontSize: 14, opacity: 0.8 }}>
        🌐 Real Solana Devnet transactions • Zero gas fees<br/>
        <code style={{ fontSize: 12 }}>POST {apiUrl}/api/nft/claim-magical</code>
      </div>

      {claimedNFTs.length > 0 && (
        <div style={{ 
          marginTop: 24, 
          padding: 16, 
          background: 'rgba(46, 204, 113, 0.2)',
          borderRadius: 12,
          border: '1px solid rgba(46, 204, 113, 0.3)'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: 12 }}>
            🎨 Your Devnet NFTs ({claimedNFTs.length}):
          </div>
          {claimedNFTs.slice(0, 3).map((nft, index) => (
            <div key={nft.mint} style={{ 
              fontSize: 12, 
              marginBottom: 12,
              padding: 12,
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 8
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: 4 }}>🎨 {nft.metadata.name}</div>
              <div>📍 Mint: {nft.mint.slice(0, 16)}...{nft.mint.slice(-16)}</div>
              <div>📦 Transaction: {nft.transaction.slice(0, 16)}...{nft.transaction.slice(-16)}</div>
              <div>⏰ {new Date(nft.timestamp).toLocaleString()}</div>
              <div>💰 Gas Cost: {nft.gasCost} lamports (paid by relayer)</div>
              <div style={{ marginTop: 4 }}>
                <a href={`https://explorer.solana.com/tx/${nft.transaction}?cluster=devnet`} 
                   target="_blank" 
                   style={{color: '#4ade80', fontSize: 10}}>
                  🔗 View on Devnet Explorer
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}