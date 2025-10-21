// components/ui/QuickAction.tsx
import Link from 'next/link'
export function QuickAction({ href, icon, label }: { href:string; icon:React.ReactNode; label:string }) {
  return (
    <Link href={href} className="glass hover:bg-white/15 transition px-3 py-2 rounded-xl flex items-center gap-2">
      {icon}<span className="text-sm">{label}</span>
    </Link>
  )
}
