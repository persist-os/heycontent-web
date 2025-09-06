'use client'

import React from 'react'
import { useRouter } from 'next/navigation'

export function CTABand() {
  const router = useRouter()

  return (
    <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-8 sm:px-12 text-center relative z-10">
        <h2 className="text-3xl sm:text-4xl font-light leading-tight mb-6">
          Start building your workspace today
        </h2>
        
        <p className="text-lg text-slate-300 font-light max-w-2xl mx-auto leading-relaxed mb-12">
          Experience AI that evolves with your work. Every conversation and note becomes part of a growing understanding that gets more valuable over time.
        </p>

        <div className="flex justify-center">
          <button 
            onClick={() => router.push('/auth/login')}
            className="px-8 py-3 bg-white text-slate-900 text-lg font-medium hover:bg-slate-100 transition-all duration-300 min-w-[200px]"
          >
            Try HeyContext
          </button>
        </div>

        <div className="mt-12 text-slate-400 text-sm">
          <p>Free to start • Private conversations • Built for thoughtful work</p>
        </div>
      </div>

    </section>
  )
}
