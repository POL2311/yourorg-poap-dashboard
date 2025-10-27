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

/* ------- subcomponentes ------- */
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
        <CardDescription className="text-white/80">{highlight ? 'Más popular' : 'Empieza cuando quieras'}</CardDescription>
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
            Empezar
          </Button>
        </Link>
      </CardContent>
    </div>
  )
}

/* ------- página ------- */
export default function HomePage() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated) router.push('/dashboard')
  }, [isAuthenticated, router])

  if (isAuthenticated) return null

  return (
    // FONDO: gradiente “liquid” general
    <div
      className="min-h-screen text-white"
      style={{
        background: 'linear-gradient(160deg,#4a5a83 0%, #4b5577 40%, #66597c 100%)',
      }}
    >
      {/* Navbar pill estilo Abstract */}
      <LiquidNavbar />

      {/* HERO (un poco más de padding arriba por el navbar sticky) */}
      <section className="container mx-auto px-4 pt-16 pb-10">
        <div className="mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-4 bg-white/10 text-white border-white/20 backdrop-blur">
            First Platform of Poap on SOLANA
          </Badge>

        </div>

        {/* Panel del hero, sin “caja” central; sólo controles y CTAs */}
<div className="relative mx-auto mt-10 w-full max-w-6xl">
  <div className="liquid-panel relative h-[250px] w-full overflow-hidden p-5 md:p-7">
    {/* Fondo/efectos irían aquí con z-index menor si los usas */}
    <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-3 text-center">
      <h1 className="text-4xl md:text-5xl font-semibold leading-tight">
        First POAP Platform <br />
        <span className="text-indigo-300">on Solana</span>
      </h1>

      <p className="mx-auto max-w-2xl text-lg text-white/85">
        Crea campañas y permite reclamar sin gas. Velocidad, escala y una UI líquida.
      </p>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        {/* Tus CTAs */}
        <Link href="/market">
            <Button variant="secondary">Gallery of Poaps</Button>
        </Link>
      </div>
    </div>
  </div>
</div>

      </section>

      {/* Social proof */}
      <section className="container mx-auto px-4 pb-6">
        <div className="flex items-center justify-center gap-8 opacity-70 text-xs">
          <span>Usado por</span>
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
          <h2 className="text-3xl font-semibold">¿Cómo funciona?</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <GlassCard
            icon={<Sparkles className="h-10 w-10 text-indigo-300" />}
            title="Crea una campaña"
            desc="Define arte, supply, fecha y reglas de reclamo."
          />
          <GlassCard
            icon={<QrCode className="h-10 w-10 text-purple-300" />}
            title="Comparte QR / link"
            desc="Colócalo en tu evento o compártelo con tu comunidad."
          />
          <GlassCard
            icon={<Gauge className="h-10 w-10 text-emerald-300" />}
            title="Reclamo sin gas + analytics"
            desc="Tus asistentes reclaman sin gas; tú ves todo en tiempo real."
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
                <h3 className="text-2xl font-semibold">Prueba un POAP demo</h3>
                <p className="text-white/85 mt-1">Escanea o abre el link y reclama un cNFT de muestra.</p>
                <div className="mt-4 flex gap-3">
                  <Link href="/dashboard" className="btn-soft">Abrir demo</Link>
                  <Link href="/market" className="btn-soft">Ver campañas</Link>
                </div>
              </div>
            </div>
          </div>

          <GlassCard
            icon={<Shield className="h-10 w-10 text-green-300" />}
            title="Gasless Minting"
            desc="Cubrimos el gas con relayers y límites anti-abuso. Soporte cNFT (Helius/DAS)."
            compact
          />
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-12">
        <div className="text-center mb-8">
<h2 className="text-3xl font-semibold tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,.35)]">
  Todo lo que necesitas
</h2>
        </div>
  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          <LiquidFeature icon={<Users className="h-9 w-9 text-purple-300" />} title="Multi-tenant" desc="Espacios por organizador con roles y API keys." />
          <LiquidFeature icon={<Coins className="h-9 w-9 text-yellow-300" />} title="Analytics en vivo" desc="Claims, usuarios únicos, tasa de éxito." />
          <LiquidFeature icon={<CheckCircle className="h-9 w-9 text-sky-300" />} title="Embeds & Widgets" desc="Agrega el reclamo a tu web con un snippet." />
          <LiquidFeature icon={<Shield className="h-9 w-9 text-emerald-300" />} title="Escalable y seguro" desc="Solana mainnet/devnet, mejores prácticas." />
        </div>
      </section>

      {/* Pricing */}
      <section className="container mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-semibold">Precios simples y claros</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <PriceCard
            plan="Free"
            price="$0"
            items={['3 campañas', '100 claims/mes', '2 API keys', 'Analytics básico']}
          />
          <PriceCard
            highlight
            plan="Pro"
            price="$49"
            suffix="/mes"
            items={['50 campañas', '5,000 claims/mes', '10 API keys', 'Analytics avanzado', 'Soporte prioritario']}
          />
          <PriceCard
            plan="Enterprise"
            price="Custom"
            items={['Ilimitado', '50,000+ claims/mes', 'White-label', 'Soporte dedicado']}
          />
        </div>
      </section>

      {/* CTA final */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl p-8 text-center shadow-2xl">
            <h3 className="text-2xl font-semibold">¿Listo para tu primera campaña?</h3>
            <p className="text-white/85 mt-1">Únete como organizador o empieza gratis.</p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <Link href="/login" className="btn-soft">Únete como Organizador</Link>
              <Link href="/register" className="btn-soft">Empezar Gratis</Link>
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
          <div className="text-sm">Built on Solana By SoPoap -! {new Date().getFullYear()}</div>
        </div>
      </footer>
    </div>
  )
}
