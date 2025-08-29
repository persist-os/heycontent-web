'use client'

import { useState, useEffect } from 'react'
import React from 'react'
import { ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Logo } from './logo'

console.log('[HeroSection] Module loaded');

const searchSuggestions = [
  "Help me work through this decision",
  "What did I learn from that conversation?",
  "Remember what I was thinking about yesterday",
  "Help me sort through these ideas"
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
      const atBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 2 // allow for rounding
      setShowFloatingSearch(scrollPosition > 100 && !atBottom)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="bg-gradient-to-r from-background/80 via-muted/20 to-background/80 min-h-[80vh] flex flex-col">
      {/* Header */}
      <div className="relative">
        <nav className="sticky top-0 z-50 backdrop-blur-sm bg-background/50">
          <div className="flex justify-between items-center px-4 sm:px-6 py-4">
            <div className="text-foreground">
              <div className="group">
                <Logo className="h-8 sm:h-12 text-foreground animate-fade-in group-hover:scale-105 transition-transform duration-300" />
              </div>
            </div>
            
            {/* Mobile Menu Button */}
            <button 
              aria-label="Toggle menu"
              className="sm:hidden p-2 rounded-lg hover:bg-muted"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            {/* Desktop Navigation */}
            <div className="hidden sm:flex items-center gap-4">
              <button 
                onClick={() => document.getElementById('featured-scroll')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-muted-foreground hover:text-foreground"
              >
                Features
              </button>
              <button 
                onClick={() => document.getElementById('features-scroll')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-muted-foreground hover:text-foreground"
              >
                Capabilities
              </button>
              <button 
                onClick={() => router.push('/auth/register')}
                className="bg-foreground text-background px-4 py-2 rounded-xl hover:bg-foreground/80 transition-colors"
              >
                Get Started
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className="absolute w-full bg-background border-b border-border sm:hidden">
              <div className="flex flex-col p-4 space-y-4">
                <button 
                  onClick={() => {
                    document.getElementById('featured-scroll')?.scrollIntoView({ behavior: 'smooth' })
                    setIsMobileMenuOpen(false)
                  }}
                  className="text-muted-foreground hover:text-foreground py-2 text-left"
                >
                  Features
                </button>
                <button 
                  onClick={() => {
                    document.getElementById('features-scroll')?.scrollIntoView({ behavior: 'smooth' })
                    setIsMobileMenuOpen(false)
                  }}
                  className="text-muted-foreground hover:text-foreground py-2 text-left"
                >
                  Capabilities
                </button>
                <button 
                  onClick={() => {
                    router.push('/auth/register')
                    setIsMobileMenuOpen(false)
                  }}
                  className="bg-foreground text-background px-4 py-2 rounded-xl hover:bg-foreground/80 transition-colors text-left"
                >
                  Get Started
                </button>
              </div>
            </div>
          )}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto px-4 sm:px-6">
        <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4 sm:mb-6 text-center">
          Your private space with memory, finally.
        </h1>
        <p className="text-xl sm:text-2xl text-muted-foreground mb-8 sm:mb-12 text-center">
          AI that doesn't forget you. And never shares.
        </p>

        <div onClick={() => router.push('/auth/login')} 
             className="w-full relative cursor-pointer group mb-8">
          <div className="relative">
            {/* Pulsing ring effect */}
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 animate-pulse-slow transition-opacity duration-300" />
            
            <input
              type="text"
              placeholder={placeholder}
              className="w-full py-3 sm:py-4 px-4 sm:px-6 pr-20 bg-background border-2 border-border rounded-lg 
                       text-foreground placeholder-muted-foreground focus:outline-none focus:border-blue-500
                       cursor-pointer group-hover:border-blue-400 group-hover:shadow-lg text-base sm:text-lg shadow-sm
                       transition-all duration-300 relative z-10"
              readOnly
            />
            
            <div 
              className={`absolute left-4 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-blue-500 transition-opacity duration-300 z-20 ${
                showCursor ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ left: 'calc(1rem + 0.5rem)' }}
            />
            
            {/* Enhanced arrow with "Login" text */}
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2 z-20">
              <span className="text-xs font-medium text-muted-foreground group-hover:text-blue-600 transition-colors duration-300 hidden sm:block">
                Login
              </span>
              <div className="bg-blue-500 group-hover:bg-blue-600 text-white rounded-md p-2 transition-all duration-300 group-hover:scale-110">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-muted-foreground mb-4">Everything you want to think through, remember, or come back to, all in one place.</p>
          <button
            onClick={() => router.push('/auth/register')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            Get Started
          </button>
        </div>
      </div>

      {/* Floating Search Suggestion */}
      {showFloatingSearch && (
        <div 
          onClick={() => router.push('/auth/login')}
          className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40 cursor-pointer group"
        >
          <div className="bg-background/80 backdrop-blur-sm border border-border rounded-full px-4 py-2 shadow-lg
                        flex items-center gap-2 hover:border-blue-400 transition-all duration-300">
            <span className="text-muted-foreground group-hover:text-foreground transition-all duration-300">{placeholder}</span>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-blue-500 transition-colors" />
          </div>
        </div>
      )}
    </div>
  )
} 