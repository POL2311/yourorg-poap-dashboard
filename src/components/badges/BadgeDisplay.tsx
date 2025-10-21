'use client'

import React from 'react'
import { Lock, Shield, ShieldCheck, Sparkles, Trophy } from 'lucide-react'
import clsx from 'clsx'
import { useRouter } from 'next/navigation'

export type UIBadge = {
  id: string
  name: string
  description: string
  icon: string // puedes mapear a un icono abajo
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | string
  unlocked: boolean
  progress?: number
  target?: number
}

export type LevelInfo = { level: number; name: string; color: string }

export function BadgeDisplay({
  badges,
  totalClaims,
  level,
  onClickBadge, // opcional si quieres manejar clicks
}: {
  badges: UIBadge[]
  totalClaims: number
  level: LevelInfo
  onClickBadge?: (badge: UIBadge) => void
}) {
  const router = useRouter()
  const unlocked = badges.filter(b => b.unlocked)
  const locked = badges.filter(b => !b.unlocked)

  return (
    <div className="space-y-6">
      {/* resumen tipo “strip” */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
        <StripItem
          label="Nivel"
          value={`#${level.level} · ${level.name}`}
          icon={<Sparkles className="h-4 w-4 text-fuchsia-300" />}
        />
        <Dot />
        <StripItem
          label="Claims"
          value={totalClaims}
          icon={<Trophy className="h-4 w-4 text-amber-300" />}
        />
        <Dot />
        <StripItem
          label="Desbloqueadas"
          value={`${unlocked.length}/${badges.length}`}
          icon={<ShieldCheck className="h-4 w-4 text-emerald-300" />}
        />
      </div>

      {/* desbloqueadas */}
      {unlocked.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-white/80">Insignias desbloqueadas</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {unlocked.map((b) => (
              <BadgeCard
                key={b.id}
                badge={b}
                variant="unlocked"
                onClick={() => (onClickBadge ? onClickBadge(b) : undefined)}
              />
            ))}
          </div>
        </section>
      )}

      {/* bloqueadas */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-white/60" />
          <h3 className="text-sm font-semibold text-white/80">
            Badges bloqueados ({locked.length})
          </h3>
        </div>
        {locked.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {locked.map((b) => (
              <BadgeCard
                key={b.id}
                badge={b}
                variant="locked"
                onClick={() => (onClickBadge ? onClickBadge(b) : undefined)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

/* ========== Subcomponentes ========== */

function BadgeCard({
  badge,
  variant,
  onClick,
}: {
  badge: UIBadge
  variant: 'locked' | 'unlocked'
  onClick?: () => void
}) {
  const Icon = getIcon(badge.icon)
  const chip = rarityChip(badge.rarity)

  const progress = Math.min(
    100,
    Math.round(((badge.progress ?? 0) / Math.max(1, badge.target ?? 0)) * 100)
  )

  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'group flex w-full flex-col rounded-2xl border p-4 text-left transition-all',
        'backdrop-blur will-change-transform hover:-translate-y-[2px] hover:shadow-lg',
        variant === 'unlocked'
          ? 'border-emerald-400/25 bg-emerald-500/10 hover:bg-emerald-500/15'
          : 'border-white/10 bg-white/5 hover:bg-white/10'
      )}
    >
      {/* header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={clsx(
              'grid h-10 w-10 place-items-center rounded-xl',
              variant === 'unlocked'
                ? 'bg-emerald-600/20 text-emerald-100 border border-emerald-400/30'
                : 'bg-white/10 text-white/80 border border-white/15'
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold leading-none">{badge.name}</p>
              <Chip className={chip.className}>{chip.label}</Chip>
            </div>
            <p className="mt-1 text-xs text-white/70 line-clamp-2">{badge.description}</p>
          </div>
        </div>

        {variant === 'unlocked' ? (
          <ShieldCheck className="h-5 w-5 text-emerald-300" />
        ) : (
          <Lock className="h-5 w-5 text-white/50" />
        )}
      </div>

      {/* progress (solo si está bloqueado y tiene meta) */}
      {variant === 'locked' && badge.target && (
        <div className="mt-2">
          <div className="mb-1 flex items-center justify-between text-xs text-white/70">
            <span>Progreso</span>
            <span>
              {badge.progress ?? 0}/{badge.target}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full border border-white/10 bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-fuchsia-400/70 to-purple-400/70 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </button>
  )
}

function Chip({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <span
      className={clsx(
        'rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
        className
      )}
    >
      {children}
    </span>
  )
}

function StripItem({
  label,
  value,
  icon,
}: {
  label: string
  value: React.ReactNode
  icon?: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-xs text-white/60">{label}</span>
      <span className="text-xs font-semibold text-white">{value}</span>
    </div>
  )
}

function Dot() {
  return <span className="mx-1 h-1 w-1 rounded-full bg-white/30" />
}

function EmptyState() {
  return (
    <div className="grid place-items-center rounded-2xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur">
      <Shield className="mb-2 h-6 w-6 text-white/60" />
      <p className="text-sm text-white/70">¡Has desbloqueado todo lo disponible por ahora!</p>
    </div>
  )
}

/* ========== helpers ========== */

function getIcon(name?: string) {
  // mapea strings de tu backend a íconos (puedes extenderlo)
  switch ((name || '').toLowerCase()) {
    case 'collector':
    case 'coleccionista':
      return Trophy
    case 'enthusiast':
    case 'entusiasta':
      return Sparkles
    default:
      return Shield
  }
}

function rarityChip(r: string) {
  const key = (r || 'common').toLowerCase()
  const map: Record<
    string,
    { label: string; className: string }
  > = {
    common: {
      label: 'common',
      className: 'border-white/15 bg-white/5 text-white/70',
    },
    uncommon: {
      label: 'uncommon',
      className: 'border-emerald-400/30 bg-emerald-500/15 text-emerald-100',
    },
    rare: {
      label: 'rare',
      className: 'border-sky-400/30 bg-sky-500/15 text-sky-100',
    },
    epic: {
      label: 'epic',
      className: 'border-fuchsia-400/30 bg-fuchsia-500/15 text-fuchsia-100',
    },
    legendary: {
      label: 'legendary',
      className: 'border-yellow-400/30 bg-yellow-500/15 text-yellow-100',
    },
  }
  return map[key] ?? map.common
}
