import * as React from "react"

import { cn } from "../../lib/utils"

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

const Card = ({ className, ...props }: CardProps) => (
  <div
    className={cn(
      "rounded-xl border bg-card text-card-foreground shadow",
      className
    )}
    {...props}
  />
)
Card.displayName = "Card"

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

const CardHeader = ({ className, ...props }: CardHeaderProps) => (
  <div
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
)
CardHeader.displayName = "CardHeader"

interface CardTitleProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

const CardTitle = ({ className, ...props }: CardTitleProps) => (
  <div
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props}
  />
)
CardTitle.displayName = "CardTitle"

interface CardDescriptionProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

const CardDescription = ({ className, ...props }: CardDescriptionProps) => (
  <div
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
)
CardDescription.displayName = "CardDescription"

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

const CardContent = ({ className, ...props }: CardContentProps) => (
  <div className={cn("p-6 pt-0", className)} {...props} />
)
CardContent.displayName = "CardContent"

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

const CardFooter = ({ className, ...props }: CardFooterProps) => (
  <div
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
)
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
