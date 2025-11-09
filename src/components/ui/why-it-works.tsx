'use client'

import React from 'react'
import { T } from '@/components/translation'

export function WhyItWorks() {
  return (
    <section className="py-12 sm:py-20 lg:py-32 bg-foreground text-background relative overflow-hidden min-h-screen flex items-center">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-12 relative z-10 w-full">
        <div className="space-y-8 sm:space-y-12 lg:space-y-16">
          <div className="text-center space-y-3 sm:space-y-4 lg:space-y-6">
            <h2 className="text-xl sm:text-3xl lg:text-5xl font-light leading-tight hover:text-background/90 transition-colors duration-300 cursor-default">
              <T context="whyItWorks.heading">The Magic Explained</T>
            </h2>
          </div>

          <div className="space-y-6 sm:space-y-8 lg:space-y-12">
            <div className="text-center space-y-4 sm:space-y-6 lg:space-y-8">
              <div className="space-y-2 sm:space-y-3 lg:space-y-4 p-3 sm:p-4 rounded-lg hover:bg-background/10 transition-all duration-300 cursor-pointer">
                <p className="text-base sm:text-lg lg:text-2xl font-light text-background">
                  <T context="whyItWorks.benefit1.title">One Message, Many Results</T>
                </p>
                <p className="text-xs sm:text-sm lg:text-base text-background/90 max-w-2xl mx-auto leading-relaxed">
                  <T context="whyItWorks.benefit1.description">ChatGPT gives you one answer. HeyContext gives you complete projects.</T>
                </p>
              </div>

              <div className="space-y-2 sm:space-y-3 lg:space-y-4 p-3 sm:p-4 rounded-lg hover:bg-background/10 transition-all duration-300 cursor-pointer">
                <p className="text-base sm:text-lg lg:text-2xl font-light text-background">
                  <T context="whyItWorks.benefit2.title">Designed to help you reclaim your time</T>
                </p>
                <p className="text-xs sm:text-sm lg:text-base text-background/90 max-w-2xl mx-auto leading-relaxed">
                  <T context="whyItWorks.benefit2.description">Stop wasting time going back and forth with a chatbot. </T>
                </p>
              </div>

              <div className="space-y-2 sm:space-y-3 lg:space-y-4 p-3 sm:p-4 rounded-lg hover:bg-background/10 transition-all duration-300 cursor-pointer">
                <p className="text-base sm:text-lg lg:text-2xl font-light text-background">
                  <T context="whyItWorks.benefit3.title">Works While You Don't</T>
                </p>
                <p className="text-xs sm:text-sm lg:text-base text-background/90 max-w-2xl mx-auto leading-relaxed">
                  <T context="whyItWorks.benefit3.description">Watch results appear in real-time. Or schedule work and return to completed deliverables. Your system never sleeps.</T>
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-background/20 pt-8 sm:pt-12 lg:pt-16">
            <div className="text-center space-y-3 sm:space-y-4 lg:space-y-6">
              <p className="text-base sm:text-lg lg:text-xl font-light text-background max-w-2xl mx-auto leading-relaxed hover:text-background transition-colors duration-300 cursor-default">
                <T context="whyItWorks.closing1">Elevate the way you use AI.</T>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
