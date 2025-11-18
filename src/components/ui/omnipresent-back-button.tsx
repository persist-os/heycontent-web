'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface OmnipresentBackButtonProps {
  onBack?: () => void
  disabled?: boolean
  className?: string
}

/**
 * OmnipresentBackButton - A fixed-position back button that appears on every screen
 * 
 * This component provides a consistent, always-visible back button at the top left
 * of every screen. It automatically hides on home/dashboard root pages.
 * 
 * Features:
 * - Fixed position (top-left corner)
 * - Uses router.back() by default, but can be customized
 * - Automatically hides on root pages
 * - Mobile responsive (touch-friendly 44px minimum)
 * - Matches design system ghost button styling
 * - Accessible (ARIA labels, keyboard navigation)
 */
export function OmnipresentBackButton({
  onBack,
  disabled = false,
  className
}: OmnipresentBackButtonProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Hide on home/dashboard root pages (no back button needed)
  const shouldHide = pathname === '/dashboard' || 
                     pathname === '/dashboard/home' ||
                     pathname === '/' ||
                     pathname === '/dashboard/thinking_lab' // Thinking lab is a main entry point

  if (shouldHide) {
    return null
  }

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      router.back()
    }
  }

  return (
    <div className={cn(
      "fixed top-4 z-[100]", // z-[100] matches hamburger menu, highest priority
      isMobile ? "left-16" : "left-20", // Mobile: 64px (accounts for hamburger), Desktop: 80px (accounts for sidebar)
      className
    )}>
      <Button
        variant="back"
        size="icon"
        onClick={handleBack}
        disabled={disabled}
        className={cn(
          "h-10 w-10 rounded-lg transition-all duration-300",
          "shadow-sm hover:shadow-md",
          "min-h-[44px] min-w-[44px] touch-manipulation",
          // Light mode: Solid dark background for visibility (matches Figma tertiary button in light mode)
          "bg-[#0b1018] dark:bg-transparent",
          "border-2 border-[#9acbff] dark:border-[#9acbff]",
          "text-[#eef1fe] dark:text-[#9acbff]",
          "hover:bg-[#0b1018]/90 dark:hover:bg-muted/50",
          "hover:border-[#60b1fa] dark:hover:border-[#60b1fa]",
          "backdrop-blur-sm",
          className
        )}
        title="Go back"
        aria-label="Go back to previous page"
      >
        <ArrowLeft className="w-4 h-4" />
      </Button>
    </div>
  )
}

