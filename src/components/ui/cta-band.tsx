'use client'

import React from 'react'
import { useRouter } from 'next/navigation'

export function CTABand() {
  const router = useRouter()

  return (
    <section className="py-32 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/20 via-indigo-500/20 to-purple-500/20" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '2s'}} />
      
      <div className="max-w-4xl mx-auto px-8 sm:px-12 text-center relative z-10">
        <h2 className="text-4xl sm:text-5xl font-light text-white leading-tight tracking-wide mb-8 animate-fade-in-up">
          Turn your projects into living memory
        </h2>
        
        <p className="text-xl text-blue-100 font-light max-w-2xl mx-auto leading-relaxed mb-12 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
          Stop losing context. Stop manual updates. Start with projects that think.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-fade-in-up" style={{animationDelay: '0.4s'}}>
          <button 
            onClick={() => router.push('/auth/login')}
            className="group px-10 py-4 bg-white text-blue-600 rounded-full text-lg font-medium hover:bg-blue-50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-black/20 min-w-[220px]"
          >
            <span className="group-hover:tracking-wide transition-all duration-300">Start a Project</span>
          </button>
          <button 
            onClick={() => router.push('/auth/login?demo=true')}
            className="group px-10 py-4 bg-transparent border-2 border-white/30 text-white rounded-full text-lg font-medium hover:border-white/50 hover:bg-white/10 transition-all duration-300 hover:scale-105 min-w-[220px]"
          >
            <span className="group-hover:tracking-wide transition-all duration-300">See a Sample Brief</span>
          </button>
        </div>

        <div className="mt-12 text-blue-100/80 text-sm animate-fade-in-up" style={{animationDelay: '0.6s'}}>
          <p>Free to start • No credit card required • Private by default</p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
          opacity: 0;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 12s ease-in-out infinite;
        }
      `}</style>
    </section>
  )
}
