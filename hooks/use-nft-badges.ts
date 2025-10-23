// hooks/use-nft-badges.ts
'use client'

import { useEffect, useRef, useState } from 'react'
import { HELIUS_RPC_URL, HELIUS_REST_URL } from '@/lib/helius'

type Asset = {
  id: string
  content?: { links?: { image?: string }; metadata?: { name?: string; description?: string } }
  compression?: { compressed?: boolean }
  interface?: string
  grouping?: { group_key: string; group_value: string }[]
}

type GalleryBadge = {
  id: string
  name: string
  description?: string
  imageUrl?: string
  unlocked: boolean
  rarity?: string
}

type NftBadges = {
  badges: GalleryBadge[]
  totalClaims: number
  level: { level: number; name: string }
}

function mapAssetsToBadges(assets: Asset[]): GalleryBadge[] {
  return (assets || []).map((a) => ({
    id: a.id,
    name:
      a.content?.metadata?.name ??
      a.content?.links?.image?.split('/').pop() ??
      'Asset',
    description: a.content?.metadata?.description,
    imageUrl: a.content?.links?.image,
    unlocked: true,
    // si quieres derivar rarity por collection o traits, hazlo aquí
  }))
}

export function useNftBadges(owner?: string) {
  const [data, setData] = useState<NftBadges | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!owner) {
      setData(null)
      setError(null)
      return
    }

    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac

    async function fetchRPC() {
      const body = {
        jsonrpc: '2.0',
        id: 'badges',
        method: 'getAssetsByOwner',
        params: {
          ownerAddress: owner,
          page: 1,
          limit: 100,
          displayOptions: { showUnverifiedCollections: true },
        },
      }
      const res = await fetch(HELIUS_RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: ac.signal,
      })
      if (!res.ok) {
        // deja que el caller haga fallback
        const text = await res.text()
        throw new Error(`RPC ${res.status}: ${text}`)
      }
      const json = await res.json()
      if (json.error) throw new Error(json.error?.message || 'RPC error')
      const assets: Asset[] = json.result?.items ?? []
      return assets
    }

    async function fetchREST() {
      const url = `${HELIUS_REST_URL}/addresses/${owner}/assets?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY || process.env.HELIUS_API_KEY}&page=1&limit=100`
      const res = await fetch(url, { signal: ac.signal })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`REST ${res.status}: ${text}`)
      }
      const json = await res.json()
      const assets: Asset[] = json?.items ?? json ?? []
      return assets
    }

    async function run() {
      setLoading(true)
      setError(null)
      try {
        // 1) intenta RPC DAS
        let assets: Asset[] = []
        try {
          assets = await fetchRPC()
        } catch (e: any) {
          // si es "method not found" o 404, cae al REST
          if (/method not found|404|-32601|-32603/i.test(String(e?.message))) {
            assets = await fetchREST()
          } else {
            throw e
          }
        }

        const badges = mapAssetsToBadges(assets)
        setData({
          badges,
          totalClaims: badges.length,
          level: { level: Math.max(1, Math.ceil(badges.length / 5)), name: 'Collector' },
        })
      } catch (e: any) {
        if (e?.name !== 'AbortError') setError(e?.message || 'Unknown error')
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    run()
    return () => ac.abort()
  }, [owner])

  return { data, loading, error }
}
