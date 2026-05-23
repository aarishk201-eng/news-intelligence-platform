import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-xl border border-input/80 bg-background/20 px-3 py-1 text-sm"
            + " shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-md transition-colors"
            + " file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground"
            + " focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
            + " disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
