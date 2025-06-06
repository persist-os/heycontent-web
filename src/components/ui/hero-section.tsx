'use client'

import { useState, useEffect } from 'react'
import React from 'react'
import { ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Logo } from './logo'
import { WaitlistButton } from '@/app/waitlist/_components/WaitlistButton'

console.log('[HeroSection] Module loaded');

const searchSuggestions = [
  "What's my brand deal potential?",
  "Analyze my latest YouTube video",
  "Find partnership opportunities",
  "Track my audience growth"
]

export function HeroSection() {
  console.log('[HeroSection] Function start');
  const [placeholder, setPlaceholder] = useState(searchSuggestions[0])
  const [currentSuggestion, setCurrentSuggestion] = useState(0)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showFloatingSearch, setShowFloatingSearch] = useState(false)
  const [showWaitlist, setShowWaitlist] = useState(false)
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
    const handleScroll = () => {
      const scrollPosition = window.scrollY
      setShowFloatingSearch(scrollPosition > 100)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleWaitlistComplete = () => {
    setShowWaitlist(false)
  }

  const handleStageChange = (stage: 'register' | 'queue' | 'card') => {
    console.log('Waitlist stage changed:', stage)
  }









  return (
    <div className="bg-gradient-to-r from-[#F8F0F9] to-blue-50 min-h-[80vh] flex flex-col">
      {/* Header */}
      <div className="relative">
        <nav className="sticky top-0 z-50 backdrop-blur-sm bg-white/50">
          <div className="flex justify-between items-center px-4 sm:px-6 py-4">
            <div className="text-gray-900">
              <div className="group">
                <Logo className="h-8 sm:h-12 text-gray-900 animate-fade-in group-hover:scale-105 transition-transform duration-300" />
              </div>
            </div>
            
            {/* Mobile Menu Button */}
            <button 
              aria-label="Toggle menu"
              className="sm:hidden p-2 rounded-lg hover:bg-gray-100"
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
                className="text-gray-600 hover:text-gray-900"
              >
                Features
              </button>
              <button 
                onClick={() => document.getElementById('features-scroll')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-gray-600 hover:text-gray-900"
              >
                Capabilities
              </button>
              <button 
                onClick={() => router.push('/auth/register')}
                className="bg-black text-white px-4 py-2 rounded-xl hover:bg-gray-800 transition-colors"
              >
                Get Started
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className="absolute w-full bg-white border-b border-gray-200 sm:hidden">
              <div className="flex flex-col p-4 space-y-4">
                <button 
                  onClick={() => {
                    document.getElementById('featured-scroll')?.scrollIntoView({ behavior: 'smooth' })
                    setIsMobileMenuOpen(false)
                  }}
                  className="text-gray-600 hover:text-gray-900 py-2 text-left"
                >
                  Features
                </button>
                <button 
                  onClick={() => {
                    document.getElementById('features-scroll')?.scrollIntoView({ behavior: 'smooth' })
                    setIsMobileMenuOpen(false)
                  }}
                  className="text-gray-600 hover:text-gray-900 py-2 text-left"
                >
                  Capabilities
                </button>
                <button 
                  onClick={() => {
                    router.push('/auth/register')
                    setIsMobileMenuOpen(false)
                  }}
                  className="bg-black text-white px-4 py-2 rounded-xl hover:bg-gray-800 transition-colors text-left"
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
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 text-center">
          What's next? Ask Content.
        </h1>
        <p className="text-xl sm:text-2xl text-gray-600 mb-8 sm:mb-12 text-center">
          Your Creative OS. Built to think with you.
        </p>

        <div onClick={() => router.push('/auth/login')} 
             className="w-full relative cursor-pointer group mb-8">
          <input
            type="text"
            placeholder={placeholder}
            className="w-full py-3 sm:py-4 px-4 sm:px-6 pr-12 bg-white border border-gray-200 rounded-lg 
                     text-gray-700 placeholder-gray-500 focus:outline-none focus:border-blue-500
                     cursor-pointer group-hover:border-blue-400 text-base sm:text-lg shadow-sm
                     transition-all duration-300"
            readOnly
          />
          <ArrowRight className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 
                                group-hover:text-blue-500 transition-colors w-5 h-5 sm:w-6 sm:h-6" />
        </div>

        <div className="text-center">
          <p className="text-gray-600 mb-4">Be among the first to experience the future of content creation</p>
          <div
            onClick={() => router.push('/waitlist')}
            className="inline-block cursor-pointer"
          >
            <WaitlistButton size="large" />
          </div>
        </div>
      </div>

      {/* Floating Search Suggestion */}
      {showFloatingSearch && (
        <div 
          onClick={() => router.push('/auth/login')}
          className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40 cursor-pointer group"
        >
          <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full px-4 py-2 shadow-lg
                        flex items-center gap-2 hover:border-blue-400 transition-all duration-300">
            <span className="text-gray-600 group-hover:text-gray-900 transition-all duration-300">{placeholder}</span>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
          </div>
        </div>
      )}
    </div>
  )
} 