'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Lock, Check, Sparkles } from 'lucide-react'

type Badge = {
  id: string
  name: string
  description: string
  imageUrl?: string
  icon?: string
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | string
  unlocked: boolean
  progress?: number
  target?: number
}

type Level = { level: number; name: string; color?: string }

export function BadgeGallery({
  badges,
  totalClaims,
  level,
}: {
  badges: Badge[]
  totalClaims?: number
  level?: Level
}) {
  const [filter, setFilter] = React.useState<'all' | 'unlocked' | 'locked'>('all')
  const [rarity, setRarity] = React.useState<'all' | Badge['rarity']>('all')

  const filtered = badges.filter(b => {
    const f =
      filter === 'all' ? true : filter === 'unlocked' ? b.unlocked : !b.unlocked
    const r = rarity === 'all' ? true : b.rarity === rarity
    return f && r
  })

  const unlockedCount = badges.filter(b => b.unlocked).length

  return (
    <div className="space-y-4">
      {/* Header compacto */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-semibold">Mis Insignias</h3>
          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm">
            {unlockedCount} / {badges.length} desbloqueadas
          </span>
          {level && (
            <span className="inline-flex items-center gap-1 rounded-full border border-purple-400/30 bg-purple-400/10 px-3 py-1 text-sm text-purple-100">
              <Sparkles className="h-4 w-4" />
              Nivel {level.level} · {level.name}
            </span>
          )}
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-2">
          <FilterPill
            active={filter === 'all'}
            onClick={() => setFilter('all')}
            label="Todas"
          />
          <FilterPill
            active={filter === 'unlocked'}
            onClick={() => setFilter('unlocked')}
            label="Desbloqueadas"
          />
          <FilterPill
            active={filter === 'locked'}
            onClick={() => setFilter('locked')}
            label="Bloqueadas"
          />
          <div className="mx-1 h-6 w-px bg-white/15" />
          {['all', 'common', 'uncommon', 'rare', 'epic', 'legendary'].map(r => (
            <FilterPill
              key={r}
              active={rarity === (r as any)}
              onClick={() => setRarity(r as any)}
              label={cap(r)}
              subtle
            />
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((b) => (
          <BadgeCard key={b.id} badge={b} />
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full grid place-items-center rounded-2xl border border-white/15 bg-white/5 p-10 text-white/70">
            No hay insignias con esos filtros
          </div>
        )}
      </div>
    </div>
  )
}

/* ---------- subcomponentes ---------- */

function FilterPill({
  label,
  active,
  onClick,
  subtle = false,
}: {
  label: string
  active?: boolean
  subtle?: boolean
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1 text-sm transition',
        subtle
          ? 'border-white/12 bg-white/5 hover:bg-white/10'
          : 'border-white/15 bg-white/10 hover:bg-white/15',
        active && 'border-white/25 bg-white/20'
      )}
    >
      {label}
    </button>
  )
}

function BadgeCard({ badge }: { badge: any }) {
  const {
    name,
    description,
    imageUrl,
    icon,
    rarity,
    unlocked,
    progress = 0,
    target = 0,
  } = badge

  const ratio = target > 0 ? Math.min(100, Math.round((progress / target) * 100)) : 0

  const rarityChip = rarityStyles[rarity] ?? rarityStyles.common

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border backdrop-blur-md p-4',
        'border-white/12 bg-white/[.06]',
        'shadow-[inset_0_1px_0_rgba(255,255,255,.10),_0_20px_50px_rgba(0,0,0,.35)]'
      )}
    >
      {/* Esquina superior derecha: estado / rareza */}
      <div className="absolute right-3 top-3 flex items-center gap-2">
        <span
          className={cn(
            'rounded-full border px-2 py-0.5 text-xs font-medium',
            rarityChip.badge
          )}
        >
          {cap(rarity)}
        </span>
        {unlocked ? (
          <span className="grid h-7 w-7 place-items-center rounded-full border border-emerald-400/30 bg-emerald-400/15 text-emerald-200">
            <Check className="h-4 w-4" />
          </span>
        ) : (
          <span className="grid h-7 w-7 place-items-center rounded-full border border-white/20 bg-white/10 text-white/70">
            <Lock className="h-4 w-4" />
          </span>
        )}
      </div>

      {/* Imagen */}
      <div
        className={cn(
          'mx-auto mb-3 grid h-24 w-24 place-items-center rounded-full',
          'border border-white/15 bg-white/10 shadow-[0_10px_30px_rgba(0,0,0,.25)]',
          !unlocked && 'grayscale opacity-80'
        )}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={name} className="h-14 w-14 object-contain" />
        ) : (
          <span className="text-3xl">{icon ?? '🏅'}</span>
        )}
      </div>

      {/* Título + descripción */}
      <div className="text-center">
        <h4 className="text-base font-semibold">{name}</h4>
        <p className="mt-1 line-clamp-2 text-sm text-white/70">{description}</p>
      </div>

      {/* Progreso (solo si está bloqueado y tiene meta) */}
      {!unlocked && target > 0 && (
        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-xs text-white/70">
            <span>Progreso</span>
            <span>
              {progress}/{target}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full border border-white/15 bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400/90 to-emerald-300/70"
              style={{ width: `${ratio}%` }}
            />
          </div>
        </div>
      )}

      {/* Glow de hover */}
      <div
        className={cn(
          'pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300',
          'group-hover:opacity-100'
        )}
        style={{
          background:
            'radial-gradient(800px 200px at 50% -10%, rgba(255,255,255,.16), transparent 60%)',
        }}
      />
    </div>
  )
}

/* ---------- estilos de rareza ---------- */

const rarityStyles: Record<
  string,
  { badge: string }
> = {
  common: { badge: 'border-white/15 bg-white/8 text-white/85' },
  uncommon: { badge: 'border-emerald-400/30 bg-emerald-400/12 text-emerald-100' },
  rare: { badge: 'border-sky-400/30 bg-sky-400/12 text-sky-100' },
  epic: { badge: 'border-purple-400/30 bg-purple-400/12 text-purple-100' },
  legendary: { badge: 'border-yellow-400/30 bg-yellow-400/12 text-yellow-100' },
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
