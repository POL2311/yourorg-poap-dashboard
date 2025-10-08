// lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ===== Helpers de fecha =====

// Acepta: Date | string (ej. "2025-11-09T21:43" de <input type="datetime-local">)
// Devuelve: ISO-8601 en UTC (ej. "2025-11-09T21:43:00.000Z")
export function toISO(value?: string | Date | null): string | undefined {
  if (!value) return undefined
  const d = new Date(value)
  if (isNaN(d.getTime())) return undefined
  return d.toISOString()
}

// Convierte ISO -> valor aceptado por <input type="datetime-local">
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

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date))
}

export function formatNumber(num: number) {
  return new Intl.NumberFormat("en-US").format(num)
}

export function formatSOL(lamports: number) {
  return (lamports / 1e9).toFixed(4) + " SOL"
}

export function truncateAddress(address: string, chars = 4) {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}
