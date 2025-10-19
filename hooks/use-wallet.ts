'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

export function useWalletConnection() {
  const { 
    publicKey, 
    connected, 
    connecting, 
    disconnecting, 
    wallet, 
    connect, 
    disconnect,
    signMessage 
  } = useWallet()
  
  const [isConnecting, setIsConnecting] = useState(false)
  const [userPublicKey, setUserPublicKey] = useState<string | null>(null)

  // Update userPublicKey when wallet connects/disconnects
  useEffect(() => {
    if (connected && publicKey) {
      setUserPublicKey(publicKey.toString())
      console.log('🔗 Wallet connected:', publicKey.toString())
    } else {
      setUserPublicKey(null)
      console.log('🔌 Wallet disconnected')
    }
  }, [connected, publicKey])

  const handleConnect = useCallback(async () => {
    if (!wallet) {
      toast.error('No wallet selected')
      return
    }

    try {
      setIsConnecting(true)
      await connect()
      toast.success('Wallet connected successfully!')
    } catch (error: any) {
      console.error('Error connecting wallet:', error)
      toast.error('Failed to connect wallet')
    } finally {
      setIsConnecting(false)
    }
  }, [wallet, connect])

  const handleDisconnect = useCallback(async () => {
    try {
      await disconnect()
      toast.success('Wallet disconnected')
    } catch (error: any) {
      console.error('Error disconnecting wallet:', error)
      toast.error('Failed to disconnect wallet')
    }
  }, [disconnect])

  const signMessageForAuth = useCallback(async (message: string) => {
    if (!publicKey || !signMessage) {
      throw new Error('Wallet not connected or signMessage not available')
    }

    try {
      const encodedMessage = new TextEncoder().encode(message)
      const signature = await signMessage(encodedMessage)
      return {
        publicKey: publicKey.toString(),
        signature: Array.from(signature),
        message
      }
    } catch (error: any) {
      console.error('Error signing message:', error)
      throw new Error('Failed to sign message')
    }
  }, [publicKey, signMessage])

  return {
    // Wallet state
    publicKey,
    connected,
    connecting: connecting || isConnecting,
    disconnecting,
    wallet,
    userPublicKey,
    
    // Actions
    connect: handleConnect,
    disconnect: handleDisconnect,
    signMessage: signMessageForAuth,
    
    // Computed values
    isWalletAvailable: !!wallet,
    walletName: wallet?.adapter.name || 'Unknown',
    walletIcon: wallet?.adapter.icon,
  }
}
