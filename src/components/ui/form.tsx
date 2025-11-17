'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const formVariants = cva('', {
  variants: {
    variant: {
      default: 'space-y-4',
      inline: 'flex flex-col md:flex-row gap-4 items-end',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

export interface FormProps
  extends React.HTMLAttributes<HTMLFormElement>,
    VariantProps<typeof formVariants> {
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void
}

/**
 * Form - Base form component with variant system
 * 
 * Features:
 * - 2 variants (default, inline)
 * - Mobile-first responsive design (stacked on mobile, horizontal on desktop for inline)
 * - All four modes supported (Light/Dark + Mobile/Web)
 * - Semantic colors for automatic theme support
 * 
 * @example
 * ```tsx
 * <Form variant="default" onSubmit={handleSubmit}>
 *   <Input placeholder="Name" />
 *   <Button type="submit">Submit</Button>
 * </Form>
 * ```
 */
const Form = React.forwardRef<HTMLFormElement, FormProps>(
  ({ className, variant, onSubmit, children, ...props }, ref) => {
    return (
      <form
        ref={ref}
        className={cn(formVariants({ variant }), className)}
        onSubmit={onSubmit}
        {...props}
      >
        {children}
      </form>
    )
  }
)
Form.displayName = 'Form'

export { Form, formVariants }

