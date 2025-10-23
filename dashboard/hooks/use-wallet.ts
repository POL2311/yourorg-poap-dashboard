'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletReadyState } from '@solana/wallet-adapter-base'
import { toast } from 'react-hot-toast'

export function useWalletConnection() {
  const {
    publicKey,
    connected,
    connecting,
    disconnecting,
    wallet,
    wallets,          // <- TODAS las wallets registradas en el provider
    select,           // <- para seleccionar una wallet por nombre
    connect,
    disconnect,
    signMessage,
  } = useWallet()

  const [isConnecting, setIsConnecting] = useState(false)
  const [userPublicKey, setUserPublicKey] = useState<string | null>(null)
  const mounted = useRef(false)

  // Preferencias para auto-selección si hay varias instaladas
  const PREFERRED = ['Phantom', 'Solflare']

  const installedWallets = useMemo(
    () => wallets.filter(w => w.readyState === WalletReadyState.Installed),
    [wallets]
  )

  const pickInstalledByPreference = useCallback(() => {
    // 1) intenta por preferencia
    for (const name of PREFERRED) {
      const w = installedWallets.find(x => x.adapter.name === name)
      if (w) return w
    }
    // 2) si no hay de preferencia, toma la primera instalada
    return installedWallets[0] ?? null
  }, [installedWallets])

  // Auto-select si no hay wallet seleccionada pero sí hay alguna instalada
  useEffect(() => {
    if (mounted.current) return
    mounted.current = true

    if (!wallet && installedWallets.length > 0) {
      const w = pickInstalledByPreference()
      if (w) {
        // No conectamos automáticamente (evita popups inesperados),
        // sólo la seleccionamos para que el botón "Conectar" funcione.
        select(w.adapter.name)
      }
    }
  }, [wallet, installedWallets, pickInstalledByPreference, select])

  // Sincroniza clave pública legible
  useEffect(() => {
    if (connected && publicKey) {
      setUserPublicKey(publicKey.toString())
      // console.log('🔗 Wallet connected:', publicKey.toString())
    } else {
      setUserPublicKey(null)
      // console.log('🔌 Wallet disconnected')
    }
  }, [connected, publicKey])

  const handleConnect = useCallback(async () => {
    try {
      setIsConnecting(true)

      // Si no hay wallet seleccionada, pero hay una instalada, selecciónala
      if (!wallet) {
        const w = pickInstalledByPreference()
        if (w) {
          select(w.adapter.name)
        }
      }

      // Revisa de nuevo
      if (!wallet && installedWallets.length === 0) {
        toast.error('No se detectó ninguna wallet instalada')
        return
      }

      await connect()
      toast.success('¡Wallet conectada!')
    } catch (error: any) {
      // console.error('Error connecting wallet:', error)
      toast.error(error?.message ?? 'No se pudo conectar la wallet')
    } finally {
      setIsConnecting(false)
    }
  }, [wallet, connect, select, pickInstalledByPreference, installedWallets])

  const handleDisconnect = useCallback(async () => {
    try {
      await disconnect()
      toast.success('Wallet desconectada')
    } catch (error: any) {
      // console.error('Error disconnecting wallet:', error)
      toast.error(error?.message ?? 'No se pudo desconectar la wallet')
    }
  }, [disconnect])

  const signMessageForAuth = useCallback(
    async (message: string) => {
      if (!publicKey || !signMessage) {
        throw new Error('Wallet no conectada o signMessage no disponible')
      }
      try {
        const encoded = new TextEncoder().encode(message)
        const signature = await signMessage(encoded)
        return {
          publicKey: publicKey.toString(),
          signature: Array.from(signature),
          message,
        }
      } catch (error: any) {
        // console.error('Error signing message:', error)
        throw new Error('No se pudo firmar el mensaje')
      }
    },
    [publicKey, signMessage]
  )

  // Disponible si hay wallet seleccionada o alguna instalada
  const isWalletAvailable = useMemo(
    () => !!wallet || installedWallets.length > 0,
    [wallet, installedWallets.length]
  )

  const walletName = useMemo(
    () => wallet?.adapter.name ?? pickInstalledByPreference()?.adapter.name ?? 'Wallet',
    [wallet, pickInstalledByPreference]
  )

  const walletIcon = useMemo(
    () => wallet?.adapter.icon ?? pickInstalledByPreference()?.adapter.icon,
    [wallet, pickInstalledByPreference]
  )

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
    isWalletAvailable,
    walletName,
    walletIcon,
  }
}
