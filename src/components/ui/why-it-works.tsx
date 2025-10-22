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
              <T context="whyItWorks.heading">Most AI makes you work for it. This one works for you.</T>
            </h2>
          </div>

          <div className="space-y-8 sm:space-y-12">
            <div className="text-center space-y-6 sm:space-y-8">
              <div className="space-y-3 sm:space-y-4 p-4 rounded-lg hover:bg-background/5 transition-all duration-300 cursor-pointer">
                <p className="text-lg sm:text-2xl font-light text-background/80">
                  <T context="whyItWorks.benefit1.title">Start where you left off, instantly</T>
                </p>
                <p className="text-sm sm:text-base text-background/60 max-w-2xl mx-auto leading-relaxed">
                  <T context="whyItWorks.benefit1.description">No more "wait, what was I doing?" No more rereading yesterday's notes. No more rebuilding context in your head. Open it up, and it remembers exactly where your thinking left off. Including the details you forgot.</T>
                </p>
              </div>

              <div className="space-y-3 sm:space-y-4 p-4 rounded-lg hover:bg-background/5 transition-all duration-300 cursor-pointer">
                <p className="text-lg sm:text-2xl font-light text-background/80">
                  <T context="whyItWorks.benefit2.title">Explain yourself once, never again</T>
                </p>
                <p className="text-sm sm:text-base text-background/60 max-w-2xl mx-auto leading-relaxed">
                  <T context="whyItWorks.benefit2.description">How you prefer feedback. What matters in your work. Which ideas you're exploring. Your communication style. Every pattern learned once and remembered forever. It adapts to you instead of making you adapt to it.</T>
                </p>
              </div>

              <div className="space-y-3 sm:space-y-4 p-4 rounded-lg hover:bg-background/5 transition-all duration-300 cursor-pointer">
                <p className="text-lg sm:text-2xl font-light text-background/80">
                  <T context="whyItWorks.benefit3.title">Stop managing, start creating</T>
                </p>
                <p className="text-sm sm:text-base text-background/60 max-w-2xl mx-auto leading-relaxed">
                  <T context="whyItWorks.benefit3.description">No folders to organize. No tags to maintain. No systems to manage. Talk naturally about your work. The structure builds itself. Connections form automatically. You focus on thinking. It handles the rest.</T>
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-background/20 pt-12 sm:pt-16">
            <div className="text-center space-y-4 sm:space-y-6">
              <p className="text-lg sm:text-xl font-light text-background/80 max-w-2xl mx-auto leading-relaxed hover:text-background/90 transition-colors duration-300 cursor-default">
                <T context="whyItWorks.closing1">The more you use it, the more valuable it becomes. Not because you put in more effort.</T>
              </p>
              <p className="text-sm sm:text-base text-background/60 max-w-xl mx-auto hover:text-background/70 transition-colors duration-300 cursor-default">
                <T context="whyItWorks.closing2">Because it's actually learning.</T>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
