import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"
import { Loader2 } from "lucide-react"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 outline-none select-none focus-visible:ring-2 focus-visible:ring-[#1A2C4C]/20 disabled:pointer-events-none disabled:opacity-50 cursor-pointer shadow-sm active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[#1A2C4C] text-white hover:bg-[#1A2C4C]/90 shadow-slate-900/10",
        destructive:
          "bg-rose-500 text-white hover:bg-rose-600 shadow-rose-500/20",
        outline:
          "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700",
        secondary:
          "bg-slate-100 text-slate-800 hover:bg-slate-200/80",
        ghost:
          "hover:bg-slate-100 text-slate-700 shadow-none",
        link:
          "text-[#1A2C4C] underline-offset-4 hover:underline shadow-none",
        glass:
          "glass text-slate-800 hover:bg-white/80 border-white/50",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs rounded-lg",
        lg: "h-11 px-6 text-base rounded-xl",
        icon: "h-10 w-10 p-0 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  loading = false,
  icon: Icon,
  children,
  disabled,
  ...props
}) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-current" />
      ) : Icon ? (
        <Icon className="h-4 w-4 shrink-0" />
      ) : null}
      {children}
    </Comp>
  )
}

export default Button
export { Button, buttonVariants }
