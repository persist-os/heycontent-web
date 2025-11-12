'use client'

import React from 'react'
import { T } from '@/components/translation'

export function WhoThisIsFor() {
  return (
    <section className="py-12 sm:py-20 lg:py-32 bg-gradient-to-br from-primary/[0.08] via-accent/[0.06] to-primary/[0.08] dark:from-background dark:via-accent/[0.03] dark:to-background relative overflow-hidden min-h-screen flex items-center">
      {/* Animated background elements - smaller on mobile */}
      <div className="absolute top-1/4 left-1/3 w-[200px] h-[200px] sm:w-[400px] sm:h-[400px] lg:w-[500px] lg:h-[500px] bg-gradient-to-br from-primary/[0.20] to-accent/[0.15] dark:from-primary/[0.05] dark:to-accent/[0.04] rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/3 w-[180px] h-[180px] sm:w-[350px] sm:h-[350px] lg:w-[450px] lg:h-[450px] bg-gradient-to-br from-accent/[0.18] to-primary/[0.12] dark:from-accent/[0.04] dark:to-primary/[0.03] rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '2s'}} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 w-full relative z-10">
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-14 lg:mb-20">
          <h2 className="text-xl sm:text-3xl lg:text-5xl font-light text-foreground leading-tight hover:text-foreground/80 transition-colors duration-300 cursor-default">
            Who Wins With This
          </h2>
        </div>

        {/* Three Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 lg:gap-16">
          {/* Last-Minute Heroes */}
          <div className="space-y-4 sm:space-y-6">
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-lg sm:text-xl lg:text-2xl font-medium text-foreground">
                Last-Minute Heroes
              </h3>
              <p className="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed">
                Board meeting in 2 hours. Need strategy, analysis, presentation.
              </p>
              <p className="text-sm sm:text-base lg:text-lg text-primary font-medium">
                → Complete system in 90 seconds
              </p>
            </div>
          </div>

          {/* Drowning Founders */}
          <div className="space-y-4 sm:space-y-6">
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-lg sm:text-xl lg:text-2xl font-medium text-foreground">
                Drowning Founders
              </h3>
              <p className="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed">
                Launch needs 12 things. You have 10 minutes.
              </p>
              <p className="text-sm sm:text-base lg:text-lg text-primary font-medium">
                → Everything built and connected
              </p>
            </div>
          </div>

          {/* Teams Starting From Zero */}
          <div className="space-y-4 sm:space-y-6">
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-lg sm:text-xl lg:text-2xl font-medium text-foreground">
                Teams Starting From Zero
              </h3>
              <p className="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed">
                Stop making the same templates.
              </p>
              <p className="text-sm sm:text-base lg:text-lg text-primary font-medium">
                → One request, everyone's aligned
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.05); }
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }
      `}</style>
    </section>
  )
}

