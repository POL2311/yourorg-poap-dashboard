'use client'

import LiquidSidebar from './LiquidSidebar'
import React from 'react'
import Topbar from './Topbar'

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen text-white"
      style={{
        background: 'linear-gradient(160deg,#4a5a83 0%, #4b5577 40%, #66597c 100%)',
      }}
    >
      <div className="mx-auto max-w-7xl px-4 py-4">
        <div className="flex gap-6">
          <LiquidSidebar />
          <main className="flex-1">
            <Topbar />
             <div className="mt-6">{children}</div>
        </main>
        </div>
      </div>
    </div>
  )
}
