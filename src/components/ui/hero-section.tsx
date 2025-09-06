'use client'

import { useState, useEffect } from 'react'
import React from 'react'
import { useRouter } from 'next/navigation'
import { Logo } from './logo'

const searchSuggestions = [
  "Help me think through this project idea",
  "Refine this draft with my writing style", 
  "What patterns do you see in my notes?",
  "Connect this to what we discussed before"
]

export function HeroSection() {
  const [placeholder, setPlaceholder] = useState(searchSuggestions[0])
  const [currentSuggestion, setCurrentSuggestion] = useState(0)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showFloatingSearch, setShowFloatingSearch] = useState(false)
  const [showCursor, setShowCursor] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSuggestion((prev) => {
        const next = (prev + 1) % searchSuggestions.length
        setPlaceholder(searchSuggestions[next])
        return next
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev)
    }, 530)

    return () => clearInterval(cursorInterval)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY
      const atBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 2
      setShowFloatingSearch(scrollPosition > 100 && !atBottom)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-900 dark:via-blue-950/20 dark:to-indigo-950/10 flex flex-col relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-100/30 dark:from-blue-950/20 dark:to-indigo-950/10 transition-all duration-1000" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-200/30 to-cyan-200/20 dark:from-blue-800/15 dark:to-cyan-800/10 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-br from-indigo-200/25 to-purple-200/15 dark:from-indigo-800/12 dark:to-purple-800/8 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '1s'}} />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-emerald-200/20 to-teal-200/15 dark:from-emerald-800/10 dark:to-teal-800/8 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '2s'}} />
      
      {/* Header */}
      <nav className="relative z-10 p-8 sm:p-12 animate-fade-in-down">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="transform hover:scale-105 transition-transform duration-300">
            <Logo className="h-8 text-slate-800 dark:text-slate-200" />
          </div>
          
          <button 
            onClick={() => router.push('/auth/login')}
            className="group px-8 py-3 bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-100 dark:to-slate-200 text-slate-50 dark:text-slate-900 rounded-full text-sm font-medium hover:from-slate-800 hover:to-slate-700 dark:hover:from-slate-200 dark:hover:to-slate-300 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-slate-900/20"
          >
            <span className="group-hover:tracking-wide transition-all duration-300">Sign in</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 sm:px-12 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          <div className="space-y-12">
            <div className="space-y-8">
              <div className="text-slate-500 dark:text-slate-400 text-lg font-light tracking-wider uppercase animate-fade-in-up">
                Your intelligent workspace
              </div>
              
              <h1 className="text-5xl sm:text-7xl font-light text-slate-900 dark:text-slate-100 leading-tight animate-fade-in-up" style={{animationDelay: '0.1s'}}>
                <span className="inline-block">Your AI </span>
                <span className="block text-6xl sm:text-8xl font-extralight text-blue-600 dark:text-blue-400 mt-2">project platform</span>
              </h1>
              
              <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                <p className="text-xl sm:text-2xl text-slate-600 dark:text-slate-400 font-light leading-relaxed">
                  Conversations that remember. Notes that connect. Ideas that evolve.
                </p>
                <p className="text-lg sm:text-xl text-slate-500 dark:text-slate-500 font-light leading-relaxed">
                  Your thoughts stay organized, your projects stay on track, your creativity stays flowing.
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="animate-fade-in-up" style={{animationDelay: '0.4s'}}>
              <button 
                onClick={() => router.push('/auth/login')}
                className="group px-10 py-4 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-lg font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-all duration-300 min-w-[240px]"
              >
                <span className="transition-all duration-300">Start your workspace</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fade-in-down {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.08; transform: scale(1); }
          50% { opacity: 0.25; transform: scale(1.05); }
        }
        
        @keyframes pulse-glow {
          0%, 100% { opacity: 0; transform: scale(0.95); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out forwards;
          opacity: 0;
        }
        
        .animate-fade-in-down {
          animation: fade-in-down 0.8s ease-out forwards;
          opacity: 0;
        }
        
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
          opacity: 0;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 6s ease-in-out infinite;
        }
        
        .animate-pulse-glow {
          animation: pulse-glow 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
} 