'use client'

console.log('[LandingPage] Module loaded');

import React from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { HeroSection } from '../components/ui/hero-section'
import { AgentsShowcase } from '../components/ui/agents-showcase'
import Footer from '../components/ui/Footer'

const featureCards = [
  {
    title: "Intuitively designed",
    description: "Carefully crafted interface that feels natural from the first interaction. Every element placed with intention, every workflow refined for effortless use."
  },
  {
    title: "Privately yours", 
    description: "Your conversations, thoughts, and preferences remain exclusively yours. Zero data sharing, zero external access, zero compromise on your personal privacy."
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
        <div className="min-h-screen flex flex-col">
        <HeroSection />
      

      
      <AgentsShowcase />
      
            {/* Features Section */}
      <section className="py-40 bg-gradient-to-b from-slate-50 via-blue-50/10 to-slate-50 dark:from-slate-900 dark:via-blue-950/5 dark:to-slate-900 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute top-1/2 left-0 w-72 h-72 bg-gradient-to-r from-blue-200/25 to-cyan-200/20 dark:from-blue-800/12 dark:to-cyan-800/8 rounded-full blur-3xl animate-drift-right" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-l from-indigo-200/20 to-purple-200/15 dark:from-indigo-800/10 dark:to-purple-800/6 rounded-full blur-3xl animate-drift-left" />
        <div className="absolute top-0 right-1/4 w-64 h-64 bg-gradient-to-br from-emerald-200/15 to-teal-200/10 dark:from-emerald-800/8 dark:to-teal-800/4 rounded-full blur-3xl animate-drift-slow" />
        
        <div className="max-w-5xl mx-auto px-8 sm:px-12 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
            {featureCards.map((card, index) => (
              <div 
                key={index} 
                className="group space-y-8 p-10 rounded-3xl hover:bg-white/60 dark:hover:bg-slate-800/40 transition-all duration-700 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/10 cursor-default backdrop-blur-sm animate-slide-in border border-slate-200/30 dark:border-slate-700/30 hover:border-blue-300/50 dark:hover:border-blue-600/30"
                style={{animationDelay: `${index * 0.4}s`}}
              >
                <h3 className="text-3xl font-light text-slate-900 dark:text-slate-100 tracking-wide group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-all duration-500 group-hover:scale-105 transform-gpu">
                  {card.title}
                </h3>
                <div className="w-16 h-0.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left" />
                <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed font-light group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors duration-500">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <style jsx>{`
          @keyframes slide-in {
            from {
              opacity: 0;
              transform: translateY(50px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes drift-right {
            0%, 100% { transform: translateX(0px) translateY(0px); }
            33% { transform: translateX(40px) translateY(-20px); }
            66% { transform: translateX(-30px) translateY(25px); }
          }
          
          @keyframes drift-left {
            0%, 100% { transform: translateX(0px) translateY(0px); }
            33% { transform: translateX(-35px) translateY(20px); }
            66% { transform: translateX(25px) translateY(-30px); }
          }
          
          @keyframes drift-slow {
            0%, 100% { transform: translateX(0px) translateY(0px); }
            50% { transform: translateX(15px) translateY(-15px); }
          }
          
          .animate-slide-in {
            animation: slide-in 1.2s ease-out forwards;
            opacity: 0;
          }
          
          .animate-drift-right {
            animation: drift-right 15s ease-in-out infinite;
          }
          
          .animate-drift-left {
            animation: drift-left 18s ease-in-out infinite;
          }
          
          .animate-drift-slow {
            animation: drift-slow 20s ease-in-out infinite;
          }
        `}</style>
      </section>

        <Footer />
    </div>
  );
} 