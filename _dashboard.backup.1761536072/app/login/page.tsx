'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Zap, Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const { login, isLoading, isAuthenticated, user } = useAuth()
  const router = useRouter()

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectPath =
        user?.role === 'USER'
          ? '/user'
          : user?.role === 'ADMIN'
          ? '/dashboard'
          : '/user'
      router.push(redirectPath)
    }
  }, [isAuthenticated, user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }

    try {
      const result = await login({ email, password })
      if (result.success) {
        const redirectPath = result.redirect || (result.role === 'USER' ? '/user' : '/dashboard')
        router.push(redirectPath)
      } else {
        setError(result.error || 'Login failed')
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    }
  }

  if (isAuthenticated) return null

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-white relative">
      {/* glow background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_0%_0%,#6ee7b7_0%,transparent_60%),radial-gradient(900px_600px_at_100%_20%,#a78bfa_0%,transparent_55%)] opacity-[0.18]" />
      </div>

      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Brand + heading */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-white/90">
            <Zap className="h-6 w-6 text-emerald-300" />
            <span className="text-lg font-semibold tracking-tight">SoPoap</span>
          </div>
          <h1 className="mt-3 text-2xl font-semibold">Welcome back</h1>
          <p className="text-sm text-white/70">Sign in to your account</p>
        </div>

        {/* Glass card */}
        <Card className="mx-auto mt-8 w-full max-w-md rounded-3xl border-white/10 bg-white/5 backdrop-blur-2xl shadow-[0_20px_60px_-30px_rgba(0,0,0,.7)]">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/80">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-white/50" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 border-white/10 bg-white/5 text-white placeholder:text-white/30"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/80">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-white/50" />
                  <Input
                    id="password"
                    type={show ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 border-white/10 bg-white/5 text-white placeholder:text-white/30"
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    className="absolute right-3 top-2.5 text-white/60 hover:text-white"
                    aria-label="Toggle password visibility"
                  >
                    {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full border border-emerald-400/30 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/25"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>

              <p className="text-center text-sm text-white/70">
                Don’t have an account?{' '}
                <Link href="/register" className="text-white hover:opacity-90 underline underline-offset-4">
                  Sign up
                </Link>
              </p>
            </form>
            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">Testear app con: </p>
              <p className="text-xs text-gray-600">
                Email: demo@poap-infra.com<br />
                Password: demo123
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mx-auto mt-6 max-w-md text-center">
          <Link href="/public" className="text-sm text-white/60 hover:text-white">← Back to home</Link>
        </div>
      </div>
    </div>
  )
}
