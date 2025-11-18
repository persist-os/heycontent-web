import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90 dark:text-black",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        icon: "hover:bg-accent hover:text-accent-foreground",
        copy: "hover:bg-accent hover:text-accent-foreground",
        'create-note': "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        'enhanced-help': "hover:bg-accent hover:text-accent-foreground",
        'help-icon': "hover:bg-accent hover:text-accent-foreground",
        input: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        'google-signin': "bg-background border border-input shadow-sm hover:bg-accent",
        back: "hover:bg-accent hover:text-accent-foreground",
        'ideas-action': "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        'panel-expand': "hover:bg-accent hover:text-accent-foreground",
        'floating-action': "bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 rounded-full",
        suggestion: "hover:bg-accent hover:text-accent-foreground",
        'delete-account': "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
      },
      size: {
        sm: "h-8 md:h-8 rounded-md px-3 text-xs min-h-[44px] md:min-h-0",
        md: "h-9 md:h-9 px-4 py-2 min-h-[44px] md:min-h-0",
        lg: "h-10 md:h-10 rounded-md px-8 min-h-[44px] md:min-h-0",
        icon: "h-9 w-9 md:h-9 md:w-9 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  className?: string
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
