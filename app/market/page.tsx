'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  QrCode,
  Sparkles,
  Search,
  CalendarDays,
  MapPin,
  Star,
  Filter,
} from 'lucide-react'

type MarketCampaign = {
  id: string
  name: string
  description?: string | null
  imageUrl?: string | null
  eventDate: string
  location?: string | null
  organizer?: { id: string; name: string; company?: string | null }
  totalClaims?: number
  claimsRemaining?: number | null
}

type Tab = 'featured' | 'all' | 'activity'

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

export default function MarketPage() {
  const [items, setItems] = useState<MarketCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('all')
  const [q, setQ] = useState('')

  useEffect(() => {
    const ac = new AbortController()
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch('/api/public/campaigns?limit=1000', { signal: ac.signal })
        if (!res.ok) {
          const txt = await res.text()
          throw new Error(`HTTP ${res.status} – ${txt || 'Failed to fetch'}`)
        }
        const json = await res.json()
        const data: MarketCampaign[] = json?.data?.campaigns ?? json?.data ?? []
        setItems(data)
      } catch (e: any) {
        if (e.name !== 'AbortError') {
          console.error('Failed to load public campaigns:', e)
          setError('Public campaigns could not be loaded.')
        }
      } finally {
        setLoading(false)
      }
    })()
    return () => ac.abort()
  }, [])

  const filtered = useMemo(() => {
    const base = tab === 'featured' ? items.slice(0, Math.min(12, items.length)) : items
    if (!q.trim()) return base
    const k = q.toLowerCase()
    return base.filter((c) =>
      c.name.toLowerCase().includes(k) ||
      (c.description ?? '').toLowerCase().includes(k) ||
      (c.location ?? '').toLowerCase().includes(k) ||
      (c.organizer?.name ?? '').toLowerCase().includes(k)
    )
  }, [items, q, tab])

  return (
    <div
      className="min-h-screen text-white"
      style={{ background: '' }}
    >
      {/* Navbar líquido (sin sidebar) */}
      <div className="container mx-auto px-4 pt-4">
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-16 space-y-8">
        {/* HERO glassy con halo */}
        <section className="relative overflow-hidden rounded-3xl border border-white/15 bg-white/10 backdrop-blur-xl">
          {/* halos de color */}
          <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-96 rounded-full blur-3xl bg-emerald-400/25" />
          <div className="pointer-events-none absolute -bottom-24 -right-20 h-72 w-96 rounded-full blur-3xl bg-indigo-400/25" />

          <div className="relative px-6 py-10 md:px-10">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm">
                <Sparkles className="h-4 w-4" />
                <span>POAP Gallery</span>
              </div>

              <div className="hidden md:flex items-center gap-2 text-xs text-white/70">
                <span className="rounded-full border border-white/20 bg-white/10 px-2 py-1">
                  Beta UI
                </span>
              </div>
            </div>

            <h1 className="mt-5 text-center text-4xl font-semibold md:text-5xl">
              Discover active campaigns
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-center text-white/80">
              Enter a campaign and claim your POAP gasless.
            </p>

            {/* Buscador pill */}
            <div className="mx-auto mt-8 max-w-3xl">
              <div
                className={cx(
                  'relative flex items-center gap-2 rounded-full px-3 py-2',
                  'bg-white/90 ring-1 ring-black/5 shadow-[0_10px_40px_rgba(0,0,0,0.10)]'
                )}
              >
                <Search className="ml-2 h-5 w-5 text-neutral-700" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search campaigns by title, location or organizer…"
                  className="w-full rounded-full bg-transparent px-2 py-2 text-[15px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
                />
                <button
                  className={cx(
                    'relative rounded-full px-5 py-2 text-sm font-semibold text-gray-900',
                    'bg-gradient-to-r from-emerald-300 via-emerald-400 to-emerald-600',
                    'ring-1 ring-emerald-500/30 hover:brightness-[1.03] active:translate-y-[0.5px]',
                    'shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_8px_24px_rgba(16,185,129,0.35)]'
                  )}
                  onClick={(e) => e.preventDefault()}
                >
                  Search
                  <span className="pointer-events-none absolute inset-0 rounded-full [mask-image:linear-gradient(to_bottom,white,transparent_55%)] bg-white/30" />
                </button>
              </div>

              {/* chips de filtros (decorativos por ahora) */}
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs">
                <button className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-white/80 hover:bg-white/15">
                  <Filter className="mr-1 inline h-3.5 w-3.5" />
                  Filters
                </button>
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-white/70">
                  Today
                </span>
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-white/70">
                  This week
                </span>
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-white/70">
                  Virtual
                </span>
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-white/70">
                  In person
                </span>
              </div>
            </div>
          </div>

          {/* línea sutil inferior */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-2 px-4 py-3 md:px-6">
            <TabButton
              active={tab === 'featured'}
              onClick={() => setTab('featured')}
              icon={<Star className="h-4 w-4" />}
              label="Featured"
              count={Math.min(12, items.length)}
            />
            <TabButton
              active={tab === 'all'}
              onClick={() => setTab('all')}
              icon={<Sparkles className="h-4 w-4" />}
              label="All"
              count={items.length}
            />
            <TabButton
              active={tab === 'activity'}
              onClick={() => setTab('activity')}
              icon={<CalendarDays className="h-4 w-4" />}
              label="Activity"
              muted
            />
          </div>
        </section>

        {/* GRID */}
        <section>
          {loading ? (
            <GridSkeleton />
          ) : error ? (
            <div className="mx-auto max-w-md rounded-3xl border border-white/15 bg-white/10 p-6 text-center">
              {error}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState q={q} />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((c) => (
                <Link key={c.id} href={`/campaign/${c.id}`} className="group">
                  <article
                    className={cx(
                      'relative h-full rounded-3xl p-4',
                      'border border-white/15 bg-white/10 backdrop-blur-xl',
                      'shadow-[0_10px_40px_rgba(0,0,0,0.12)] transition-transform will-change-transform',
                      'hover:-translate-y-0.5'
                    )}
                  >
                    {/* anillo decorativo exterior */}
                    <div className="pointer-events-none absolute inset-0 rounded-[26px] ring-1 ring-white/10" />

                    {/* badge esquina */}
                    <div className="absolute right-4 top-4">
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2 py-1 text-[11px] text-white/85">
                        <Sparkles className="h-3.5 w-3.5" />
                        Active
                      </span>
                    </div>

                    {/* media */}
                    <div className="aspect-[16/9] overflow-hidden rounded-2xl border border-white/15 bg-white/5 grid place-items-center">
                      {c.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={c.imageUrl}
                          alt={c.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <QrCode className="h-10 w-10 text-white/70" />
                      )}
                    </div>

                    {/* content */}
                    <h3 className="mt-4 line-clamp-1 text-lg font-semibold">{c.name}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-white/80">
                      {c.description || 'Campaign without description'}
                    </p>

                    <div className="mt-3 flex items-center justify-between text-xs text-white/75">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {safeDate(c.eventDate)}
                      </span>
                      {c.location && (
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" />
                          <span className="line-clamp-1 max-w-[160px]">{c.location}</span>
                        </span>
                      )}
                    </div>

                    {/* meta adicional si viene del endpoint público */}
                    {(c.organizer?.name || typeof c.totalClaims === 'number') && (
                      <div className="mt-2 flex items-center justify-between text-xs text-white/70">
                        <span className="truncate">By {c.organizer?.name ?? '—'}</span>
                        {typeof c.totalClaims === 'number' && (
                          <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5">
                            {c.totalClaims} claims
                            {typeof c.claimsRemaining === 'number' && (
                              <> • remaining {Math.max(0, c.claimsRemaining)}</>
                            )}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="mt-4">
                      <span
                        className={cx(
                          'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium',
                          'bg-white/15 border border-white/20'
                        )}
                      >
                        View campaign
                      </span>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

/* ---------- Subcomponentes UI ---------- */

function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
  muted,
}: {
  active?: boolean
  onClick?: () => void
  icon?: React.ReactNode
  label: string
  count?: number
  muted?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        'relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition',
        'ring-1',
        active
          ? 'bg-white text-neutral-900 ring-black/5 shadow-[0_10px_30px_rgba(0,0,0,0.12)]'
          : 'bg-white/10 text-white/85 ring-white/20 hover:bg-white/15',
        muted && !active && 'opacity-75'
      )}
    >
      {icon}
      <span>{label}</span>
      {typeof count === 'number' && (
        <span
          className={cx(
            'rounded-full px-2 py-0.5 text-xs',
            active ? 'bg-neutral-900 text-white' : 'bg-white/20 text-white'
          )}
        >
          {count}
        </span>
      )}
      {active && (
        <span className="pointer-events-none absolute inset-0 rounded-full [mask-image:linear-gradient(to_bottom,white,transparent_60%)] bg-white/35" />
      )}
    </button>
  )
}

function GridSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-[300px] animate-pulse rounded-3xl border border-white/15 bg-white/10"
        />
      ))}
    </div>
  )
}

function EmptyState({ q }: { q?: string }) {
  return (
    <div className="mx-auto max-w-md rounded-3xl border border-white/15 bg-white/10 p-8 text-center backdrop-blur-xl">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-white/10">
        <Search className="h-6 w-6 text-white/80" />
      </div>
      <h3 className="mt-4 text-xl font-semibold">No results</h3>
      <p className="mt-1 text-white/80">
        {q ? (
          <>
            We didn’t find campaigns matching <span className="font-semibold">“{q}”</span>.
          </>
        ) : (
          'There are no active campaigns for now.'
        )}
      </p>
    </div>
  )
}

function safeDate(d: string) {
  const date = new Date(d)
  return isNaN(date.getTime()) ? 'Date to be defined' : date.toLocaleDateString()
}
