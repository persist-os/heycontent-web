'use client'

console.log('[LandingPage] Module loaded');

import React from 'react'
import { ArrowRight, Brain, Target, ChartBar, ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { HeroSection } from '../components/ui/hero-section'
import Link from 'next/link'
import Tilt from 'react-parallax-tilt'

const featureCards = [
  {
    title: "Powered by Real Insight",
    description: "We don't guess. HeyContent is driven by your actual content, performance data, and goals, so every suggestion is rooted in you.",
    icon: ChartBar,
    gradient: "bg-[radial-gradient(circle_at_60%_40%,_#43e97b_0%,_#38f9d7_50%,_#fa8bff_100%)]",
    textColor: "text-black"
  },
  {
    title: "Built to Grow With You",
    description: "From your first idea to your first brand deal, HeyContent evolves with your goals, not just to help you create, but to help you grow.",
    icon: Clock,
    gradient: "bg-[radial-gradient(circle_at_60%_40%,_#f7971e_0%,_#ffd200_50%,_#21d4fd_100%)]",
    textColor: "text-black"
  },
  {
    title: "Smarter With Every Use",
    description: "The more you use it, the better it gets. HeyContent learns your rhythm, your wins, and what works for your audience, then helps you repeat it.",
    icon: Brain,
    gradient: "bg-[radial-gradient(circle_at_60%_40%,_#f9d423_0%,_#ff4e50_100%)]",
    textColor: "text-black"
  }
]

export default function LandingPage() {
  console.log('[LandingPage] Function start');
  const router = useRouter()

  const scrollSection = (direction: 'left' | 'right', elementId: string) => {
    const container = document.getElementById(elementId)
    if (container) {
      const scrollAmount = direction === 'left' ? -container.offsetWidth : container.offsetWidth
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  console.log('[LandingPage] Before render');

  return (
    <div className="overflow-x-hidden">
      <div className="relative">
        <HeroSection />
      </div>
      
      <section className="min-h-screen bg-gradient-to-r from-[#F8F0F9] to-blue-50">
        {/* Featured Influencers */}
        <div className="relative">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center px-4 sm:px-6 mb-3 pt-8 sm:pt-12">
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold mb-2">Vibe. Create. Repeat.</h2>
            </div>
          </div>
          
          <div 
            id="featured-scroll" 
            className="mb-8 sm:mb-12 px-4 sm:px-6 overflow-x-auto overflow-y-visible hide-scrollbar scroll-smooth mt-2 py-8"
          >
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10 lg:gap-12">
                {/* First Card - Feels Like You */}
                <div className="rainbow-glow-border rounded-2xl p-[3px] overflow-visible">
                  <Tilt
                    tiltMaxAngleX={10}
                    tiltMaxAngleY={10}
                    perspective={1000}
                    scale={1.05}
                    transitionSpeed={2000}
                    className="will-change-transform"
                  >
                    <div className="aspect-[16/9] relative rounded-2xl overflow-hidden">
                      <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_60%_40%,_#fa8bff_0%,_#fbc2eb_100%)] transition-all duration-300" />
                      <div className="card-noise-overlay absolute inset-0 rounded-2xl pointer-events-none z-10" />
                      {/* Icon in corner */}
                      <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8 opacity-20">
                        <svg className="w-6 h-6 text-black" viewBox="0 0 24 24" fill="none">
                          <path d="M12 2C9.24 2 7 4.24 7 7C7 9.76 9.24 12 12 12C14.76 12 17 9.76 17 7C17 4.24 14.76 2 12 2ZM12 10C10.35 10 9 8.65 9 7C9 5.35 10.35 4 12 4C13.65 4 15 5.35 15 7C15 8.65 13.65 10 12 10Z" fill="currentColor"/>
                          <path d="M12 14C8.13 14 5 17.13 5 21H7C7 18.24 9.24 16 12 16C14.76 16 17 18.24 17 21H19C19 17.13 15.87 14 12 14Z" fill="currentColor"/>
                        </svg>
                      </div>
                      <div className="absolute inset-0 p-8 flex flex-col justify-between h-full">
                        <div>
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg">
                              <svg className="w-6 h-6 text-black" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2C9.24 2 7 4.24 7 7C7 9.76 9.24 12 12 12C14.76 12 17 9.76 17 7C17 4.24 14.76 2 12 2ZM12 10C10.35 10 9 8.65 9 7C9 5.35 10.35 4 12 4C13.65 4 15 5.35 15 7C15 8.65 13.65 10 12 10Z" fill="currentColor"/>
                                <path d="M12 14C8.13 14 5 17.13 5 21H7C7 18.24 9.24 16 12 16C14.76 16 17 18.24 17 21H19C19 17.13 15.87 14 12 14Z" fill="currentColor"/>
                              </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-black">Feels Like You</h3>
                          </div>
                        </div>
                        <p className="text-black/90 text-lg font-semibold max-w-[80%]">
                          Your vibe, your voice. HeyContent adapts to your style so your ideas come out sounding like you on your best day.
                        </p>
                      </div>
                    </div>
                  </Tilt>
                </div>
                
                {/* Second Card - Creative Intelligence */}
                <div className="rainbow-glow-border rounded-2xl p-[3px] overflow-visible">
                  <Tilt
                    tiltMaxAngleX={10}
                    tiltMaxAngleY={10}
                    perspective={1000}
                    scale={1.05}
                    transitionSpeed={2000}
                    className="will-change-transform"
                  >
                    <div className="aspect-[16/9] relative rounded-2xl overflow-hidden">
                      <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_60%_40%,_#43e97b_0%,_#38f9d7_50%,_#fa8bff_100%)] transition-all duration-300" />
                      <div className="card-noise-overlay absolute inset-0 rounded-2xl pointer-events-none z-10" />
                      {/* Icon in corner */}
                      <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8 opacity-20">
                        <svg className="w-6 h-6 text-black" viewBox="0 0 24 24" fill="none">
                          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="currentColor"/>
                          <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18C15.31 18 18 15.31 18 12C18 8.69 15.31 6 12 6ZM12 16C9.79 16 8 14.21 8 12C8 9.79 9.79 8 12 8C14.21 8 16 9.79 16 12C16 14.21 14.21 16 12 16Z" fill="currentColor"/>
                        </svg>
                      </div>
                      <div className="absolute inset-0 p-8 flex flex-col justify-between h-full">
                        <div>
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg">
                              <svg className="w-6 h-6 text-black" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="currentColor"/>
                                <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18C15.31 18 18 15.31 18 12C18 8.69 15.31 6 12 6ZM12 16C9.79 16 8 14.21 8 12C8 9.79 9.79 8 12 8C14.21 8 16 9.79 16 12C16 14.21 14.21 16 12 16Z" fill="currentColor"/>
                              </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-black">Creative Intelligence</h3>
                          </div>
                        </div>
                        <p className="text-black/90 text-lg font-semibold max-w-[80%]">
                          Fueled by your content, your goals, and real-world trends. HeyContent learns how you think and helps you think better.
                        </p>
                      </div>
                    </div>
                  </Tilt>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="relative">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center px-4 sm:px-6 mb-3 pt-8 sm:pt-12">
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold mb-2">Always Evolving.</h2>
            </div>
          </div>
          
          <div 
            id="features-scroll" 
            className="px-4 sm:px-6 mb-8 sm:mb-12 overflow-x-auto overflow-y-visible hide-scrollbar scroll-smooth mt-2 py-8"
          >
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10 lg:gap-12">
                {featureCards.map((card, index) => (
                  <div className="rainbow-glow-border rounded-2xl p-[3px] group cursor-pointer overflow-visible">
                    <Tilt
                      tiltMaxAngleX={10}
                      tiltMaxAngleY={10}
                      perspective={1000}
                      scale={1.05}
                      transitionSpeed={2000}
                      className="will-change-transform"
                    >
                      <div 
                        key={index} 
                        className="overflow-hidden relative rounded-2xl transition-all duration-300"
                      >
                        <div className="aspect-[3/4] relative">
                          <div className={`absolute inset-0 rounded-2xl ${card.gradient} transition-all duration-300`} />
                          <div className="card-noise-overlay absolute inset-0 rounded-2xl pointer-events-none z-10" />
                          {/* Decorative pattern */}
                          <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8 opacity-20">
                            <card.icon className="w-6 h-6 text-black" />
                          </div>
                          <div className="absolute inset-0 p-8 flex flex-col justify-between h-full">
                            <div>
                              <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg">
                                  <card.icon className="w-6 h-6 text-black" />
                                </div>
                                <h3 className="text-2xl font-bold text-black">{card.title}</h3>
                              </div>
                            </div>
                            <p className="text-black/90 text-lg font-semibold max-w-[80%]">
                              {card.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Tilt>
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
                onClick={() => router.push('/auth/register')}
                className="mt-6 sm:mt-8 bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors inline-flex items-center gap-2"
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
  );
} 