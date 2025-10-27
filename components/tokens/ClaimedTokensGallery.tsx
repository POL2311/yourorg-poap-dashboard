// app/(wherever)/tokens/claimedTokensGallery.tsx
'use client'

import * as React from 'react'
import { Copy, CheckCircle2 } from 'lucide-react'

/** ===== Tipos ===== */
export type ClaimedTokenItem = {
  mint: string
  accounts: number           // # de cuentas que lo han reclamado (o tu métrica)
  claimsTotal?: number       // opcional: total de claims si lo tienes
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' // opcional
}

export type ClaimedTokensGalleryProps = {
  title?: string
  items: ClaimedTokenItem[]
  totalCampaigns?: number
  totalMints?: number
  className?: string
}

/** ===== Utils ===== */
function short(addr: string, left = 10, right = 10) {
  if (!addr) return ''
  return addr.length > left + right + 1
    ? `${addr.slice(0, left)}…${addr.slice(-right)}`
    : addr
}

// anillo por rareza (si no mandas rarity, usa el default emerald)
function ringFor(r?: ClaimedTokenItem['rarity']) {
  switch (r) {
    case 'legendary':
      return 'ring-amber-400/35'
    case 'epic':
      return 'ring-fuchsia-400/35'
    case 'rare':
      return 'ring-sky-400/35'
    case 'uncommon':
      return 'ring-emerald-400/35'
    case 'common':
      return 'ring-white/20'
    default:
      return 'ring-emerald-400/30'
  }
}

/** ===== Galería ===== */
export default function ClaimedTokensGallery({
  title = 'Mis Tokens Reclamados',
  items,
  totalCampaigns,
  totalMints,
  className,
}: ClaimedTokensGalleryProps) {
  return (
    <section
      className={[
        'rounded-[28px] border border-white/20 bg-white/8 backdrop-blur-xl',
        'p-6 md:p-8 shadow-[inset_0_1px_0_rgba(255,255,255,.08)]',
        className || '',
      ].join(' ')}
    >
      {/* Header */}
      <div className="mb-6 flex items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-emerald-400/15 ring-1 ring-emerald-300/30">
            <span className="text-lg">💫</span>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        </div>
        {(totalCampaigns ?? totalMints) && (
          <div className="text-sm text-white/70">
            {typeof totalCampaigns === 'number' && (
              <span className="mr-2">{totalCampaigns} campaigns</span>
            )}
            {typeof totalMints === 'number' && <span>· total {totalMints}</span>}
          </div>
        )}
      </div>

      {/* Grid */}
      <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <li key={it.mint}>
            <TokenBadgeRound item={it} />
          </li>
        ))}
      </ul>
    </section>
  )
}

/** ===== Card redonda tipo “badge” ===== */
function TokenBadgeRound({ item }: { item: ClaimedTokenItem }) {
  const { mint, accounts, claimsTotal, rarity } = item

  const copy = React.useCallback(() => {
    navigator.clipboard.writeText(mint).catch(() => {})
  }, [mint])

  return (
    <div
      className={[
        'group relative isolate overflow-hidden rounded-3xl',
        'border border-white/15 bg-gradient-to-br from-white/14 to-white/6',
        'p-5 md:p-6 backdrop-blur-xl shadow-xl',
        'transition-all duration-300 hover:translate-y-[-2px] hover:shadow-2xl',
      ].join(' ')}
    >
      {/* halo */}
      <div
        className="pointer-events-none absolute -inset-20 -z-10 rounded-[40px] bg-[radial-gradient(120px_120px_at_var(--mx)_var(--my),rgba(255,255,255,.16),transparent_60%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden
      />

      {/* fila superior */}
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[13px] font-medium tracking-wide text-white/65">
          Mint
        </div>
        <button
          onClick={copy}
          className="rounded-full border border-white/15 bg-white/8 p-1.5 text-white/80 hover:bg-white/12"
          title="Copiar mint"
        >
          <Copy className="h-4 w-4" />
        </button>
      </div>

      {/* medalla circular */}
      <div className="mx-auto mb-4 grid h-28 w-28 place-items-center rounded-full bg-white/6 ring-1 ring-white/15">
        <div
          className={[
            'relative grid h-24 w-24 place-items-center rounded-full',
            'bg-gradient-to-b from-white/20 to-white/5 ring-1 ring-white/15',
          ].join(' ')}
        >
          {/* aro por rareza */}
          <div className={`absolute inset-0 rounded-full ring-4 ${ringFor(rarity)}`} />
          <span className="text-4xl font-semibold tabular-nums">{accounts}</span>
        </div>
      </div>

      {/* mint abreviado */}
      <div
        className="mx-auto mb-2 max-w-[90%] truncate text-center font-mono text-[13px] text-white/80"
        title={mint}
      >
        {short(mint)}
      </div>

      {/* chips */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        <span className="rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs text-white/80">
          {accounts} account(s)
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/15 px-3 py-1 text-xs text-emerald-100">
          <CheckCircle2 className="h-3.5 w-3.5" />
          claimed
        </span>
        {typeof claimsTotal === 'number' && (
          <span className="rounded-full border border-sky-400/30 bg-sky-400/15 px-3 py-1 text-xs text-sky-100">
            {claimsTotal} claims
          </span>
        )}
      </div>
    </div>
  )
}
