'use client'

import { useState, useEffect } from 'react'
import React from 'react'
import { useRouter } from 'next/navigation'
import { Logo } from './logo'

const searchSuggestions = [
  "Track this product launch project",
  "What changed while I was away?",
  "Flag any contradictions in my notes",
  "Generate a brief for this research"
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
        <div className="max-w-5xl mx-auto text-center space-y-12">
          <h1 className="text-6xl sm:text-8xl font-light text-slate-900 dark:text-slate-100 leading-tight tracking-tight animate-fade-in-up">
            <span className="inline-block hover:scale-105 transition-transform duration-500 cursor-default">Projects that</span>
            <span className="block font-extralight text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-500 cursor-default mt-4">think in the background</span>
          </h1>
          
          <p className="text-2xl sm:text-3xl text-slate-600 dark:text-slate-400 font-light max-w-4xl mx-auto leading-relaxed animate-fade-in-up" style={{animationDelay: '0.2s'}}>
            HeyContext turns every project into a living memory that summarizes, reconciles, and resurfaces work—so you don't have to.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mt-16 animate-fade-in-up" style={{animationDelay: '0.4s'}}>
            <button 
              onClick={() => router.push('/auth/login')}
              className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full text-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/25 min-w-[200px]"
            >
              <span className="group-hover:tracking-wide transition-all duration-300">Start a Project</span>
            </button>
            <button 
              onClick={() => router.push('/auth/login?demo=true')}
              className="group px-8 py-4 bg-transparent border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-full text-lg font-medium hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-300 hover:scale-105 min-w-[200px]"
            >
              <span className="group-hover:tracking-wide transition-all duration-300">See a Sample Brief</span>
            </button>
          </div>

          {/* Trust badges */}
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-12 justify-center items-center mt-12 text-sm text-slate-500 dark:text-slate-400 animate-fade-in-up" style={{animationDelay: '0.6s'}}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Private by default</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Explainable outputs</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Async multi-agent</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom indicator with hover effect */}
      <div className="pb-12 text-center relative z-10 animate-fade-in" style={{animationDelay: '0.8s'}}>
        <div className="w-8 h-12 border-2 border-slate-300 dark:border-slate-600 rounded-full mx-auto flex justify-center hover:border-blue-400 transition-colors duration-300 cursor-pointer group" onClick={() => document.querySelector('.py-32')?.scrollIntoView({behavior: 'smooth'})}>
          <div className="w-1.5 h-4 bg-slate-400 dark:bg-slate-500 rounded-full mt-2 animate-bounce group-hover:bg-gradient-to-b from-blue-500 to-indigo-500 transition-all duration-300" />
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