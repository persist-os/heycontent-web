'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

export function CTABand() {
  const router = useRouter()
  const [isButtonPressed, setIsButtonPressed] = useState(false)

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-slate-900 text-white relative overflow-hidden min-h-screen flex items-center">
      <div className="max-w-4xl mx-auto px-4 sm:px-8 lg:px-12 text-center relative z-10 w-full">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light leading-tight mb-4 sm:mb-6">
          Start building your workspace today
        </h2>
        
        <p className="text-base sm:text-lg text-slate-300 font-light max-w-2xl mx-auto leading-relaxed mb-8 sm:mb-12">
          Experience AI that evolves with your work. Every conversation and note becomes part of a growing understanding that gets more valuable over time.
        </p>

        <div className="flex justify-center">
          <button 
            onClick={() => router.push('/auth/login')}
            onTouchStart={() => setIsButtonPressed(true)}
            onTouchEnd={() => setIsButtonPressed(false)}
            className={`px-6 sm:px-8 py-3 bg-white text-slate-900 text-base sm:text-lg font-medium hover:bg-slate-100 active:bg-slate-200 transition-all duration-300 active:scale-95 hover:scale-105 hover:shadow-xl min-w-[180px] sm:min-w-[200px] min-h-[48px] touch-manipulation ${isButtonPressed ? 'scale-95' : ''}`}
          >
            Try HeyContext
          </button>
        </div>

        <div className="mt-8 sm:mt-12 text-slate-400 text-xs sm:text-sm">
          <p>Free to start • Private conversations • Built for thoughtful work</p>
        </div>
      </div>

    </section>
  )
}
