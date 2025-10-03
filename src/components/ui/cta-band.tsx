'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

export function CTABand() {
  const router = useRouter()
  const [isButtonPressed, setIsButtonPressed] = useState(false)

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-slate-900 text-white relative overflow-hidden min-h-screen flex items-center">
      <div className="max-w-4xl mx-auto px-4 sm:px-8 lg:px-12 text-center relative z-10 w-full">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light leading-tight mb-4 sm:mb-6 hover:text-white transition-colors duration-300 cursor-default">
          Stop repeating yourself. Start building memory.
        </h2>
        
        <p className="text-base sm:text-lg text-slate-300 font-light max-w-2xl mx-auto leading-relaxed mb-8 sm:mb-12 hover:text-white transition-colors duration-300 cursor-default">
          Memory that grows with every conversation. Connections that form automatically. Understanding that deepens every single day.
        </p>

        <div className="flex justify-center">
          <button 
            onClick={() => router.push('/auth/login')}
            onTouchStart={() => setIsButtonPressed(true)}
            onTouchEnd={() => setIsButtonPressed(false)}
            className={`px-6 sm:px-8 py-3 bg-white text-slate-900 text-base sm:text-lg font-medium hover:bg-slate-100 active:bg-slate-200 transition-all duration-300 active:scale-95 hover:scale-105 hover:shadow-xl min-w-[180px] sm:min-w-[200px] min-h-[48px] touch-manipulation ${isButtonPressed ? 'scale-95' : ''}`}
          >
            Start building your memory
          </button>
        </div>

        <div className="mt-8 sm:mt-12 text-slate-400 text-xs sm:text-sm">
          <p className="hover:text-slate-300 transition-colors duration-300 cursor-default">Free to start • Completely private • Learns continuously</p>
        </div>
      </div>

    </section>
  )
}
