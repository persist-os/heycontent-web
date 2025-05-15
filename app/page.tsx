'use client'

import React from 'react'
import { ArrowRight, Brain, Target, ChartBar, ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { HeroSection } from './_components/hero-section'
import Link from 'next/link'
import { WaitlistQueue } from './_components/WaitlistQueue'

const featureCards = [
  {
    title: "Chat With Content",
    stat: "40% Time Saved",
    icon: Brain,
    color: "from-purple-500/10",
    image: "/creators/tech-creator.jpg",
    role: "Tech Creator"
  },
  {
    title: "Smart Analytics",
    stat: "2x Growth Rate",
    icon: ChartBar,
    color: "from-blue-500/10",
    image: "/creators/content-creator.jpg",
    role: "Content Creator"
  },
  {
    title: "Content Strategy",
    stat: "3x Engagement",
    icon: Target,
    color: "from-pink-500/10",
    image: "/creators/educational-creator.jpg",
    role: "Educational Creator"
  }
]

export default function LandingPage() {
  const router = useRouter()
  
  const scrollSection = (direction: 'left' | 'right', elementId: string) => {
    const container = document.getElementById(elementId)
    if (container) {
      const scrollAmount = direction === 'left' ? -container.offsetWidth : container.offsetWidth
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  return (
    <div className="overflow-x-hidden">
      <div className="relative">
        <HeroSection />
      </div>

      {/* Waitlist Section */}
      <section className="py-16 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-6xl mx-auto px-4">
          <WaitlistQueue 
            position={10} 
            queueId={Math.random().toString(36).substring(2, 15)} 
            onQueueComplete={() => {}}
          />
        </div>
      </section>
      
      <section className="min-h-screen bg-gradient-to-r from-[#F8F0F9] to-blue-50">
        {/* Featured Influencers */}
        <div className="relative">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center px-4 sm:px-6 mb-3 pt-8 sm:pt-12">
            <h2 className="text-xl font-medium mb-4 sm:mb-0">Featured</h2>
            <div className="flex items-center gap-4">
              <div className="flex gap-1">
                <button 
                  onClick={() => scrollSection('left', 'featured-scroll')}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => scrollSection('right', 'featured-scroll')}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          
          <div 
            id="featured-scroll" 
            className="mb-8 sm:mb-12 px-4 sm:px-6 overflow-x-auto overflow-y-hidden hide-scrollbar scroll-smooth mt-2"
          >
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* First Influencer */}
                <div className="overflow-hidden relative group cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl rounded-2xl">
                  {/* Follower Count */}
                  <div className="absolute top-4 left-4 z-20">
                    <div className="bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-sm text-white shadow-sm">
                      245K Followers
                    </div>
                  </div>

                  <div className="aspect-[16/9] relative">
                    <Image 
                      src="/dashboard-preview.png" 
                      alt="Featured Influencer"
                      width={1200}
                      height={675}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                    />
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90 group-hover:opacity-70 transition-opacity duration-300" />
                    
                    <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-wrap gap-2">
                      {['AI INSIGHTS', 'ANALYTICS'].map((tag) => (
                        <div key={tag} className="bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-sm text-white shadow-sm">
                          {tag}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Second Influencer */}
                <div className="overflow-hidden relative group cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl rounded-2xl">
                  {/* Follower Count */}
                  <div className="absolute top-4 left-4 z-20">
                    <div className="bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-sm text-white shadow-sm">
                      180K Followers
                    </div>
                  </div>

                  <div className="aspect-[16/9] relative">
                    <Image 
                      src="/dashboard-preview-2.jpg" 
                      alt="Featured Influencer"
                      width={1200}
                      height={675}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                    />
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90 group-hover:opacity-70 transition-opacity duration-300" />
                    
                    <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-wrap gap-2">
                      {['CONTENT STRATEGY', 'GROWTH'].map((tag) => (
                        <div key={tag} className="bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-sm text-white shadow-sm">
                          {tag}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="relative">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center px-4 sm:px-6 mb-3 pt-8 sm:pt-12">
            <h2 className="text-xl font-medium mb-4 sm:mb-0">Research</h2>
            <div className="flex items-center gap-4">
              <div className="flex gap-1">
                <button 
                  onClick={() => scrollSection('left', 'features-scroll')}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => scrollSection('right', 'features-scroll')}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          
          <div 
            id="features-scroll" 
            className="px-4 sm:px-6 mb-8 sm:mb-12 overflow-x-auto overflow-y-hidden hide-scrollbar scroll-smooth mt-2"
          >
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
                {featureCards.map((card, index) => (
                  <div 
                    key={index} 
                    className="overflow-hidden relative group cursor-pointer rounded-2xl"
                  >
                    <div className="aspect-[3/4] relative">
                      <Image 
                        src={card.image} 
                        alt={card.role}
                        width={800}
                        height={1200}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90 group-hover:opacity-70 transition-opacity duration-300" />
                      
                      <div className="absolute inset-0 p-4 sm:p-6 flex flex-col h-full text-white">
                        <div className="mb-auto transform transition-all duration-300 group-hover:-translate-y-2">
                          <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl w-fit">
                            <card.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                          </div>
                          <h3 className="text-xl sm:text-2xl font-bold mt-4">{card.title}</h3>
                          <p className="text-white/80 mt-2">
                            {card.role}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mt-4 sm:mt-6 transform transition-all duration-300 group-hover:translate-y-2">
                          <span className="text-base sm:text-lg font-medium">{card.stat}</span>
                          <ArrowRight className="w-5 h-5 transform transition-transform duration-300 group-hover:translate-x-2" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Final CTA Section */}
        <section className="bg-gradient-to-r from-[#F8F0F9] to-blue-50 py-12 sm:py-16">
          <div className="max-w-6xl mx-auto text-center px-4 sm:px-6">
            <div className="bg-white/40 backdrop-blur-md rounded-3xl p-8 sm:p-24 border border-white/50 shadow-lg">
              <h2 className="text-2xl sm:text-4xl font-medium mb-6 sm:mb-8 text-gray-800">
                Instant insights. Smarter strategy.{' '}
                <span className="block mt-2">Limitless growth for creators.</span>
              </h2>
              <button
                onClick={() => router.push('/register')}
                className="mt-6 sm:mt-8 bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600 transition-colors inline-flex items-center gap-2"
              >
                Try HeyContent
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* Stats/Footer */}
        <footer className="border-t py-8 sm:py-12 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div>
              <h3 className="font-medium mb-4">Product</h3>
              <div className="flex flex-col gap-3 text-gray-600">
                <button className="hover:text-gray-900 text-left">Overview</button>
                <button className="hover:text-gray-900 text-left">Pricing</button>
                <button className="hover:text-gray-900 text-left">Features</button>
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-4">Company</h3>
              <div className="flex flex-col gap-3 text-gray-600">
                <Link href="/about" className="hover:text-gray-900 text-left">
                  About us
                </Link>
                <button className="hover:text-gray-900 text-left">Careers</button>
                <button className="hover:text-gray-900 text-left">Contact</button>
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-4">Resources</h3>
              <div className="flex flex-col gap-3 text-gray-600">
                <button className="hover:text-gray-900 text-left">Blog</button>
                <button className="hover:text-gray-900 text-left">Documentation</button>
                <button className="hover:text-gray-900 text-left">Help Center</button>
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-4">Legal</h3>
              <div className="flex flex-col gap-3 text-gray-600">
                <Link href="/privacy" className="hover:text-gray-900 text-left">
                  Privacy
                </Link>
                <Link href="/terms" className="hover:text-gray-900 text-left">
                  Terms
                </Link>
                <Link href="/security" className="hover:text-gray-900 text-left">
                  Security
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </section>
    </div>
  )
} 