import * as React from "react"
import { cn } from "../../lib/utils"

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(({ className, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        "bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2",
        className
      )}
      {...props}
    />
  )
})
Button.displayName = "Button"
export { Button }
