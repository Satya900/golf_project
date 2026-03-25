import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "rounded-full bg-orange-600 text-white hover:bg-orange-700 active:scale-95 transition-all",
        secondary: "rounded-full bg-stone-100 text-stone-900 hover:bg-stone-200 border border-stone-200 transition-all",
        outline: "rounded-full border border-stone-300 bg-transparent hover:bg-stone-50 text-stone-700 transition-all",
        ghost: "hover:bg-stone-100 text-stone-700 rounded-lg transition-colors",
        destructive: "rounded-full bg-red-600 text-white hover:bg-red-700 transition-all",
        link: "text-orange-600 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-6 py-2",
        sm: "h-8 px-4 text-xs",
        lg: "h-12 px-8 text-base",
        xl: "h-14 px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  )
})
Button.displayName = "Button"

export { Button, buttonVariants }
