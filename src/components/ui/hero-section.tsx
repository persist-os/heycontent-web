'use client'

import { useState, useEffect } from 'react'
import React from 'react'
import { useRouter } from 'next/navigation'
import { Logo } from './logo'
import { T } from '@/components/translation'
import { LanguageToggleSimple } from '@/components/language-toggle-simple'
import { ThemeToggle } from '@/components/theme-toggle'

const searchSuggestions = [
  "How does this connect to what we discussed last week?",
  "Find the pattern in my recent notes",
  "Help me think through this idea",
  "What am I missing here?"
]

export function HeroSection() {
  const [placeholder, setPlaceholder] = useState(searchSuggestions[0])
  const [currentSuggestion, setCurrentSuggestion] = useState(0)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showFloatingSearch, setShowFloatingSearch] = useState(false)
  const [showCursor, setShowCursor] = useState(true)
  const [isButtonPressed, setIsButtonPressed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const router = useRouter()

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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
    <div className="min-h-screen bg-gradient-to-br from-secondary via-primary/[0.03] to-accent/[0.02] dark:from-background dark:via-primary/[0.02] dark:to-accent/[0.01] flex flex-col relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.05] to-accent/[0.03] dark:from-primary/[0.02] dark:to-accent/[0.01] transition-all duration-1000" />
      <div className={`absolute top-1/4 left-1/4 ${isMobile ? 'w-64 h-64' : 'w-96 h-96'} bg-gradient-to-br from-primary/[0.15] to-accent/[0.10] dark:from-primary/[0.08] dark:to-accent/[0.05] rounded-full blur-3xl animate-pulse-slow`} />
      <div className={`absolute bottom-1/4 right-1/4 ${isMobile ? 'w-48 h-48' : 'w-80 h-80'} bg-gradient-to-br from-accent/[0.12] to-primary/[0.08] dark:from-accent/[0.06] dark:to-primary/[0.04] rounded-full blur-3xl animate-pulse-slow`} style={{animationDelay: '1s'}} />
      <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${isMobile ? 'w-40 h-40' : 'w-64 h-64'} bg-gradient-to-br from-primary/[0.10] to-accent/[0.08] dark:from-primary/[0.05] dark:to-accent/[0.04] rounded-full blur-3xl animate-pulse-slow`} style={{animationDelay: '2s'}} />
      
      {/* Header */}
      <nav className="relative z-10 p-4 sm:p-8 lg:p-12 animate-fade-in-down">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="transform active:scale-95 hover:scale-105 transition-transform duration-200">
            <Logo className="h-6 sm:h-8 text-foreground/80" />
          </div>
          
          <div className="flex items-center gap-3 sm:gap-4">
            <button 
              onClick={() => router.push('/pricing')}
              className="text-sm sm:text-base text-muted-foreground hover:text-foreground transition-colors font-light"
            >
              <T context="nav.pricing">Pricing</T>
            </button>
            <div className="flex items-center gap-2 relative z-20">
              <LanguageToggleSimple />
              <ThemeToggle />
            </div>
            <button 
              onClick={() => router.push('/auth/login')}
              onTouchStart={() => setIsButtonPressed(true)}
              onTouchEnd={() => setIsButtonPressed(false)}
              className={`group px-4 sm:px-6 lg:px-8 py-2 sm:py-3 bg-gradient-to-r from-foreground to-foreground/90 text-background rounded-full text-xs sm:text-sm font-medium hover:from-foreground/90 hover:to-foreground/80 transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-xl hover:shadow-foreground/20 ${isButtonPressed ? 'scale-95' : ''} ${isMobile ? 'min-h-[44px] touch-manipulation' : ''}`}
            >
              <span className="group-hover:tracking-wide transition-all duration-300">
                <T context="nav.signin">Sign in</T>
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 lg:px-12 relative z-10 -mt-8 sm:-mt-16">
        <div className="max-w-5xl mx-auto text-center">
          <div className="space-y-8 sm:space-y-10">
            <div className="space-y-6 sm:space-y-8">
              <div className="text-muted-foreground text-sm sm:text-lg font-light tracking-wider uppercase animate-fade-in-up hover:text-foreground/70 hover:tracking-widest transition-all duration-300 cursor-default">
                <T context="hero.tagline">Stop explaining. Stop repeating. Stop starting over.</T>
              </div>
              
              <h1 className="text-3xl sm:text-5xl lg:text-7xl font-light text-foreground leading-tight animate-fade-in-up hover:text-foreground/80 transition-colors duration-300 cursor-default" style={{animationDelay: '0.1s'}}>
                <span className="inline-block"><T context="hero.headline1">AI that works </T></span>
                <span className="block text-4xl sm:text-6xl lg:text-8xl font-extralight text-primary mt-1 sm:mt-2 hover:text-primary/80 transition-colors duration-300"><T context="hero.headline2">with you</T></span>
              </h1>
              
              <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                <p className="text-lg sm:text-xl lg:text-2xl text-muted-foreground font-light leading-relaxed hover:text-foreground/70 transition-colors duration-300 cursor-default">
                  <T context="hero.description1">Intelligence that understands your goals</T>
                </p>
                <p className="text-base sm:text-lg lg:text-xl text-muted-foreground/80 font-light leading-relaxed hover:text-muted-foreground transition-colors duration-300 cursor-default">
                  <T context="hero.description2">Go further in fewer prompts, and never repeat a thing.</T>
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="animate-fade-in-up" style={{animationDelay: '0.4s'}}>
              <button 
                onClick={() => router.push('/auth/login')}
                onTouchStart={() => setIsButtonPressed(true)}
                onTouchEnd={() => setIsButtonPressed(false)}
                className={`group px-8 sm:px-10 py-3 sm:py-4 bg-foreground text-background text-base sm:text-lg font-medium hover:bg-foreground/90 transition-all duration-300 active:scale-95 hover:scale-105 hover:shadow-xl min-w-[200px] sm:min-w-[240px] ${isButtonPressed ? 'scale-95' : ''} ${isMobile ? 'min-h-[48px] touch-manipulation' : ''}`}
              >
                <span className="transition-all duration-300 group-active:tracking-wide">
                  <T context="hero.cta">Try Now</T>
                </span>
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