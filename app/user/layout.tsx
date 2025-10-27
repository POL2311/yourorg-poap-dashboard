// app/user/layout.tsx
'use client'
import React from 'react'
import AppShell from '@/components/shell/AppShell'

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>
}
