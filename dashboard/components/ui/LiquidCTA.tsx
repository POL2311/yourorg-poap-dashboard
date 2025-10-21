'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'

export function LiquidCTA({
  title = 'Bring your ideas to life',
  subtitle = 'base44.com',
  href = '/register',
  logoSrc,
  action = 'Comienza ahora',
}: {
  title?: string
  subtitle?: string
  href?: string
  logoSrc?: string
  action?: string
}) {
  return (
    <div className="liquid-overlay mx-auto flex w-full max-w-2xl items-center gap-3 px-4 py-3">
      {/* Logo redondo */}
      <div className="liquid-chip overflow-hidden">
        {logoSrc ? (
          <Image src={logoSrc} alt="logo" width={24} height={24} className="rounded-full" />
        ) : (
          <span className="text-sm font-bold">◎</span>
        )}
      </div>

      {/* Texto */}
      <div className="flex-1">
        <div className="text-[15px] font-semibold text-white">{title}</div>
        <div className="text-xs text-white/80">{subtitle}</div>
      </div>

      {/* Botón gel blanco */}
      <Link href={href} className="liquid-cta whitespace-nowrap">
        {action}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Link>
    </div>
  )
}
