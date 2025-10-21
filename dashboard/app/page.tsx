'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Zap, ArrowRight, QrCode, Shield, Gauge, Users, Coins, Sparkles, CheckCircle
} from 'lucide-react'
import { LiquidCTA } from '@/components/ui/LiquidCTA'
function LiquidFeature({
  icon, title, desc,
}: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="liquid-surface p-6">
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl border border-white/20 bg-white/15 text-white/90">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-1 text-sm text-white/80">{desc}</p>
    </div>
  )
}

export default function HomePage() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated) router.push('/dashboard')
  }, [isAuthenticated, router])

  if (isAuthenticated) return null

  return (
    <div
      className="min-h-screen text-white"
      style={{
        background:
      'radial-gradient(1200px 400px at 10% -10%, rgba(132, 134, 236, 0.83), transparent), radial-gradient(900px 300px at 90% 0%, rgba(168,85,247,0.22), transparent), linear-gradient(180deg,#191c24,#0f131a 55%,#0e1419)',
      }}
    >
      {/* Header (glass) */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-white/10 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-white/10 border border-white/20">
              <Zap className="h-4 w-4" />
            </div>
            <span className="text-base font-semibold">Gasless infrastructure</span>
          </Link>
          <nav className="hidden md:flex items-center gap-5 text-sm text-white/80">
            <Link href="/explore" className="hover:text-white">Explorar</Link>
            <Link href="/docs" className="hover:text-white">Docs</Link>
            <Link href="/pricing" className="hover:text-white">Precios</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login"><Button variant="ghost" className="rounded-full">Login</Button></Link>
            <Link href="/register"><Button className="rounded-full border border-white/20 bg-white/15 hover:bg-white/25">Get Started</Button></Link>
          </div>
        </div>
      </header>

      {/* Hero (glass panel) */}
{/* HERO */}
<section className="container mx-auto px-4 pt-14 pb-16">
  <div className="mx-auto max-w-4xl text-center">
    <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm text-white/80 backdrop-blur">
      🚀 Multi-Tenant SaaS Platform
    </span>

    <h1 className="mt-4 text-5xl font-semibold leading-tight text-white">
      Gasless POAP Platform <br />
      <span className="text-indigo-300">on Solana</span>
    </h1>
    <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
      Crea campañas y permite reclamar sin gas. Velocidad, escala y una UI líquida.
    </p>

    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
      <Link href="/register" className="liquid-cta px-7 py-3">Empezar Gratis</Link>
      <Link href="/login" className="liquid-cta px-7 py-3 bg-white/90">Login al Dashboard</Link>
      <Link
        href="/organize"
        className="rounded-full border border-white/20 bg-white/12 px-6 py-3 text-white backdrop-blur hover:bg-white/20"
      >
        Únete como Organizador
      </Link>
    </div>
  </div>

  {/* Demo visual “liquid” con overlay pegado abajo (como el anuncio) */}
  <div className="relative mx-auto mt-10 w-full max-w-5xl">
    {/* Cartela/Mock de app con estilo líquido */}
    <div className="liquid-surface overflow-hidden p-0">
      {/* Fondo lila tipo Base44 */}
      <div className="relative h-[360px] w-full bg-gradient-to-br from-indigo-400/40 via-indigo-300/30 to-purple-300/40">
        {/* Controles de demo (placeholders) */}
        <div className="absolute left-6 top-6">
          <button className="rounded-xl border border-white/30 bg-white/20 px-4 py-1.5 text-white/90 backdrop-blur">
            Save
          </button>
        </div>
        <div className="absolute right-6 top-6 flex gap-2 text-white/80">
          <div className="grid h-9 w-9 place-items-center rounded-full border border-white/30 bg-white/20 backdrop-blur">＋</div>
          <div className="grid h-9 w-9 place-items-center rounded-full border border-white/30 bg-white/20 backdrop-blur">↺</div>
        </div>

        {/* Personaje/ilustración placeholder */}
        <div className="absolute inset-0 grid place-items-center">
          <div className="h-40 w-40 rounded-3xl bg-white/40 backdrop-blur-xl shadow-xl" />
        </div>
      </div>
    </div>

  </div>
  </section>


      {/* Social proof (sutil) */}
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

      {/* How it works (glass cards) */}
      <section className="container mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-semibold">¿Cómo funciona?</h2>
          <p className="text-white/70">Listo en 3 pasos</p>
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

      {/* Demo claim (probar ya) */}
      <section className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-[1.2fr_.8fr] gap-6 items-center">
          <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl p-6 shadow-xl">
            <div className="flex items-start gap-5">
              <div className="h-28 w-28 rounded-2xl bg-white/10 border border-white/20 grid place-items-center">
                <QrCode className="h-10 w-10 text-white/80" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-semibold">Prueba un POAP demo</h3>
                <p className="text-white/80 mt-1">Escanea o abre el link y reclama un cNFT de muestra.</p>
                <div className="mt-4 flex gap-3">
                  <Link href="/claim/demo">
                    <Button className="rounded-full bg-indigo-500 hover:bg-indigo-600">
                      Abrir demo
                    </Button>
                  </Link>
                  <Link href="/explore">
                    <Button variant="outline" className="rounded-full border-white/25 text-white hover:bg-white/10">
                      Ver campañas
                    </Button>
                  </Link>
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

      {/* Features (compact, glass) */}
      <section className="container mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-semibold">Todo lo que necesitas</h2>
          <p className="text-white/70">Herramientas pro para organizadores y fans</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <LiquidFeature icon={<Users className="h-9 w-9 text-purple-300" />} title="Multi-tenant" desc="Espacios por organizador con roles y API keys." />
          <LiquidFeature icon={<Coins className="h-9 w-9 text-yellow-300" />} title="Analytics en vivo" desc="Claims, usuarios únicos, tasa de éxito." />
          <LiquidFeature icon={<CheckCircle className="h-9 w-9 text-sky-300" />} title="Embeds & Widgets" desc="Agrega el reclamo a tu web con un snippet." />
          <LiquidFeature icon={<Shield className="h-9 w-9 text-emerald-300" />} title="Escalable y seguro" desc="Solana mainnet/devnet, mejores prácticas." />
        </div>
      </section>

      {/* Pricing (tu contenido, estilo glass) */}
      <section className="container mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-semibold">Precios simples y claros</h2>
          <p className="text-white/70">Empieza gratis, escala a tu ritmo</p>
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
            <p className="text-white/80 mt-1">Únete como organizador o empieza gratis.</p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <Link href="/organize">
                <Button size="lg" variant="secondary" className="rounded-full bg-white/20 border-white/25 hover:bg-white/30">
                  Únete como Organizador
                </Button>
              </Link>
              <Link href="/register">
                <Button size="lg" className="rounded-full bg-indigo-500 hover:bg-indigo-600">
                  Empezar Gratis
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer (glass) */}
      <footer className="border-t border-white/10 bg-white/10 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-white/80">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            <span className="font-medium">Gasless infrastructure</span>
          </div>
          <div className="text-sm">Built on Solana • cNFT ready • © {new Date().getFullYear()}</div>
        </div>
      </footer>
    </div>
  )
}

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
