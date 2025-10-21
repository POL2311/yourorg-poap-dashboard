'use client'

import Link from 'next/link'
import { FC } from 'react'

export const LiquidNavbar: FC = () => {
  return (
    <div className="sticky top-4 z-50">
      <div
        className="
          mx-auto w-full max-w-5xl
          rounded-full bg-white/95 backdrop-blur-xl
          ring-1 ring-black/5 shadow-[0_10px_40px_rgba(0,0,0,0.08)]
          px-3 py-2
        "
      >
        <div className="flex items-center justify-between gap-2">
          {/* Logo + links */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="grid h-10 w-10 place-items-center rounded-full bg-black/5 text-black/80"
              aria-label="Home"
            >
              {/* reemplaza por tu SVG si quieres */}
              <span className="text-lg">※</span>
            </Link>

            <nav className="hidden md:flex items-center gap-8 text-[15px] text-neutral-500">
              <Link className="hover:text-neutral-800 transition" href="/docs">
                Discover
              </Link>
              <Link className="hover:text-neutral-800 transition" href="/bridge">
                Explore
              </Link>
              <Link className="hover:text-neutral-800 transition" href="/explorer">
                Docs
              </Link>
            </nav>
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-3">
            {/* Verde degradado */}
            <Link
              href="/dashboard"
              className="
                rounded-full px-5 py-2.5 text-[12px] font-semibold text-gray-900
                bg-gradient-to-r from-emerald-300 via-emerald-400 to-emerald-600
                shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_8px_24px_rgba(16,185,129,0.35)]
                ring-1 ring-emerald-500/30 hover:brightness-[1.03] active:translate-y-[0.5px]
                transition
              "
            >
              Create your SoPoap
            </Link>

            {/* Botón dark */}
            <Link
              href="/login"
              className="
                rounded-full px-5 py-2.5 text-[12px] font-semibold text-white
                bg-neutral-900
                shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_24px_rgba(0,0,0,0.35)]
                ring-1 ring-black/10 hover:bg-neutral-800 active:translate-y-[0.5px]
                transition
              "
            >
              Log in
            </Link>
            {/* Botón dark */}
            <Link
              href="/register"
              className="
                rounded-full px-5 py-2.5 text-[12px] font-semibold text-white
                bg-neutral-900
                shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_24px_rgba(0,0,0,0.35)]
                ring-1 ring-black/10 hover:bg-neutral-800 active:translate-y-[0.5px]
                transition
              "
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
export default LiquidNavbar
