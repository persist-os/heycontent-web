'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { T } from '@/components/translation'

export function CTABand() {
  const router = useRouter()
  const [isButtonPressed, setIsButtonPressed] = useState(false)

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-foreground text-background relative overflow-hidden min-h-screen flex items-center">
      <div className="max-w-4xl mx-auto px-4 sm:px-8 lg:px-12 text-center relative z-10 w-full">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light leading-tight mb-4 sm:mb-6 hover:text-background/90 transition-colors duration-300 cursor-default">
          <T context="cta.heading">Stop repeating yourself. Start building memory.</T>
        </h2>
        
        <p className="text-base sm:text-lg text-background/80 font-light max-w-2xl mx-auto leading-relaxed mb-8 sm:mb-12 hover:text-background/90 transition-colors duration-300 cursor-default">
          <T context="cta.description">Memory that grows with every conversation. Connections that form automatically. Understanding that deepens every single day.</T>
        </p>

        <div className="flex justify-center">
          <button 
            onClick={() => router.push('/auth/login')}
            onTouchStart={() => setIsButtonPressed(true)}
            onTouchEnd={() => setIsButtonPressed(false)}
            className={`px-6 sm:px-8 py-3 bg-background text-foreground text-base sm:text-lg font-medium hover:bg-background/90 active:bg-background/80 transition-all duration-300 active:scale-95 hover:scale-105 hover:shadow-xl min-w-[180px] sm:min-w-[200px] min-h-[48px] touch-manipulation ${isButtonPressed ? 'scale-95' : ''}`}
          >
            <T context="cta.button">Start building your memory</T>
          </button>
        </div>

        <div className="mt-8 sm:mt-12 text-background/60 text-xs sm:text-sm">
          <p className="hover:text-background/70 transition-colors duration-300 cursor-default">
            <T context="cta.subtext">Free to start • Completely private • Learns continuously</T>
          </p>
        </div>
      </div>

    </section>
  )
}
