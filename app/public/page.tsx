'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import {
  Zap, ArrowRight, QrCode, Shield, Gauge, Users, Coins, Sparkles, CheckCircle, Plus, RotateCcw
} from 'lucide-react'
import LiquidNavbar from '@/components/ui/LiquidNavbar'

/* ------- Subcomponents ------- */
function GlassCard({
  icon, title, desc, compact,
}: { icon: React.ReactNode; title: string; desc: string; compact?: boolean }) {
  return (
    <div className={`rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-xl ${compact ? 'p-5' : 'p-6'}`}>
      <div className="flex items-start gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-xl border border-white/20 bg-white/10">
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-white/80 mt-1">{desc}</p>
        </div>
      </div>
    </div>
  )
}

function LiquidFeature({
  icon, title, desc,
}: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="liquid-surface p-6">
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl
                      border border-white/25 bg-white/15 shadow-inner">
        {icon}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-white/80 leading-relaxed">{desc}</p>
    </div>
  )
}

function PriceCard({
  plan, price, suffix, items, highlight,
}: {
  plan: string; price: string; suffix?: string; items: string[]; highlight?: boolean
}) {
  return (
    <div className={`rounded-2xl backdrop-blur-xl border shadow-2xl p-6 ${highlight
      ? 'border-indigo-300/40 bg-indigo-400/15'
      : 'border-white/20 bg-white/10'
    }`}>
      <CardHeader className="p-0 mb-4">
        <CardTitle className="text-xl">{plan}</CardTitle>
        <CardDescription className="text-white/80">{highlight ? 'Most popular' : 'Start whenever you want'}</CardDescription>
      </CardHeader>
      <div className="text-4xl font-semibold">{price}{suffix && <span className="text-base font-normal opacity-80"> {suffix}</span>}</div>
      <CardContent className="p-0 mt-4">
        <ul className="space-y-2 text-sm">
          {items.map(i => (
            <li key={i} className="flex items-center">
              <CheckCircle className="h-4 w-4 text-emerald-300 mr-2" /> {i}
            </li>
          ))}
        </ul>
        <Link href="/register">
          <Button className={`mt-5 w-full rounded-full ${highlight ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-white/20 hover:bg-white/30 border border-white/25'}`}>
            Get Started
          </Button>
        </Link>
      </CardContent>
    </div>
  )
}

/* ------- Page ------- */
export default function HomePage() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated) router.push('/dashboard')
  }, [isAuthenticated, router])

  if (isAuthenticated) return null

  return (
    // LIQUID background gradient
    <div
      className="min-h-screen text-white"
      style={{
        background: 'linear-gradient(160deg,#4a5a83 0%, #4b5577 40%, #66597c 100%)',
      }}
    >
      {/* Navbar */}
      <LiquidNavbar />

      {/* HERO */}
      <section className="container mx-auto px-4 pt-16 pb-10">
        <div className="mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-4 bg-white/10 text-white border-white/20 backdrop-blur">
            First POAP Platform on SOLANA
          </Badge>
        </div>

        <div className="relative mx-auto mt-10 w-full max-w-6xl">
          <div className="liquid-panel relative h-[250px] w-full overflow-hidden p-5 md:p-7">
            <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-3 text-center">
              <h1 className="text-4xl md:text-5xl font-semibold leading-tight">
                First POAP Platform <br />
                <span className="text-indigo-300">on Solana</span>
              </h1>

              <p className="mx-auto max-w-2xl text-lg text-white/85">
                Create campaigns and let your community claim gasless. Speed, scale and a liquid UI.
              </p>

              <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
                <Link href="/market">
                  <Button variant="secondary">POAP Gallery</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="container mx-auto px-4 pb-6">
        <div className="flex items-center justify-center gap-8 opacity-70 text-xs">
          <span>Used by</span>
          <div className="flex items-center gap-5">
            <div className="h-5 w-20 rounded bg-white/10 border border-white/15" />
            <div className="h-5 w-20 rounded bg-white/10 border border-white/15" />
            <div className="h-5 w-20 rounded bg-white/10 border border-white/15" />
            <div className="h-5 w-20 rounded bg-white/10 border border-white/15" />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-semibold">How it works</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <GlassCard
            icon={<Sparkles className="h-10 w-10 text-indigo-300" />}
            title="Create a campaign"
            desc="Set artwork, supply, date and claim rules."
          />
          <GlassCard
            icon={<QrCode className="h-10 w-10 text-purple-300" />}
            title="Share QR / link"
            desc="Display it at your event or share it with your community."
          />
          <GlassCard
            icon={<Gauge className="h-10 w-10 text-emerald-300" />}
            title="Gasless claim + analytics"
            desc="Attendees claim without gas; you see everything in real time."
          />
        </div>
      </section>

      {/* Demo claim */}
      <section className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-[1.2fr_.8fr] gap-6 items-center">
          <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl p-6 shadow-xl">
            <div className="flex items-start gap-5">
              <div className="h-28 w-28 rounded-2xl bg-white/10 border border-white/20 grid place-items-center">
                <QrCode className="h-10 w-10 text-white/80" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-semibold">Try a demo POAP</h3>
                <p className="text-white/85 mt-1">Scan or open the link and claim a sample cNFT.</p>
                <div className="mt-4 flex gap-3">
                  <Link href="/dashboard" className="btn-soft">Open demo</Link>
                  <Link href="/market" className="btn-soft">View campaigns</Link>
                </div>
              </div>
            </div>
          </div>

          <GlassCard
            icon={<Shield className="h-10 w-10 text-green-300" />}
            title="Gasless Minting"
            desc="We cover gas with relayers and anti-abuse limits. cNFT support (Helius/DAS)."
            compact
          />
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-semibold tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,.35)]">
            Everything you need
          </h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          <LiquidFeature icon={<Users className="h-9 w-9 text-purple-300" />} title="Multi-tenant" desc="Spaces per organizer with roles and API keys." />
          <LiquidFeature icon={<Coins className="h-9 w-9 text-yellow-300" />} title="Live Analytics" desc="Claims, unique users, success rate." />
          <LiquidFeature icon={<CheckCircle className="h-9 w-9 text-sky-300" />} title="Embeds & Widgets" desc="Add claim widget to your website with a snippet." />
          <LiquidFeature icon={<Shield className="h-9 w-9 text-emerald-300" />} title="Scalable & Secure" desc="Solana mainnet/devnet, best practices." />
        </div>
      </section>

      {/* Pricing */}
      <section className="container mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-semibold">Simple and clear pricing</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <PriceCard
            plan="Free"
            price="$0"
            items={['3 campaigns', '100 claims/month', '2 API keys', 'Basic analytics']}
          />
          <PriceCard
            highlight
            plan="Pro"
            price="$49"
            suffix="/month"
            items={['50 campaigns', '5,000 claims/month', '10 API keys', 'Advanced analytics', 'Priority support']}
          />
          <PriceCard
            plan="Enterprise"
            price="Custom"
            items={['Unlimited', '50,000+ claims/month', 'White-label', 'Dedicated support']}
          />
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl p-8 text-center shadow-2xl">
            <h3 className="text-2xl font-semibold">Ready for your first campaign?</h3>
            <p className="text-white/85 mt-1">Join as an organizer or get started for free.</p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <Link href="/login" className="btn-soft">Join as Organizer</Link>
              <Link href="/register" className="btn-soft">Get Started Free</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-white/10 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-white/80">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            <span className="font-medium">SoPoap</span>
          </div>
          <div className="text-sm">Built on Solana by SoPoap - {new Date().getFullYear()}</div>
        </div>
      </footer>
    </div>
  )
}
