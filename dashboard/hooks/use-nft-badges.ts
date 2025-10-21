// src/hooks/use-nft-badges.ts
'use client'
import { useEffect, useState } from 'react'

export function useNftBadges(owner?: string) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!owner) return
    setLoading(true)
    fetch(`/api/badges-cnft?owner=${owner}`)
      .then(r => r.json())
      .then(j => {
        if (!j.success) throw new Error(j.error || 'error')
        setData(j.data)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [owner])

  return { loading, data, error }
}
