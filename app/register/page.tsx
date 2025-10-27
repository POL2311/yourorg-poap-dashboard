'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Zap, Mail, Lock, User, Building, Loader2, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    company: '',
    password: '',
    confirmPassword: '',
  })
  const [show1, setShow1] = useState(false)
  const [show2, setShow2] = useState(false)
  const [error, setError] = useState('')
  const { register, user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectPath = user.role === 'USER' ? '/user' : user.role === 'ADMIN' ? '/dashboard' : '/user'
      router.push(redirectPath)
    }
  }, [isAuthenticated, user, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.email || !formData.name || !formData.password) {
      setError('Please fill in all required fields')
      return
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    const result = await register({
      email: formData.email,
      name: formData.name,
      company: formData.company || undefined,
      password: formData.password,
    })

    if (result.success) {
      const redirectPath = result.redirect || (result.role === 'USER' ? '/user' : '/dashboard')
      setTimeout(() => router.push(redirectPath), 800)
    } else {
      setError(result.error || 'Registration failed')
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
          <h1 className="mt-3 text-2xl font-semibold">Create your account</h1>
          <p className="text-sm text-white/70">Start managing or claiming campaigns</p>
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
                <Label htmlFor="email" className="text-white/80">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-white/50" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10 border-white/10 bg-white/5 text-white placeholder:text-white/30"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white/80">Full Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-white/50" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleChange}
                    className="pl-10 border-white/10 bg-white/5 text-white placeholder:text-white/30"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              {/* Company (optional) */}
              <div className="space-y-2">
                <Label htmlFor="company" className="text-white/80">Company (Optional)</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 h-4 w-4 text-white/50" />
                  <Input
                    id="company"
                    name="company"
                    type="text"
                    placeholder="Your Company"
                    value={formData.company}
                    onChange={handleChange}
                    className="pl-10 border-white/10 bg-white/5 text-white placeholder:text-white/30"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/80">Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-white/50" />
                  <Input
                    id="password"
                    name="password"
                    type={show1 ? 'text' : 'password'}
                    placeholder="At least 6 characters"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10 pr-10 border-white/10 bg-white/5 text-white placeholder:text-white/30"
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShow1(s => !s)}
                    className="absolute right-3 top-2.5 text-white/60 hover:text-white"
                  >
                    {show1 ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white/80">Confirm Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-white/50" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={show2 ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pl-10 pr-10 border-white/10 bg-white/5 text-white placeholder:text-white/30"
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShow2(s => !s)}
                    className="absolute right-3 top-2.5 text-white/60 hover:text-white"
                  >
                    {show2 ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
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
                    Creating account…
                  </>
                ) : (
                  'Create account'
                )}
              </Button>

              <p className="text-center text-sm text-white/70">
                Already have an account?{' '}
                <Link href="/login" className="text-white hover:opacity-90 underline underline-offset-4">
                  Sign in
                </Link>
              </p>

              <p className="text-center text-xs text-white/50">
                By creating an account, you agree to our{' '}
                <a href="#" className="underline underline-offset-4 hover:text-white">Terms of Service</a>{' '}
                and{' '}
                <a href="#" className="underline underline-offset-4 hover:text-white">Privacy Policy</a>.
              </p>
            </form>
          </CardContent>
        </Card>

        <div className="mx-auto mt-6 max-w-md text-center">
          <Link href="/public" className="text-sm text-white/60 hover:text-white">← Back to home</Link>
        </div>
      </div>
    </div>
  )
}
