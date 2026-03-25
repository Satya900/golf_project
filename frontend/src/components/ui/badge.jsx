import * as React from "react"
import { cn } from "@/lib/utils"

function Badge({ className, variant = "default", ...props }) {
  const variants = {
    default: "bg-orange-100 text-orange-700 border-orange-200",
    secondary: "bg-stone-100 text-stone-700 border-stone-200",
    success: "bg-emerald-100 text-emerald-700 border-emerald-200",
    warning: "bg-amber-100 text-amber-700 border-amber-200",
    destructive: "bg-red-100 text-red-700 border-red-200",
    outline: "bg-transparent text-stone-700 border-stone-300",
  }
  return (
    <span className={cn("inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-semibold transition-colors", variants[variant], className)} {...props} />
  )
}

export { Badge }
