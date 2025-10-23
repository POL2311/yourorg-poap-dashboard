// app/dashboard/layout.tsx
'use client'
import React from 'react'
import AppShell from '@/components/shell/AppShell'
// puedes envolver en el layout (opcional)
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

function Guard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/login')
  }, [isLoading, isAuthenticated, router])
  if (isLoading) return null
  return <>{children}</>
}

// y en el layout:
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <Guard>{children}</Guard>
    </AppShell>
  )
}
