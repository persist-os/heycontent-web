'use client'

import React from 'react'
import { T } from '@/components/translation'

export function TheDifference() {
  return (
    <section className="py-12 sm:py-20 lg:py-32 bg-gradient-to-br from-background via-primary/[0.02] to-accent/[0.02] dark:from-background dark:via-primary/[0.01] dark:to-accent/[0.01] relative overflow-hidden min-h-screen flex items-center">
      {/* Animated background elements */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 sm:w-96 sm:h-96 lg:w-[500px] lg:h-[500px] bg-gradient-to-br from-primary/[0.15] to-accent/[0.10] dark:from-primary/[0.05] dark:to-accent/[0.03] rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 sm:w-80 sm:h-80 lg:w-[450px] lg:h-[450px] bg-gradient-to-br from-accent/[0.12] to-primary/[0.08] dark:from-accent/[0.04] dark:to-primary/[0.02] rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '1s'}} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 w-full relative z-10">
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-14 lg:mb-20">
          <h2 className="text-xl sm:text-3xl lg:text-5xl font-light text-foreground leading-tight hover:text-foreground/80 transition-colors duration-300 cursor-default">
            <T context="section.difference.title">The Difference</T>
          </h2>
          <p className="mt-4 sm:mt-6 text-base sm:text-lg lg:text-xl text-muted-foreground font-light">
            <T context="section.difference.subtitle">We don't give advice. We build systems.</T>
          </p>
        </div>

        {/* What We Do */}
        <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
          <div className="space-y-4 sm:space-y-6">
            <div className="p-4 sm:p-5 rounded-lg bg-gradient-to-br from-primary/[0.10] to-accent/[0.08] dark:from-primary/[0.05] dark:to-accent/[0.03] border border-primary/30">
              <p className="text-sm sm:text-base lg:text-lg text-foreground font-medium">
                <T context="section.difference.example1">Need an email campaign? Here's your email campaign. Templates ready to send.</T>
              </p>
            </div>
            <div className="p-4 sm:p-5 rounded-lg bg-gradient-to-br from-primary/[0.10] to-accent/[0.08] dark:from-primary/[0.05] dark:to-accent/[0.03] border border-primary/30">
              <p className="text-sm sm:text-base lg:text-lg text-foreground font-medium">
                <T context="section.difference.example2">Need pricing strategies? Here's your pricing analysis. And the emails to announce it.</T>
              </p>
            </div>
            <div className="p-4 sm:p-5 rounded-lg bg-gradient-to-br from-primary/[0.10] to-accent/[0.08] dark:from-primary/[0.05] dark:to-accent/[0.03] border border-primary/30">
              <p className="text-sm sm:text-base lg:text-lg text-foreground font-medium">
                <T context="section.difference.example3">Need a timeline? Here's your timeline. It already knows your budget constraints.</T>
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.08; transform: scale(1); }
          50% { opacity: 0.25; transform: scale(1.05); }
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 6s ease-in-out infinite;
        }
      `}</style>
    </section>
  )
}

