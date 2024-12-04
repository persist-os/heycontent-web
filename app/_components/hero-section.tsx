'use client'

import { useState, useEffect } from 'react'
import { ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

const searchSuggestions = [
  "What's my brand deal potential?",
  "Show me partnership matches",
  "Optimize my pricing strategy", 
  "Analyze my audience demographics",
  "Find collaboration opportunities"
]

export function HeroSection() {
  const [placeholder, setPlaceholder] = useState('')
  const [currentSuggestion, setCurrentSuggestion] = useState(0)
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
      <nav className="sticky top-0 z-50 backdrop-blur-sm bg-white/50 flex justify-between items-center px-6 py-4">
        <div className="text-2xl font-bold">AVA IRIS</div>
        <div className="flex items-center gap-4">
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
            onClick={() => router.push('/register')}
            className="bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition-colors"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-12">
          What's Next? Ask IRIS.
        </h1>

        <div onClick={() => router.push('/login')} 
             className="w-full relative cursor-pointer group">
          <input
            type="text"
            placeholder={placeholder}
            className="w-full py-4 px-6 pr-12 bg-white border border-gray-200 rounded-lg 
                     text-gray-700 placeholder-gray-500 focus:outline-none focus:border-blue-500
                     cursor-pointer group-hover:border-blue-400 text-lg shadow-sm"
            readOnly
          />
          <ArrowRight className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 
                                group-hover:text-blue-500 transition-colors" />
        </div>
      </div>
    </div>
  )
} 