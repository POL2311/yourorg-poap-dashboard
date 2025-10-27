// components/shell/Topbar.tsx
'use client'
import { Bell, Plus } from 'lucide-react'
import Link from 'next/link'

export default function Topbar() {
  return (
    <div className="glass px-4 py-3 flex items-center justify-between">
      <div className="font-semibold">Dashboard</div>
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/campaigns/new"
          className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 hover:bg-white/15"
        >
          <span className="inline-flex items-center gap-2"><Plus className="h-4 w-4" /> New Campaign</span>
        </Link>
        <button className="grid h-9 w-9 place-items-center rounded-xl border border-white/20 bg-white/10">
          <Bell className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
