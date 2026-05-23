import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold'
    + ' transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0',
  {
    variants: {
      variant: {
        default:
          'border-primary/18 bg-primary/10 text-primary hover:bg-primary/15',
        secondary:
          'border-border/60 bg-secondary/50 text-secondary-foreground hover:bg-secondary/70',
        destructive:
          'border-destructive/25 bg-destructive/10 text-destructive hover:bg-destructive/15',
        outline:
          'border-border/70 bg-background/20 text-foreground',
        positive:
          'border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/15',
        negative:
          'border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/15',
        neutral:
          'border-slate-500/20 bg-slate-500/10 text-slate-300 hover:bg-slate-500/15',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
