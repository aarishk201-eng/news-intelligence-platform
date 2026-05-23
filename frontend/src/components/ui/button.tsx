import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium'
    + ' transition-[background-color,border-color,color,box-shadow,transform] duration-200'
    + ' focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
    + ' disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-b from-primary/95 to-primary/70 text-primary-foreground shadow-premium hover:shadow-premium-lg',
        destructive:
          'bg-destructive text-destructive-foreground shadow-premium hover:shadow-premium-lg',
        outline:
          'border border-border/70 bg-background/25 backdrop-blur-md text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'
          + ' hover:bg-background/40',
        secondary:
          'bg-secondary/70 text-secondary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:bg-secondary/85',
        ghost:
          'text-foreground/80 hover:bg-foreground/5 hover:text-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-lg px-3 text-xs',
        lg: 'h-10 rounded-xl px-8',
        icon: 'h-9 w-9 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
