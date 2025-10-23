'use client'

import React from 'react'
import { T } from '@/components/translation'

export function WhyItWorks() {
  return (
    <section className="py-20 sm:py-28 lg:py-32 bg-foreground text-background relative overflow-hidden min-h-screen flex items-center">
      <div className="max-w-4xl mx-auto px-4 sm:px-8 lg:px-12 relative z-10 w-full">
        <div className="space-y-12 sm:space-y-16">
          <div className="text-center space-y-4 sm:space-y-6">
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-light leading-tight hover:text-background/90 transition-colors duration-300 cursor-default">
              <T context="whyItWorks.heading">The Living, Evolving AI System.</T>
            </h2>
          </div>

          <div className="space-y-8 sm:space-y-12">
            <div className="text-center space-y-6 sm:space-y-8">
              <div className="space-y-3 sm:space-y-4 p-4 rounded-lg hover:bg-background/5 transition-all duration-300 cursor-pointer">
                <p className="text-lg sm:text-2xl font-light text-background/80">
                  <T context="whyItWorks.benefit1.title">Constellations that evolve with you</T>
                </p>
                <p className="text-sm sm:text-base text-background/60 max-w-2xl mx-auto leading-relaxed">
                  <T context="whyItWorks.benefit1.description">Your projects aren't static folders—they're living constellations that discover who you are and generate custom tools. AI learns your working style, creates personalized widgets and assistants, then watches how you use them to get even smarter. Each project develops its own intelligence fingerprint.</T>
                </p>
              </div>

              <div className="space-y-3 sm:space-y-4 p-4 rounded-lg hover:bg-background/5 transition-all duration-300 cursor-pointer">
                <p className="text-lg sm:text-2xl font-light text-background/80">
                  <T context="whyItWorks.benefit2.title">Thinking Lab that remembers everything</T>
                </p>
                <p className="text-sm sm:text-base text-background/60 max-w-2xl mx-auto leading-relaxed">
                  <T context="whyItWorks.benefit2.description">Have conversations that never forget. Every chat builds on the last, creating a web of connected ideas across time. When you ask "What should I focus on?" it knows your current projects, past decisions, and evolving priorities. It's like talking to someone who's been paying attention to your entire journey.</T>
                </p>
              </div>

              <div className="space-y-3 sm:space-y-4 p-4 rounded-lg hover:bg-background/5 transition-all duration-300 cursor-pointer">
                <p className="text-lg sm:text-2xl font-light text-background/80">
                  <T context="whyItWorks.benefit3.title">Cosmic Intelligence that spots patterns</T>
                </p>
                <p className="text-sm sm:text-base text-background/60 max-w-2xl mx-auto leading-relaxed">
                  <T context="whyItWorks.benefit3.description">Watch insights crystallize from your patterns. Stars form from what you do—your projects and achievements that emerge from collected stardust. Crystals emerge from who you are—your thinking patterns and behavioral traits discovered during shard extraction. It's like having a mirror that shows you patterns you never noticed about yourself.</T>
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-background/20 pt-12 sm:pt-16">
            <div className="text-center space-y-4 sm:space-y-6">
              <p className="text-lg sm:text-xl font-light text-background/80 max-w-2xl mx-auto leading-relaxed hover:text-background/90 transition-colors duration-300 cursor-default">
                <T context="whyItWorks.closing1">It's not just AI assistance. It's your second brain.</T>
              </p>
              <p className="text-sm sm:text-base text-background/60 max-w-xl mx-auto hover:text-background/70 transition-colors duration-300 cursor-default">
                <T context="whyItWorks.closing2">A system that awakens your mind to possibilities you never imagined.</T>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
