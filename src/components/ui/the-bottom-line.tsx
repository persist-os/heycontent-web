'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { T } from '@/components/translation'

export function TheBottomLine() {
  const router = useRouter()
  const [isButtonPressed, setIsButtonPressed] = useState(false)

  return (
    <section className="py-12 sm:py-20 lg:py-32 bg-foreground text-background relative overflow-hidden min-h-screen flex items-center">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-12 text-center relative z-10 w-full">
        <div className="space-y-6 sm:space-y-8 lg:space-y-12">
          {/* Main Message */}
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            <h2 className="text-2xl sm:text-3xl lg:text-5xl font-light leading-tight px-2">
              <T context="section.bottomline.title">The Bottom Line</T>
            </h2>
            
            <div className="space-y-3 sm:space-y-4 max-w-2xl mx-auto px-2">
              <p className="text-base sm:text-lg lg:text-xl text-background font-light leading-relaxed">
                <T context="section.bottomline.statement1">We don't give advice about work.</T>
              </p>
              <p className="text-base sm:text-lg lg:text-xl text-background font-medium leading-relaxed">
                <T context="section.bottomline.statement2">We build the work.</T>
              </p>
            </div>

            <div className="space-y-2 sm:space-y-3 max-w-2xl mx-auto px-2">
              <p className="text-sm sm:text-base lg:text-lg text-background/90 leading-relaxed">
                <T context="section.bottomline.point1">One sentence becomes a complete system.</T>
              </p>
              <p className="text-sm sm:text-base lg:text-lg text-background/90 leading-relaxed">
                <T context="section.bottomline.point2">Agents coordinate without prompting.</T>
              </p>
              <p className="text-sm sm:text-base lg:text-lg text-background/90 leading-relaxed">
                <T context="section.bottomline.point3">Your team collaborates in real-time.</T>
              </p>
              <p className="text-sm sm:text-base lg:text-lg text-background/90 leading-relaxed">
                <T context="section.bottomline.point4">Everything connects.</T>
              </p>
            </div>

            <div className="pt-4 sm:pt-6 lg:pt-8 px-2">
              <p className="text-base sm:text-lg lg:text-xl font-medium text-background">
                <T context="section.bottomline.cta">Stop prompting. Start shipping.</T>
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="space-y-3 sm:space-y-4 lg:space-y-6">
            <button 
              onClick={() => router.push('/auth/login')}
              onTouchStart={() => setIsButtonPressed(true)}
              onTouchEnd={() => setIsButtonPressed(false)}
              className={`px-6 sm:px-8 lg:px-10 py-2.5 sm:py-3 lg:py-4 bg-background text-foreground text-sm sm:text-base lg:text-lg font-medium hover:bg-background/90 active:bg-background/80 transition-all duration-300 active:scale-95 hover:scale-105 hover:shadow-xl w-full sm:w-auto min-w-[200px] sm:min-w-[240px] lg:min-w-[280px] min-h-[44px] sm:min-h-[48px] touch-manipulation ${isButtonPressed ? 'scale-95' : ''}`}
            >
              <T context="section.bottomline.button">Watch It Build →</T>
            </button>
            
            <p className="text-xs sm:text-sm text-background/70 italic px-2">
              <T context="section.bottomline.footer">Free trial. No card. Pick a real project.</T>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

