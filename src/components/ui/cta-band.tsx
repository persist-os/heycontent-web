'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { T } from '@/components/translation'

export function CTABand() {
  const router = useRouter()
  const [isButtonPressed, setIsButtonPressed] = useState(false)

  return (
    <section className="py-12 sm:py-16 lg:py-24 bg-foreground text-background relative overflow-hidden min-h-screen flex items-center">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-12 text-center relative z-10 w-full">
        <h2 className="text-xl sm:text-2xl lg:text-4xl font-light leading-tight mb-3 sm:mb-4 lg:mb-6 hover:text-background/90 transition-colors duration-300 cursor-default">
          <T context="cta.heading">Launch your journey with HeyContext today</T>
        </h2>
        
        <p className="text-sm sm:text-base lg:text-lg text-background font-light max-w-2xl mx-auto leading-relaxed mb-6 sm:mb-8 lg:mb-12 hover:text-background transition-colors duration-300 cursor-default">
          <T context="cta.description">Free to start • Completely private • Works with you</T>
        </p>

        <div className="flex justify-center">
          <button 
            onClick={() => router.push('/auth/login')}
            onTouchStart={() => setIsButtonPressed(true)}
            onTouchEnd={() => setIsButtonPressed(false)}
            className={`px-5 sm:px-6 lg:px-8 py-2.5 sm:py-3 bg-background text-foreground text-sm sm:text-base lg:text-lg font-medium hover:bg-background/90 active:bg-background/80 transition-all duration-300 active:scale-95 hover:scale-105 hover:shadow-xl min-w-[160px] sm:min-w-[180px] lg:min-w-[200px] min-h-[44px] sm:min-h-[48px] touch-manipulation ${isButtonPressed ? 'scale-95' : ''}`}
          >
            <T context="cta.button">Get Started</T>
          </button>
        </div>
      </div>

    </section>
  )
}
