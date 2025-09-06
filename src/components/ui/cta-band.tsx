'use client'

import React from 'react'
import { useRouter } from 'next/navigation'

export function CTABand() {
  const router = useRouter()

  return (
    <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-8 sm:px-12 text-center relative z-10">
        <h2 className="text-3xl sm:text-4xl font-light leading-tight mb-6">
          Start with advanced AI that understands you
        </h2>
        
        <p className="text-lg text-slate-300 font-light max-w-2xl mx-auto leading-relaxed mb-12">
          Experience contextual conversations and smart notes today. Be among the first to access project coordination features as they become available.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button 
            onClick={() => router.push('/auth/login')}
            className="px-8 py-3 bg-white text-slate-900 text-lg font-medium hover:bg-slate-100 transition-all duration-300 min-w-[200px]"
          >
            Try HeyContext
          </button>
          <button 
            onClick={() => router.push('/auth/login?demo=true')}
            className="px-8 py-3 text-slate-300 text-lg font-light hover:text-white transition-all duration-300 border-b border-transparent hover:border-slate-400"
          >
            See the roadmap
          </button>
        </div>

        <div className="mt-12 text-slate-400 text-sm">
          <p>Free to start • Private conversations • Built for thoughtful work</p>
        </div>
      </div>

    </section>
  )
}
