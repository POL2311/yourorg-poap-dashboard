import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors " +
  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        // Glass base
        default:    "border-white/20 bg-white/10 text-white hover:bg-white/15",
        secondary:  "border-white/15 bg-white/5  text-white hover:bg-white/10",
        outline:    "text-white border-white/25",

        // Estados
        destructive:"border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",

        // Custom (dashboard)
        success:    "border-emerald-400/30 bg-emerald-500/20 text-emerald-200",
        warning:    "border-yellow-400/30  bg-yellow-500/20  text-yellow-200",

        // Badges de rareza (si los usas en Badges)
        common:     "border-white/10 bg-white/5 text-white/80",
        uncommon:   "border-emerald-400/30 bg-emerald-500/20 text-emerald-100",
        rare:       "border-sky-400/30     bg-sky-500/20     text-sky-100",
        epic:       "border-purple-400/30  bg-purple-500/20  text-purple-100",
        legendary:  "border-amber-400/30   bg-amber-500/20   text-amber-100",
        mythic:     "border-pink-400/30    bg-pink-500/20    text-pink-100",
        locked:     "border-white/10 bg-white/5 text-white/50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
