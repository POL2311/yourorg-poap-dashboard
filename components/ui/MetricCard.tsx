// components/ui/MetricCard.tsx
import { cn } from '@/lib/utils'

export function MetricCard({
  label, value, hint, icon, className,
}: { label:string; value:React.ReactNode; hint?:string; icon?:React.ReactNode; className?:string }) {
  return (
    <div className={cn('glass p-4', className)}>
      <div className="flex items-center justify-between">
        <div className="text-sm text-white/70">{label}</div>
        {icon}
      </div>
      <div className="mt-2 text-3xl font-semibold">{value}</div>
      {hint && <div className="mt-1 text-xs text-white/70">{hint}</div>}
    </div>
  )
}
