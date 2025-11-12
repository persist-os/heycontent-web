'use client'

import React from 'react'
import { T } from '@/components/translation'

export function ValueCards() {
  return (
    <section className="py-12 sm:py-16 lg:py-24 bg-gradient-to-br from-primary/[0.10] via-accent/[0.08] to-primary/[0.11] dark:bg-background min-h-screen flex items-center relative overflow-hidden">
      {/* Animated background gradient orbs - smaller on mobile */}
      <div className="absolute top-1/4 right-1/3 w-[200px] h-[200px] sm:w-[400px] sm:h-[400px] lg:w-[500px] lg:h-[500px] bg-gradient-to-br from-accent/[0.25] to-primary/[0.20] dark:from-accent/[0.08] dark:to-primary/[0.05] rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-1/3 left-1/4 w-[180px] h-[180px] sm:w-[350px] sm:h-[350px] lg:w-[450px] lg:h-[450px] bg-gradient-to-br from-primary/[0.22] to-accent/[0.18] dark:from-primary/[0.06] dark:to-accent/[0.04] rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '1.5s'}} />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[150px] h-[150px] sm:w-[300px] sm:h-[300px] lg:w-[400px] lg:h-[400px] bg-gradient-to-br from-accent/[0.20] to-primary/[0.15] dark:from-accent/[0.05] dark:to-primary/[0.03] rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '3s'}} />
      <div className="absolute bottom-1/4 right-1/3 w-[120px] h-[120px] sm:w-[250px] sm:h-[250px] lg:w-[350px] lg:h-[350px] bg-gradient-to-br from-primary/[0.18] to-accent/[0.15] dark:from-primary/[0.04] dark:to-accent/[0.03] rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '4.5s'}} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-start">
          {/* Left side - What's here now */}
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            <div className="space-y-2 sm:space-y-3 lg:space-y-4">
              <div className="text-xs font-medium text-foreground tracking-wide uppercase cursor-default">
                <T context="valueCards.availableToday">Available Now</T>
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-4xl font-light text-foreground leading-tight hover:text-foreground/80 transition-colors duration-300 cursor-default">
                <T context="valueCards.worksFromDayOne">Watch the Magic Happen</T>
              </h2>
            </div>

            <div className="space-y-3 sm:space-y-4 lg:space-y-6">
              <div className="p-4 sm:p-5 rounded-lg sm:rounded-xl bg-gradient-to-br from-card/70 via-primary/[0.06] to-accent/[0.05] dark:bg-card/20 backdrop-blur-lg border border-primary/[0.25] dark:border-primary/[0.10] shadow-lg shadow-primary/[0.15] dark:shadow-primary/[0.05]">
                <h3 className="text-sm sm:text-base lg:text-lg font-medium text-foreground mb-1.5 sm:mb-2">
                  Complete Systems, Not Single Responses
                </h3>
                <p className="text-xs sm:text-sm lg:text-base text-muted-foreground leading-relaxed">
                  Coordinated agents generate Itinerary Builder + Foodie Tracker + Budget Analyzer + Hidden Gems Report for vacation planning. Coordinated agents create Research Outline + Key Sources + Timeline for research papers. Coordinated agents build Budget Tracker + Quick Wins List + Implementation Timeline for business projects. Complete systems from one request.
                </p>
              </div>

              <div className="p-4 sm:p-5 rounded-lg sm:rounded-xl bg-gradient-to-br from-card/70 via-primary/[0.06] to-accent/[0.05] dark:bg-card/20 backdrop-blur-lg border border-primary/[0.25] dark:border-primary/[0.10] shadow-lg shadow-primary/[0.15] dark:shadow-primary/[0.05]">
                <h3 className="text-sm sm:text-base lg:text-lg font-medium text-foreground mb-1.5 sm:mb-2">
                  90 Seconds to Complete System
                </h3>
                <p className="text-xs sm:text-sm lg:text-base text-muted-foreground leading-relaxed">
                  Korea vacation planning: Itinerary Builder + Foodie Tracker + Budget Analyzer + Hidden Gems Report in 90 seconds. Research paper: Research Outline + Key Sources + Timeline in 90 seconds. Business project: Budget Tracker + Quick Wins List + Implementation Timeline in 90 seconds. Ready to use immediately.
                </p>
              </div>

              <div className="p-4 sm:p-5 rounded-lg sm:rounded-xl bg-gradient-to-br from-card/70 via-primary/[0.06] to-accent/[0.05] dark:bg-card/20 backdrop-blur-lg border border-primary/[0.25] dark:border-primary/[0.10] shadow-lg shadow-primary/[0.15] dark:shadow-primary/[0.05]">
                <h3 className="text-sm sm:text-base lg:text-lg font-medium text-foreground mb-1.5 sm:mb-2">
                  Interconnected Artifacts
                </h3>
                <p className="text-xs sm:text-sm lg:text-base text-muted-foreground leading-relaxed">
                  Itinerary references foodie tracker (vacation plan aligns with restaurant locations). Research outline references key sources (paper cites specific studies). Budget analyzer informs timeline (project budget aligns with implementation dates). Systems that work together, not isolated documents.
                </p>
              </div>

              <div className="p-4 sm:p-5 rounded-lg sm:rounded-xl bg-gradient-to-br from-card/70 via-primary/[0.06] to-accent/[0.05] dark:bg-card/20 backdrop-blur-lg border border-primary/[0.25] dark:border-primary/[0.10] shadow-lg shadow-primary/[0.15] dark:shadow-primary/[0.05]">
                <h3 className="text-sm sm:text-base lg:text-lg font-medium text-foreground mb-1.5 sm:mb-2">
                  Immediate Utility
                </h3>
                <p className="text-xs sm:text-sm lg:text-base text-muted-foreground leading-relaxed">
                  Email templates ready to send via Gmail. Content calendars with specific post dates and topics. Budget trackers with real line items and percentages. Launch blueprints with assigned teams and due dates. Working systems, not reading material.
                </p>
              </div>

              <div className="p-4 sm:p-5 rounded-lg sm:rounded-xl bg-gradient-to-br from-card/70 via-primary/[0.06] to-accent/[0.05] dark:bg-card/20 backdrop-blur-lg border border-primary/[0.25] dark:border-primary/[0.10] shadow-lg shadow-primary/[0.15] dark:shadow-primary/[0.05]">
                <h3 className="text-sm sm:text-base lg:text-lg font-medium text-foreground mb-1.5 sm:mb-2">
                  <T context="valueCards.currentFeature6.title">Gets Smarter Every Day</T>
                </h3>
                <p className="text-xs sm:text-sm lg:text-base text-muted-foreground leading-relaxed">
                  <T context="valueCards.currentFeature6.description">It learns you—style, preferences, pace—and adapts; sentiment becomes signal, so every project gets sharper.</T>
                </p>
              </div>
            </div>
          </div>

          {/* Right side - Where it's going */}
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            <div className="space-y-2 sm:space-y-3 lg:space-y-4">
              <div className="text-xs font-medium text-muted-foreground tracking-wide uppercase cursor-default">
                <T context="valueCards.comingSoon">Coming Soon</T>
              </div>
              <h2 className="text-xl sm:text-2xl lg:text-4xl font-light text-foreground leading-tight hover:text-foreground/80 transition-colors duration-300 cursor-default">
                <T context="valueCards.getsMorePowerful">The Future Arrives</T>
              </h2>
            </div>

            <div className="space-y-3 sm:space-y-4 lg:space-y-6">
              <div className="p-4 sm:p-5 rounded-lg sm:rounded-xl bg-gradient-to-br from-card/70 via-primary/[0.06] to-accent/[0.05] dark:bg-card/20 backdrop-blur-lg border border-primary/[0.25] dark:border-primary/[0.10] shadow-lg shadow-primary/[0.15] dark:shadow-primary/[0.05]">
                <h3 className="text-sm sm:text-base lg:text-lg font-medium text-foreground mb-1.5 sm:mb-2">
                  <T context="valueCards.futureFeature1.title">Tool usage that just works</T>
                </h3>
                <p className="text-xs sm:text-sm lg:text-base text-muted-foreground leading-relaxed">
                  <T context="valueCards.futureFeature1.description">We are working on integrating with Reddit, Gmail, Discord, Drive, Calendar, Sheets, Browserbase—and so many more. The system will learn the optimal configurations and use them automatically. No more manually selecting and prompting tools.</T>
                </p>
              </div>

              <div className="p-4 sm:p-5 rounded-lg sm:rounded-xl bg-gradient-to-br from-card/70 via-primary/[0.06] to-accent/[0.05] dark:bg-card/20 backdrop-blur-lg border border-primary/[0.25] dark:border-primary/[0.10] shadow-lg shadow-primary/[0.15] dark:shadow-primary/[0.05]">
                <h3 className="text-sm sm:text-base lg:text-lg font-medium text-foreground mb-1.5 sm:mb-2">
                  <T context="valueCards.futureFeature2.title">Intelligence Compounds</T>
                </h3>
                <p className="text-xs sm:text-sm lg:text-base text-muted-foreground leading-relaxed">
                  <T context="valueCards.futureFeature2.description">Agents will develop specialties and leave legacies, drawing from natural selection and evolution to ensure continuous improvement and adaptability.</T>
                </p>
              </div>

              <div className="p-4 sm:p-5 rounded-lg sm:rounded-xl bg-gradient-to-br from-card/70 via-primary/[0.06] to-accent/[0.05] dark:bg-card/20 backdrop-blur-lg border border-primary/[0.25] dark:border-primary/[0.10] shadow-lg shadow-primary/[0.15] dark:shadow-primary/[0.05]">
                <h3 className="text-sm sm:text-base lg:text-lg font-medium text-foreground mb-1.5 sm:mb-2">
                  <T context="valueCards.futureFeature3.title">Proactive Intelligence</T>
                </h3>
                <p className="text-xs sm:text-sm lg:text-base text-muted-foreground leading-relaxed">
                  <T context="valueCards.futureFeature3.description">The system will anticipate your needs, learn your patterns, and prepare work proactively before you ask. Like having a personal assistant that knows you better than you know yourself.</T>
                </p>
              </div>

              <div className="p-4 sm:p-5 rounded-lg sm:rounded-xl bg-gradient-to-br from-card/70 via-primary/[0.06] to-accent/[0.05] dark:bg-card/20 backdrop-blur-lg border border-primary/[0.25] dark:border-primary/[0.10] shadow-lg shadow-primary/[0.15] dark:shadow-primary/[0.05]">
                <h3 className="text-sm sm:text-base lg:text-lg font-medium text-foreground mb-1.5 sm:mb-2">
                  <T context="valueCards.futureFeature4.title">Cross-Domain Intelligence</T>
                </h3>
                <p className="text-xs sm:text-sm lg:text-base text-muted-foreground leading-relaxed">
                  <T context="valueCards.futureFeature4.description">The system will connect insights from different domains, allowing you to see patterns and relationships that you may not have seen otherwise.</T>
                </p>
              </div>

              <div className="p-4 sm:p-5 rounded-lg sm:rounded-xl bg-gradient-to-br from-card/70 via-primary/[0.06] to-accent/[0.05] dark:bg-card/20 backdrop-blur-lg border border-primary/[0.25] dark:border-primary/[0.10] shadow-lg shadow-primary/[0.15] dark:shadow-primary/[0.05]">
                <h3 className="text-sm sm:text-base lg:text-lg font-medium text-foreground mb-1.5 sm:mb-2">
                  <T context="valueCards.futureFeature5.title">Self-Organizing Structure</T>
                </h3>
                <p className="text-xs sm:text-sm lg:text-base text-muted-foreground leading-relaxed">
                  <T context="valueCards.futureFeature5.description">The system will organize your work automatically, allowing you to focus on what you need to do. No more manually organizing your work.</T>
                </p>
              </div>
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
