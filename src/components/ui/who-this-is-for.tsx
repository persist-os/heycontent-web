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
            <T context="whoThisIsFor.heading">Immediate, ongoing results</T>
          </h2>
          <p className="mt-4 sm:mt-6 text-base sm:text-lg lg:text-xl text-muted-foreground font-light">
            <T context="whoThisIsFor.subheading">Send one message for deliverables you can use:</T>
          </p>
        </div>

        {/* Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16">
          {/* Left: For Individuals */}
          <div className="space-y-5 sm:space-y-6 lg:space-y-8">
            <div className="space-y-2 sm:space-y-3 lg:space-y-4">
              <h3 className="text-lg sm:text-xl lg:text-3xl font-medium text-foreground hover:text-primary transition-colors duration-300 cursor-default">
                <T context="whoThisIsFor.individuals.title">Your Personal Command Center</T>
              </h3>
              <div className="w-12 sm:w-16 h-1 bg-gradient-to-r from-primary to-accent rounded-full" />
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className="group flex items-start space-x-2 sm:space-x-3 p-2.5 sm:p-3 rounded-lg hover:bg-card/50 dark:hover:bg-card/30 hover:border-primary/[0.25] border border-primary/[0.10] transition-all duration-300 cursor-default">
                <span className="text-primary text-base sm:text-lg mt-0.5 group-hover:scale-110 group-hover:text-primary transition-transform duration-200 font-bold" aria-hidden="true">•</span>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground group-hover:text-foreground transition-colors duration-200">
                  <T context="whoThisIsFor.individuals.example1">Build a research framework—thematic organization, citation mapping, gap analysis</T>
                </p>
              </div>

              <div className="group flex items-start space-x-2 sm:space-x-3 p-2.5 sm:p-3 rounded-lg hover:bg-card/50 dark:hover:bg-card/30 hover:border-primary/[0.25] border border-primary/[0.10] transition-all duration-300 cursor-default">
                <span className="text-primary text-base sm:text-lg mt-0.5 group-hover:scale-110 group-hover:text-primary transition-transform duration-200 font-bold" aria-hidden="true">•</span>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground group-hover:text-foreground transition-colors duration-200">
                  <T context="whoThisIsFor.individuals.example2">Create a trading system framework—market analysis structure, strategy methodology, risk management framework</T>
                </p>
              </div>

              <div className="group flex items-start space-x-2 sm:space-x-3 p-2.5 sm:p-3 rounded-lg hover:bg-card/50 dark:hover:bg-card/30 hover:border-primary/[0.25] border border-primary/[0.10] transition-all duration-300 cursor-default">
                <span className="text-primary text-base sm:text-lg mt-0.5 group-hover:scale-110 group-hover:text-primary transition-transform duration-200 font-bold" aria-hidden="true">•</span>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground group-hover:text-foreground transition-colors duration-200">
                  <T context="whoThisIsFor.individuals.example3">Design a content series framework—topic progression, script structure, SEO strategy, visual concepts</T>
                </p>
              </div>

              <div className="group flex items-start space-x-2 sm:space-x-3 p-2.5 sm:p-3 rounded-lg hover:bg-card/50 dark:hover:bg-card/30 hover:border-primary/[0.25] border border-primary/[0.10] transition-all duration-300 cursor-default">
                <span className="text-primary text-base sm:text-lg mt-0.5 group-hover:scale-110 group-hover:text-primary transition-transform duration-200 font-bold" aria-hidden="true">•</span>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground group-hover:text-foreground transition-colors duration-200">
                  <T context="whoThisIsFor.individuals.example4">Structure a startup launch—task framework, dependency mapping, resource allocation system</T>
                </p>
              </div>

              <div className="group flex items-start space-x-2 sm:space-x-3 p-2.5 sm:p-3 rounded-lg hover:bg-card/50 dark:hover:bg-card/30 hover:border-primary/[0.25] border border-primary/[0.10] transition-all duration-300 cursor-default">
                <span className="text-primary text-base sm:text-lg mt-0.5 group-hover:scale-110 group-hover:text-primary transition-transform duration-200 font-bold" aria-hidden="true">•</span>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground group-hover:text-foreground transition-colors duration-200">
                  <T context="whoThisIsFor.individuals.example5">Build a learning framework—comprehensive roadmap, resource organization, mastery path</T>
                </p>
              </div>
            </div>

            <div className="pt-4 sm:pt-5 lg:pt-6 border-t border-primary/[0.20] dark:border-primary/[0.10]">
              <p className="text-sm sm:text-base lg:text-lg text-muted-foreground hover:text-foreground transition-colors duration-300 cursor-default font-light italic">
                <T context="whoThisIsFor.individuals.tagline">Drop off work. Come back. Framework ready. It keeps working and growing with you.</T>
              </p>
            </div>
          </div>

          {/* Right: For Businesses */}
          <div className="space-y-5 sm:space-y-6 lg:space-y-8">
            <div className="space-y-2 sm:space-y-3 lg:space-y-4">
              <h3 className="text-lg sm:text-xl lg:text-3xl font-medium text-foreground hover:text-accent transition-colors duration-300 cursor-default">
                <T context="whoThisIsFor.businesses.title">Your Team's Force Multiplier</T>
              </h3>
              <div className="w-12 sm:w-16 h-1 bg-gradient-to-r from-accent to-primary rounded-full" />
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className="group flex items-start space-x-2 sm:space-x-3 p-2.5 sm:p-3 rounded-lg hover:bg-card/50 dark:hover:bg-card/30 hover:border-accent/[0.25] border border-accent/[0.10] transition-all duration-300 cursor-default">
                <span className="text-accent text-base sm:text-lg mt-0.5 group-hover:scale-110 group-hover:text-accent transition-transform duration-200 font-bold" aria-hidden="true">•</span>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground group-hover:text-foreground transition-colors duration-200">
                  <T context="whoThisIsFor.businesses.example1">Build an acquisition framework—financial models, competitive analysis, synergy mapping, presentation structure</T>
                </p>
              </div>

              <div className="group flex items-start space-x-2 sm:space-x-3 p-2.5 sm:p-3 rounded-lg hover:bg-card/50 dark:hover:bg-card/30 hover:border-accent/[0.25] border border-accent/[0.10] transition-all duration-300 cursor-default">
                <span className="text-accent text-base sm:text-lg mt-0.5 group-hover:scale-110 group-hover:text-accent transition-transform duration-200 font-bold" aria-hidden="true">•</span>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground group-hover:text-foreground transition-colors duration-200">
                  <T context="whoThisIsFor.businesses.example2">Structure a legal brief—case law framework, citation network, argument architecture</T>
                </p>
              </div>

              <div className="group flex items-start space-x-2 sm:space-x-3 p-2.5 sm:p-3 rounded-lg hover:bg-card/50 dark:hover:bg-card/30 hover:border-accent/[0.25] border border-accent/[0.10] transition-all duration-300 cursor-default">
                <span className="text-accent text-base sm:text-lg mt-0.5 group-hover:scale-110 group-hover:text-accent transition-transform duration-200 font-bold" aria-hidden="true">•</span>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground group-hover:text-foreground transition-colors duration-200">
                  <T context="whoThisIsFor.businesses.example3">Create a planning framework—performance analysis structure, goal synthesis, resource allocation system</T>
                </p>
              </div>

              <div className="group flex items-start space-x-2 sm:space-x-3 p-2.5 sm:p-3 rounded-lg hover:bg-card/50 dark:hover:bg-card/30 hover:border-accent/[0.25] border border-accent/[0.10] transition-all duration-300 cursor-default">
                <span className="text-accent text-base sm:text-lg mt-0.5 group-hover:scale-110 group-hover:text-accent transition-transform duration-200 font-bold" aria-hidden="true">•</span>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground group-hover:text-foreground transition-colors duration-200">
                  <T context="whoThisIsFor.businesses.example4">Build a client strategy framework—industry analysis structure, transformation roadmap, executive presentation framework</T>
                </p>
              </div>

              <div className="group flex items-start space-x-2 sm:space-x-3 p-2.5 sm:p-3 rounded-lg hover:bg-card/50 dark:hover:bg-card/30 hover:border-accent/[0.25] border border-accent/[0.10] transition-all duration-300 cursor-default">
                <span className="text-accent text-base sm:text-lg mt-0.5 group-hover:scale-110 group-hover:text-accent transition-transform duration-200 font-bold" aria-hidden="true">•</span>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground group-hover:text-foreground transition-colors duration-200">
                  <T context="whoThisIsFor.businesses.example5">Structure a research framework—literature analysis system, mechanism mapping, gap identification, research roadmap</T>
                </p>
              </div>
            </div>

            <div className="pt-4 sm:pt-5 lg:pt-6 border-t border-accent/[0.20] dark:border-accent/[0.10]">
              <p className="text-sm sm:text-base lg:text-lg text-muted-foreground hover:text-foreground transition-colors duration-300 cursor-default font-light italic">
                <T context="whoThisIsFor.businesses.tagline">Framework in seconds. It evolves as your team works. Structure that grows, not static documents.</T>
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

