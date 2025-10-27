'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FC, useMemo } from 'react'
import { Sparkles } from 'lucide-react'

type NavItem = { href: string; label: string }

const nav: NavItem[] = [{ href: '/market', label: 'Gallery' }]

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

const MarketNavbar: FC = () => {
  // ✅ evita null en tipos antiguos
  const pathname = usePathname() ?? ''

  const active = useMemo(() => {
    if (!pathname) return ''
    const found = nav.find(n => pathname.startsWith(n.href))
    return found?.href ?? ''
  }, [pathname])

  return (
    <div className="sticky top-4 z-50">
      <div className="relative mx-auto w-full max-w-6xl px-3">
        <div
          className={[
            'relative rounded-full bg-white/90 backdrop-blur-xl ring-1 ring-black/5',
            'shadow-[0_10px_40px_rgba(0,0,0,0.10)]',
            "before:absolute before:inset-0 before:-z-10 before:rounded-[999px] before:content-['']",
            'before:bg-[radial-gradient(1200px_300px_at_20%_-40%,rgba(52,211,153,.30),transparent),radial-gradient(1200px_300px_at_80%_140%,rgba(59,130,246,.25),transparent)]',
            "after:absolute after:inset-0 after:-z-10 after:rounded-[999px] after:content-[''] after:blur-xl after:bg-gradient-to-r after:from-emerald-400/25 after:via-cyan-400/20 after:to-indigo-400/25",
          ].join(' ')}
        >
          <div className="flex items-center justify-between gap-2 px-3 py-2">
            {/* Logo + links */}
            <div className="flex min-w-0 items-center gap-6">
              <Link
                href="/public"
                aria-label="Home"
                className={cx(
                  'relative grid h-10 w-10 place-items-center rounded-full',
                  'bg-neutral-900 text-white ring-1 ring-black/10',
                  'shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_8px_24px_rgba(0,0,0,0.35)]'
                )}
              >
                <Sparkles className="h-5 w-5 opacity-90" />
                <span
                  className={cx(
                    'pointer-events-none absolute inset-0 rounded-full',
                    'bg-[radial-gradient(120%_80%_at_30%_0%,rgba(255,255,255,.25),rgba(255,255,255,0))]'
                  )}
                />
              </Link>

              <nav className="hidden md:flex items-center gap-2 text-[15px]">
                {nav.map((item) => {
                  const isActive = active === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cx(
                        'relative px-3 py-2 rounded-full transition',
                        'text-neutral-600 hover:text-neutral-900',
                        isActive && 'text-neutral-900'
                      )}
                    >
                      <span>{item.label}</span>
                      <span
                        className={cx(
                          'pointer-events-none absolute left-1/2 -translate-x-1/2 -bottom-[2px] h-[10px] w-[60%] rounded-full transition-all duration-300',
                          isActive
                            ? 'opacity-100 blur-[3px] bg-gradient-to-r from-emerald-400/60 via-cyan-400/50 to-indigo-400/60'
                            : 'opacity-0'
                        )}
                      />
                    </Link>
                  )
                })}
              </nav>
            </div>

            {/* CTAs */}
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className={cx(
                  'relative rounded-full px-5 py-2.5 text-[12px] font-semibold text-gray-900',
                  'bg-gradient-to-r from-emerald-300 via-emerald-400 to-emerald-600',
                  'ring-1 ring-emerald-500/30 transition will-change-transform',
                  'shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_8px_24px_rgba(16,185,129,0.35)]',
                  'hover:brightness-[1.03] active:translate-y-[0.5px]'
                )}
              >
                Create your SoPoap
                <span className="pointer-events-none absolute inset-0 rounded-full [mask-image:linear-gradient(to_bottom,white,transparent_55%)] bg-white/30" />
              </Link>

              <Link
                href="/user"
                className={cx(
                  'relative rounded-full px-5 py-2.5 text-[12px] font-semibold text-white',
                  'bg-neutral-900 ring-1 ring-black/10 transition will-change-transform',
                  'shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_8px_24px_rgba(0,0,0,0.35)]',
                  'hover:bg-neutral-800 active:translate-y-[0.5px]'
                )}
              >
                Profile
                <span className="pointer-events-none absolute inset-0 rounded-full [mask-image:linear-gradient(to_bottom,white,transparent_60%)] bg-white/15" />
              </Link>
            </div>
          </div>
        </div>

        <div className="pointer-events-none mx-auto mt-2 h-3 w-[60%] rounded-full bg-black/20 blur-2xl opacity-35" />
      </div>
    </div>
  )
}

export default MarketNavbar
