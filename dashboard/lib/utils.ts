// lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/** Merge de clases Tailwind (shadcn) */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/* =========================
   📅 Helpers de FECHA/HORA
   ========================= */

/**
 * Acepta: Date | string (incl. "2025-11-09T21:43" de <input type="datetime-local">)
 * Devuelve: ISO-8601 en UTC (ej. "2025-11-09T21:43:00.000Z")
 */
export function toISO(value?: string | Date | null): string | undefined {
  if (!value) return undefined
  const d = value instanceof Date ? value : new Date(value)
  if (isNaN(d.getTime())) return undefined
  return d.toISOString()
}

/** Convierte ISO -> valor aceptado por <input type="datetime-local"> */
export function isoToLocalInput(iso?: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  const yyyy = d.getFullYear()
  const mm = pad(d.getMonth() + 1)
  const dd = pad(d.getDate())
  const hh = pad(d.getHours())
  const mi = pad(d.getMinutes())
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
}

/** Solo fecha legible (locale-aware) */
export function formatDate(date: string | Date) {
  const d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) return ""
  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(d)
}

/** Fecha + hora legibles (locale-aware) */
export function formatDateTime(date: string | Date) {
  const d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) return ""
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d)
}

/* =========================
   🔢 Helpers numéricos
   ========================= */

/** Formatea números con separadores de miles */
export function formatNumber(num: number | string) {
  const n = typeof num === "string" ? Number(num) : num
  if (!isFinite(n)) return "0"
  return new Intl.NumberFormat(undefined).format(n)
}

/**
 * Formatea saldo en SOL.
 * Por compatibilidad con tu código anterior, por defecto asume que el input está en **lamports**.
 * Puedes forzar el modo con options.input = 'sol' | 'lamports'.
 *
 * Ejemplos:
 *  formatSOL(1000000000)               -> "1.0000 SOL"      (lamports -> SOL)
 *  formatSOL(1.2345, { input: 'sol' }) -> "1.2345 SOL"
 */
export function formatSOL(
  value: number | string,
  options?: { input?: "lamports" | "sol"; decimals?: number; withUnit?: boolean }
) {
  const input = options?.input ?? "lamports"
  const decimals = options?.decimals ?? 4
  const withUnit = options?.withUnit ?? true

  let sol =
    typeof value === "string" ? Number(value) : value
  if (!isFinite(sol)) sol = 0

  if (input === "lamports") sol = sol / 1e9

  const out = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(sol)

  return withUnit ? `${out} SOL` : out
}

/* =========================
   🧩 Strings útiles
   ========================= */

/** Corta direcciones/llaves: 0x1234…ABCD (configurable) */
export function truncateAddress(address: string, chars = 4) {
  if (!address) return ""
  if (address.length <= chars * 2) return address
  return `${address.slice(0, chars)}...${address.slice(-chars)}`
}

/** Iniciales para avatares a partir de un nombre */
export function getInitials(name: string) {
  if (!name) return "??"
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("") || "??"
}
