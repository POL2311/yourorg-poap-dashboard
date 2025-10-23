'use client'
import { useEffect, useState } from 'react'

type Claim = { mint: string; totalUi: number; accounts: number }
type ClaimsResponse = {
  owner: string
  network: string
  totalDistinctMints: number
  totalUiAmount: number
  claims: Claim[]
  rawCount: number
  error?: string
}

export function useClaimedTokens(owner?: string, mints?: string[]) {
  const [data, setData] = useState<ClaimsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!owner) { setData(null); setError(null); return }
    let abort = false
    ;(async () => {
      setLoading(true); setError(null)
      try {
        const qs = new URLSearchParams({ owner })
        if (mints?.length) qs.set('mints', mints.join(','))
        const res = await fetch(`/api/wallet/claims?${qs.toString()}`, { cache: 'no-store' })
        const json: ClaimsResponse = await res.json()
        if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`)
        if (!abort) setData(json)
      } catch (e:any) {
        if (!abort) setError(e?.message || 'Error')
        if (!abort) setData(null)
      } finally {
        if (!abort) setLoading(false)
      }
    })()
    return () => { abort = true }
  }, [owner, Array.isArray(mints) ? mints.join(',') : ''])

  return { data, loading, error }
}
