'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMemo, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import {
  Home, LayoutGrid, BarChart3, QrCode, KeyRound, Settings, User2,
  ChevronLeft, ChevronRight,
  User,
  AlignHorizontalJustifyEnd,
  BugPlayIcon
} from 'lucide-react'

// util simple
function cx(...cls: (string | false | undefined)[]) {
  return cls.filter(Boolean).join(' ')
}

type Item = { href: string; label: string; icon: React.ComponentType<{ className?: string }> }

const NAV_ITEMS: Item[] = [
  { href: '/market',                 label: 'Market',   icon: BugPlayIcon },
  { href: '/dashboard',            label: 'Dashboard',   icon: LayoutGrid },
  { href: '/dashboard/analytics',  label: 'Analytics',   icon: BarChart3 },
  { href: '/dashboard/campaigns',  label: 'Campaigns',    icon: QrCode },
  { href: '/dashboard/api-keys',   label: 'API Keys',    icon: KeyRound },
  { href: '/user',                 label: 'Profile',   icon: User2 },
]

export default function LiquidSidebar() {
  const pathname = usePathname() ?? '/'
  const [open, setOpen] = useState(true)
  const items = useMemo(() => NAV_ITEMS, [])
  const { user } = useAuth()

  const initial = user?.name?.[0]?.toUpperCase() || 'U'
  const tier = (user?.tier || 'FREE').toUpperCase()

  return (
    <aside
      className={cx(
        // cuerpo
        'sticky top-4 h-[calc(100dvh-2rem)] shrink-0 transition-[width] duration-300',
        // glass + brillo
        'rounded-3xl border border-white/15 bg-white/10 backdrop-blur-2xl',
        'shadow-[0_20px_60px_rgba(0,0,0,0.35)]',
        'relative overflow-hidden',
        open ? 'w-72' : 'w-[76px]',
      )}
      // brillo suave
      style={{
        backgroundImage:
          'linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06))',
      }}
    >
      {/* Brand + toggle */}
      <div className="flex items-center justify-between gap-2 p-3">
        <Link
          href="/"
          className={cx(
            'grid h-10 w-10 place-items-center rounded-2xl border border-white/25',
            'bg-white/10 text-white/90'
          )}
        >
          <Home className="h-5 w-5" />
        </Link>

        <button
          onClick={() => setOpen(v => !v)}
          className="grid h-10 w-10 place-items-center rounded-2xl border border-white/20 bg-white/10 text-white/80"
          aria-label={open ? 'Contraer' : 'Expandir'}
        >
          {open ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </button>
      </div>

      {/* Perfil (solo expandido) */}
      {open && (
        <div className="px-3 pb-2">
          <div className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/20 bg-white/10 text-white">
                <span className="text-sm font-semibold">{initial}</span>
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{user?.name || 'Usuario'}</div>
                <div className="mt-1 inline-flex items-center gap-2">
                  <span className={cx(
                    'rounded-full border px-2 py-[2px] text-[11px] font-medium',
                    tier === 'PRO'
                      ? 'border-emerald-400/40 text-emerald-200 bg-emerald-400/10'
                      : 'border-white/25 text-white/80 bg-white/10'
                  )}>
                    {tier}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="mx-3 mb-2 mt-3 h-px bg-white/10" />

      {/* Nav */}
      <nav className="px-2 space-y-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cx(
                'group relative flex items-center gap-3 rounded-2xl border px-3 py-2 text-sm transition-colors',
                active
                  ? 'border-white/25 bg-white/20 text-white'
                  : 'border-white/10 bg-white/[.06] text-white/80 hover:bg-white/[.12]'
              )}
            >
              <span className="grid h-8 w-8 place-items-center rounded-xl border border-white/15 bg-white/10 text-white">
                <Icon className="h-4 w-4" />
              </span>

              {/* etiqueta */}
              <span
                className={cx(
                  'whitespace-nowrap transition-opacity',
                  open ? 'opacity-100' : 'opacity-0 pointer-events-none'
                )}
              >
                {label}
              </span>

              {/* tooltip cuando está colapsado */}
              {!open && (
                <span
                  className="pointer-events-none absolute left-[72px] z-10 rounded-xl border border-white/15 bg-white/10 px-2 py-1 text-xs text-white/90 opacity-0 backdrop-blur-md shadow-xl transition-opacity group-hover:opacity-100"
                >
                  {label}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer pequeño */}
      <div className="absolute bottom-3 left-0 right-0 px-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-white/70 text-center">
          v2.0
        </div>
      </div>
    </aside>
  )
}
