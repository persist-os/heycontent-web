'use client'

import { useState, useEffect } from 'react'
import React from 'react'
import { ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Logo } from './logo'

const searchSuggestions = [
  "What's my brand deal potential?",
  "Analyze my latest YouTube video",
  "Find partnership opportunities",
  "Track my audience growth"
]

export function HeroSection() {
  const [placeholder, setPlaceholder] = useState('')
  const [currentSuggestion, setCurrentSuggestion] = useState(0)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSuggestion((prev) => (prev + 1) % searchSuggestions.length)
      setPlaceholder(searchSuggestions[currentSuggestion])
    }, 3000)

    return () => clearInterval(interval)
  }, [currentSuggestion])

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
                Featured
              </button>
              <button 
                onClick={() => document.getElementById('features-scroll')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-gray-600 hover:text-gray-900"
              >
                Research
              </button>
              <button 
                onClick={() => router.push('/auth/register')}
                className="bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition-colors"
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
                  Featured
                </button>
                <button 
                  onClick={() => {
                    document.getElementById('features-scroll')?.scrollIntoView({ behavior: 'smooth' })
                    setIsMobileMenuOpen(false)
                  }}
                  className="text-gray-600 hover:text-gray-900 py-2 text-left"
                >
                  Research
                </button>
                <button 
                  onClick={() => {
                    router.push('/auth/register')
                    setIsMobileMenuOpen(false)
                  }}
                  className="bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition-colors text-left"
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
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8 sm:mb-12 text-center">
          What's Next? Ask Content.
        </h1>

        <div onClick={() => router.push('/auth/login')} 
             className="w-full relative cursor-pointer group">
          <input
            type="text"
            placeholder={placeholder}
            className="w-full py-3 sm:py-4 px-4 sm:px-6 pr-12 bg-white border border-gray-200 rounded-lg 
                     text-gray-700 placeholder-gray-500 focus:outline-none focus:border-blue-500
                     cursor-pointer group-hover:border-blue-400 text-base sm:text-lg shadow-sm"
            readOnly
          />
          <ArrowRight className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 
                                group-hover:text-blue-500 transition-colors w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>
    </div>
  )
} 