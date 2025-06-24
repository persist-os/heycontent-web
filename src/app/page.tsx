'use client'

console.log('[LandingPage] Module loaded');

import React from 'react'
import { ArrowRight, Brain, Target, ChartBar, ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { HeroSection } from '../components/ui/hero-section'
import Link from 'next/link'
import Tilt from 'react-parallax-tilt'
import Footer from '../components/ui/Footer'

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
    <div className="min-h-screen flex flex-col overflow-x-hidden light-mode-forced" style={{
      '--background': '0 0% 100%', // Force white background
      '--foreground': '240 10% 3.9%', // Force dark text
      '--card': '0 0% 100%',
      '--card-foreground': '240 10% 3.9%',
      '--popover': '0 0% 100%',
      '--popover-foreground': '240 10% 3.9%',
      '--primary': '55 95% 58%', // Keep HeyContent yellow
      '--primary-foreground': '0 0% 0%',
      '--secondary': '240 4.8% 95.9%',
      '--secondary-foreground': '240 5.9% 10%',
      '--muted': '240 4.8% 95.9%',
      '--muted-foreground': '240 3.8% 46.1%',
      '--accent': '55 95% 58%',
      '--accent-foreground': '0 0% 0%',
      '--destructive': '0 84.2% 60.2%',
      '--destructive-foreground': '0 0% 98%',
      '--border': '240 5.9% 90%',
      '--input': '240 5.9% 90%',
      '--ring': '55 95% 58%',
    } as React.CSSProperties}>
      <div className="relative flex-shrink-0">
        <HeroSection />
      </div>
      
      {/* Section Title */}
      <section className="bg-gradient-to-r from-[#F8F0F9] to-blue-50 pt-0 pb-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-sm rounded-full border border-white/20 mb-6">
            <span className="text-sm font-medium bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent" style={{color: '#6D28D9'}}>
              ✨ The Future of Content Creation
            </span>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-gray-900 via-purple-800 to-blue-800 bg-clip-text text-transparent leading-relaxed tracking-tight py-2" style={{color: '#111827'}}>
            Where Creativity Meets Intelligence
          </h2>
          <p className="text-xl sm:text-2xl text-gray-600 leading-relaxed mt-6 max-w-4xl mx-auto" style={{color: '#374151'}}>
            Experience the perfect blend of human creativity and AI intelligence. 
            Transform your ideas into engaging content that resonates with your audience.
          </p>
          
          {/* Compact Feature Badges */}
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/30 backdrop-blur-sm rounded-full border border-white/40 text-sm font-medium text-gray-700" style={{color: '#374151'}}>
              <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
              Smart Content Analysis
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/30 backdrop-blur-sm rounded-full border border-white/40 text-sm font-medium text-gray-700" style={{color: '#374151'}}>
              <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
              Personalized Insights
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/30 backdrop-blur-sm rounded-full border border-white/40 text-sm font-medium text-gray-700" style={{color: '#374151'}}>
              <div className="w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
              Growth Optimization
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/30 backdrop-blur-sm rounded-full border border-white/40 text-sm font-medium text-gray-700" style={{color: '#374151'}}>
              <div className="w-2 h-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
              Real-time Feedback
            </div>
          </div>
        </div>
      </section>
      
      {/* Modern Image Section */}
      <section className="relative py-8 sm:py-12 bg-gradient-to-r from-[#F8F0F9] to-blue-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="relative">
            {/* Background decorative elements */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-100/20 to-blue-100/20 rounded-3xl blur-3xl"></div>
            <div className="absolute top-0 left-1/4 w-72 h-72 bg-gradient-to-r from-pink-200/30 to-purple-200/30 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-r from-blue-200/30 to-cyan-200/30 rounded-full blur-2xl"></div>
            
            {/* Image container - Now much bigger and centered */}
            <div className="relative max-w-6xl mx-auto">
              <div className="relative group">
                {/* Glow effect behind image */}
                <div className="absolute -inset-10 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
                
                {/* Image wrapper with tilt effect */}
                <Tilt
                  tiltMaxAngleX={4}
                  tiltMaxAngleY={4}
                  perspective={1000}
                  scale={1.02}
                  transitionSpeed={1500}
                  className="relative"
                >
                  <div className="relative overflow-hidden rounded-3xl bg-white/60 backdrop-blur-sm p-8 sm:p-10 shadow-xl">
                    <Image
                      src="/0093.png"
                      alt="Creative Content Vision"
                      width={1200}
                      height={720}
                      className="w-full h-auto rounded-2xl object-cover transition-transform duration-700 group-hover:scale-105"
                      priority
                    />
                    
                    {/* Overlay gradient */}
                    <div className="absolute inset-8 sm:inset-10 rounded-2xl bg-gradient-to-t from-black/5 via-transparent to-transparent pointer-events-none"></div>
                  </div>
                </Tilt>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <section className="flex-1 flex flex-col justify-center bg-gradient-to-r from-[#F8F0F9] to-blue-50">
        {/* Featured Influencers */}
        <div className="relative">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center px-4 sm:px-6 mb-3 pt-8 sm:pt-12">
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold mb-2" style={{color: '#111827'}}>
                Vibe. Create. Repeat.
              </h2>
            </div>
          </div>
          
          <div 
            id="featured-scroll" 
            className="mb-8 sm:mb-12 px-4 sm:px-6 overflow-x-auto overflow-y-visible hide-scrollbar scroll-smooth mt-2 py-8"
          >
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10 lg:gap-12">
                {/* First Card - Feels Like You */}
                <div className="rainbow-glow-border rounded-2xl p-[3px] overflow-visible w-full max-w-full">
                  <Tilt
                    tiltMaxAngleX={10}
                    tiltMaxAngleY={10}
                    perspective={1000}
                    scale={1.05}
                    transitionSpeed={2000}
                    className="will-change-transform w-full max-w-full"
                  >
                    <div className="relative rounded-2xl overflow-hidden p-4 sm:p-0 w-full max-w-full min-w-0 flex flex-col justify-between px-6 py-10 sm:px-10 sm:py-14" style={{ minHeight: 270 }}>
                      <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_60%_40%,_#fa8bff_0%,_#fbc2eb_100%)] transition-all duration-300" />
                      <div className="card-noise-overlay absolute inset-0 rounded-2xl pointer-events-none z-10" />
                      {/* Icon in corner */}
                      <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8 opacity-20">
                        <svg className="w-6 h-6 text-black" viewBox="0 0 24 24" fill="none">
                          <path d="M12 2C9.24 2 7 4.24 7 7C7 9.76 9.24 12 12 12C14.76 12 17 9.76 17 7C17 4.24 14.76 2 12 2ZM12 10C10.35 10 9 8.65 9 7C9 5.35 10.35 4 12 4C13.65 4 15 5.35 15 7C15 8.65 13.65 10 12 10Z" fill="currentColor"/>
                          <path d="M12 14C8.13 14 5 17.13 5 21H7C7 18.24 9.24 16 12 16C14.76 16 17 18.24 17 21H19C19 17.13 15.87 14 12 14Z" fill="currentColor"/>
                        </svg>
                      </div>
                      <div className="relative z-10 flex flex-col justify-between h-full w-full max-w-full min-w-0">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg">
                            <svg className="w-6 h-6 text-black" viewBox="0 0 24 24" fill="none">
                              <path d="M12 2C9.24 2 7 4.24 7 7C7 9.76 9.24 12 12 12C14.76 12 17 9.76 17 7C17 4.24 14.76 2 12 2ZM12 10C10.35 10 9 8.65 9 7C9 5.35 10.35 4 12 4C13.65 4 15 5.35 15 7C15 8.65 13.65 10 12 10Z" fill="currentColor"/>
                              <path d="M12 14C8.13 14 5 17.13 5 21H7C7 18.24 9.24 16 12 16C14.76 16 17 18.24 17 21H19C19 17.13 15.87 14 12 14Z" fill="currentColor"/>
                            </svg>
                          </div>
                          <h3 className="text-2xl font-bold text-black" style={{color: '#111827'}}>Feels Like You</h3>
                        </div>
                        <p className="text-black/90 text-lg font-semibold max-w-[90%]" style={{color: '#111827', lineHeight: 1.7}}>
                          Your vibe, your voice. HeyContent adapts to your style so your ideas come out sounding like you on your best day.
                        </p>
                      </div>
                    </div>
                  </Tilt>
                </div>
                
                {/* Second Card - Creative Intelligence */}
                <div className="rainbow-glow-border rounded-2xl p-[3px] overflow-visible w-full max-w-full">
                  <Tilt
                    tiltMaxAngleX={10}
                    tiltMaxAngleY={10}
                    perspective={1000}
                    scale={1.05}
                    transitionSpeed={2000}
                    className="will-change-transform w-full max-w-full"
                  >
                    <div className="relative rounded-2xl overflow-hidden p-4 sm:p-0 w-full max-w-full min-w-0 flex flex-col justify-between px-6 py-10 sm:px-10 sm:py-14" style={{ minHeight: 270 }}>
                      <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_60%_40%,_#43e97b_0%,_#38f9d7_50%,_#fa8bff_100%)] transition-all duration-300" />
                      <div className="card-noise-overlay absolute inset-0 rounded-2xl pointer-events-none z-10" />
                      {/* Icon in corner */}
                      <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8 opacity-20">
                        <svg className="w-6 h-6 text-black" viewBox="0 0 24 24" fill="none">
                          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="currentColor"/>
                          <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18C15.31 18 18 15.31 18 12C18 8.69 15.31 6 12 6ZM12 16C9.79 16 8 14.21 8 12C8 9.79 9.79 8 12 8C14.21 8 16 9.79 16 12C16 14.21 14.21 16 12 16Z" fill="currentColor"/>
                        </svg>
                      </div>
                      <div className="relative z-10 flex flex-col justify-between h-full w-full max-w-full min-w-0">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg">
                            <svg className="w-6 h-6 text-black" viewBox="0 0 24 24" fill="none">
                              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="currentColor"/>
                              <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18C15.31 18 18 15.31 18 12C18 8.69 15.31 6 12 6ZM12 16C9.79 16 8 14.21 8 12C8 9.79 9.79 8 12 8C14.21 8 16 9.79 16 12C16 14.21 14.21 16 12 16Z" fill="currentColor"/>
                            </svg>
                          </div>
                          <h3 className="text-2xl font-bold text-black" style={{color: '#111827'}}>Creative Intelligence</h3>
                        </div>
                        <p className="text-black/90 text-lg font-semibold max-w-[90%]" style={{color: '#111827', lineHeight: 1.7}}>
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
              <h2 className="text-3xl sm:text-4xl font-extrabold mb-2" style={{color: '#111827'}}>
                Always Evolving.
              </h2>
            </div>
          </div>
          
          <div 
            id="features-scroll" 
            className="px-4 sm:px-6 mb-8 sm:mb-12 overflow-x-auto overflow-y-visible hide-scrollbar scroll-smooth mt-2 py-8"
          >
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10 lg:gap-12 items-stretch">
                {featureCards.map((card, index) => (
                  <div key={index} className="rainbow-glow-border rounded-2xl p-[3px] group cursor-pointer overflow-visible w-full max-w-full h-full">
                    <Tilt
                      tiltMaxAngleX={10}
                      tiltMaxAngleY={10}
                      perspective={1000}
                      scale={1.05}
                      transitionSpeed={2000}
                      className="will-change-transform w-full max-w-full h-full"
                    >
                      <div 
                        className="overflow-hidden relative rounded-2xl transition-all duration-300 w-full max-w-full min-w-0 flex flex-col justify-between px-6 py-10 sm:px-10 sm:py-14 h-full" style={{ minHeight: 270 }}
                      >
                        <div className={`absolute inset-0 rounded-2xl ${card.gradient} transition-all duration-300`} />
                        <div className="card-noise-overlay absolute inset-0 rounded-2xl pointer-events-none z-10" />
                        {/* Decorative pattern */}
                        <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8 opacity-20">
                          <card.icon className="w-6 h-6 text-black" />
                        </div>
                        <div className="relative z-10 flex flex-col justify-between h-full w-full max-w-full min-w-0">
                          <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg">
                              <card.icon className="w-6 h-6 text-black" />
                            </div>
                            <h3 className="text-2xl font-bold text-black" style={{color: '#111827'}}>{card.title}</h3>
                          </div>
                          <p className="text-black/90 text-lg font-semibold max-w-[90%]" style={{color: '#111827', lineHeight: 1.7}}>
                            {card.description}
                          </p>
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
              <h2 className="text-2xl sm:text-4xl font-medium mb-6 sm:mb-8 text-gray-800" style={{color: '#111827'}}>
                Instant insights. Smarter strategy.{' '}
                <span className="block mt-2" style={{color: '#111827'}}>Limitless growth for creators.</span>
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
      </section>
      <footer className="flex-1 flex items-center justify-center">
        <Footer />
      </footer>
    </div>
  );
} 