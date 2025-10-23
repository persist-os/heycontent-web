'use client'

import React from 'react'
import { T } from '@/components/translation'

const currentFeatures = [
  {
    title: "Advanced Memory",
    current: "HeyContext connects what you said yesterday to what you're thinking today. Personal style, priorities, and relationships are remembered to improve output quality.",
    future: "With a click, HeyContext can take your progress to other platforms, starting new files or working in existing ones."
  },
  {
    title: "Living Projects",
    current: "Living projects map files, conversations, and context onto a constellation. AI analysis highlights shared information and creates action items that pave the way for easy completion.",
    future: "Files uploaded across the platform are automatically saved and connected to eliminate redundancy"
  },
  {
    title: "Intelligent Agents",
    current: "Inside projects, ambient AI prepares drafts for identified deliverables without prompting, saving you time and effort.",
    future: "With each experience, agents develop skills and specialties. When complex challenges appear, agents cooperate based on individual strengths to deliver the best outcome."
  },
  {
    title: "Data Migration",
    current: "Take your data from other popular AI services and pick up right where you left off.",
    future: ""
  }
]

export function ValueCards() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-primary/[0.10] via-accent/[0.08] to-primary/[0.11] dark:bg-background min-h-screen flex items-center relative overflow-hidden">
      {/* Animated background gradient orbs - more dramatic */}
      <div className="absolute top-1/4 right-1/3 w-[500px] h-[500px] bg-gradient-to-br from-accent/[0.25] to-primary/[0.20] dark:from-accent/[0.08] dark:to-primary/[0.05] rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-1/3 left-1/4 w-[450px] h-[450px] bg-gradient-to-br from-primary/[0.22] to-accent/[0.18] dark:from-primary/[0.06] dark:to-accent/[0.04] rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '1.5s'}} />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-br from-accent/[0.20] to-primary/[0.15] dark:from-accent/[0.05] dark:to-primary/[0.03] rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '3s'}} />
      <div className="absolute bottom-1/4 right-1/3 w-[350px] h-[350px] bg-gradient-to-br from-primary/[0.18] to-accent/[0.15] dark:from-primary/[0.04] dark:to-accent/[0.03] rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '4.5s'}} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16 items-start">
          {/* Left side - What's here now */}
          <div className="space-y-6 sm:space-y-8">
            <div className="space-y-3 sm:space-y-4">
              <div className="text-xs sm:text-sm font-medium text-primary tracking-wide uppercase hover:text-primary/80 hover:tracking-wider transition-all duration-300 cursor-default">
                <T context="valueCards.availableToday">Available Now</T>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light text-foreground leading-tight hover:text-foreground/80 transition-colors duration-300 cursor-default">
                <T context="valueCards.worksFromDayOne">Your AI Becomes Your Second Brain</T>
              </h2>
            </div>

            <div className="space-y-5 sm:space-y-6">
              <div className="group p-5 rounded-xl bg-gradient-to-br from-card/70 via-primary/[0.06] to-accent/[0.05] dark:bg-card/20 backdrop-blur-lg hover:backdrop-blur-xl hover:bg-gradient-to-br hover:from-card/80 hover:via-primary/[0.08] hover:to-accent/[0.07] dark:hover:bg-primary/[0.05] border border-primary/[0.25] dark:border-primary/[0.10] hover:border-accent/[0.35] dark:hover:border-primary/[0.15] shadow-lg shadow-primary/[0.15] hover:shadow-xl hover:shadow-accent/[0.25] dark:shadow-primary/[0.05] dark:hover:shadow-primary/[0.10] transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-[0.98]">
                <h3 className="text-base sm:text-lg font-medium text-foreground mb-2 group-hover:text-primary transition-all duration-200 group-hover:translate-x-0.5">
                  <T context="valueCards.currentFeature1.title">Deep Personal Insights</T>
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-all duration-200 group-hover:translate-x-1">
                  <T context="valueCards.currentFeature1.description">Every conversation and note you create reveals pieces of who you are. Your system quietly collects these insights, building a rich understanding of your thinking patterns and preferences.</T>
                </p>
              </div>

              <div className="group p-5 rounded-xl bg-gradient-to-br from-card/70 via-primary/[0.06] to-accent/[0.05] dark:bg-card/20 backdrop-blur-lg hover:backdrop-blur-xl hover:bg-gradient-to-br hover:from-card/80 hover:via-primary/[0.08] hover:to-accent/[0.07] dark:hover:bg-primary/[0.05] border border-primary/[0.25] dark:border-primary/[0.10] hover:border-accent/[0.35] dark:hover:border-primary/[0.15] shadow-lg shadow-primary/[0.15] hover:shadow-xl hover:shadow-accent/[0.25] dark:shadow-primary/[0.05] dark:hover:shadow-primary/[0.10] transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-[0.98]">
                <h3 className="text-base sm:text-lg font-medium text-foreground mb-2 group-hover:text-primary transition-all duration-200 group-hover:translate-x-0.5">
                  <T context="valueCards.currentFeature2.title">AI Companions That Know You</T>
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-all duration-200 group-hover:translate-x-1">
                  <T context="valueCards.currentFeature2.description">Start with an intelligent conversation that uncovers your goals and working style. Custom AI assistants are then created specifically for you, designed to help exactly how you need.</T>
                </p>
              </div>

              <div className="group p-5 rounded-xl bg-gradient-to-br from-card/70 via-primary/[0.06] to-accent/[0.05] dark:bg-card/20 backdrop-blur-lg hover:backdrop-blur-xl hover:bg-gradient-to-br hover:from-card/80 hover:via-primary/[0.08] hover:to-accent/[0.07] dark:hover:bg-primary/[0.05] border border-primary/[0.25] dark:border-primary/[0.10] hover:border-accent/[0.35] dark:hover:border-primary/[0.15] shadow-lg shadow-primary/[0.15] hover:shadow-xl hover:shadow-accent/[0.25] dark:shadow-primary/[0.05] dark:hover:shadow-primary/[0.10] transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-[0.98]">
                <h3 className="text-base sm:text-lg font-medium text-foreground mb-2 group-hover:text-primary transition-all duration-200 group-hover:translate-x-0.5">
                  <T context="valueCards.currentFeature3.title">Your Work Grows Smarter</T>
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-all duration-200 group-hover:translate-x-1">
                  <T context="valueCards.currentFeature3.description">Your work isn't static—it learns and evolves. As you work, it develops its own understanding of what matters most to you, creating tools and insights tailored to your unique approach.</T>
                </p>
              </div>
            </div>
          </div>

          {/* Right side - Where it's going */}
          <div className="space-y-6 sm:space-y-8">
            <div className="space-y-3 sm:space-y-4">
              <div className="text-xs sm:text-sm font-medium text-muted-foreground tracking-wide uppercase hover:text-foreground/70 hover:tracking-wider transition-all duration-300 cursor-default">
                <T context="valueCards.comingSoon">Coming Soon</T>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light text-foreground leading-tight hover:text-foreground/80 transition-colors duration-300 cursor-default">
                <T context="valueCards.getsMorePowerful">Your System Dreams While You Sleep</T>
              </h2>
            </div>

            <div className="space-y-5 sm:space-y-6">
              <div className="group p-5 rounded-xl bg-gradient-to-br from-card/60 via-secondary to-accent/[0.05] dark:bg-card/15 backdrop-blur-lg hover:backdrop-blur-xl opacity-80 hover:opacity-100 hover:bg-gradient-to-br hover:from-secondary hover:via-accent/[0.07] hover:to-primary/[0.06] dark:hover:bg-card/30 border border-border dark:border-border/20 hover:border-accent/[0.30] dark:hover:border-accent/[0.15] shadow-lg shadow-muted/[0.15] hover:shadow-xl hover:shadow-accent/[0.25] dark:shadow-muted/[0.05] dark:hover:shadow-accent/[0.05] transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-[0.98]">
                <h3 className="text-base sm:text-lg font-medium text-foreground/70 mb-2 group-hover:text-accent transition-all duration-200 group-hover:translate-x-0.5">
                  <T context="valueCards.futureFeature1.title">Dream Reports</T>
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground/90 leading-relaxed group-hover:text-foreground/70 transition-all duration-200 group-hover:translate-x-1">
                  <T context="valueCards.futureFeature1.description">Wake up to magical insights your system discovered overnight. While you sleep, it explores connections between your projects, habits, and dreams to reveal surprising patterns you never noticed.</T>
                </p>
              </div>

              <div className="group p-5 rounded-xl bg-gradient-to-br from-card/60 via-secondary to-accent/[0.05] dark:bg-card/15 backdrop-blur-lg hover:backdrop-blur-xl opacity-80 hover:opacity-100 hover:bg-gradient-to-br hover:from-secondary hover:via-accent/[0.07] hover:to-primary/[0.06] dark:hover:bg-card/30 border border-border dark:border-border/20 hover:border-accent/[0.30] dark:hover:border-accent/[0.15] shadow-lg shadow-muted/[0.15] hover:shadow-xl hover:shadow-accent/[0.25] dark:shadow-muted/[0.05] dark:hover:shadow-accent/[0.05] transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-[0.98]">
                <h3 className="text-base sm:text-lg font-medium text-foreground/70 mb-2 group-hover:text-accent transition-all duration-200 group-hover:translate-x-0.5">
                  <T context="valueCards.futureFeature2.title">Living Intelligence</T>
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground/90 leading-relaxed group-hover:text-foreground/70 transition-all duration-200 group-hover:translate-x-1">
                  <T context="valueCards.futureFeature2.description">Your agents develop personalities and work together as a team. They teach each other new skills, coordinate complex tasks, and even make their own decisions about how to help you better.</T>
                </p>
              </div>

              <div className="group p-5 rounded-xl bg-gradient-to-br from-card/60 via-secondary to-accent/[0.05] dark:bg-card/15 backdrop-blur-lg hover:backdrop-blur-xl opacity-80 hover:opacity-100 hover:bg-gradient-to-br hover:from-secondary hover:via-accent/[0.07] hover:to-primary/[0.06] dark:hover:bg-card/30 border border-border dark:border-border/20 hover:border-accent/[0.30] dark:hover:border-accent/[0.15] shadow-lg shadow-muted/[0.15] hover:shadow-xl hover:shadow-accent/[0.25] dark:shadow-muted/[0.05] dark:hover:shadow-accent/[0.05] transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-[0.98]">
                <h3 className="text-base sm:text-lg font-medium text-foreground/70 mb-2 group-hover:text-accent transition-all duration-200 group-hover:translate-x-0.5">
                  <T context="valueCards.futureFeature3.title">Smart Tool Learning</T>
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground/90 leading-relaxed group-hover:text-foreground/70 transition-all duration-200 group-hover:translate-x-1">
                  <T context="valueCards.futureFeature3.description">Every time your tools work on tasks, they learn what works best. Over time, they get smarter at choosing the perfect combination of tools for any job, making everything run smoother automatically.</T>
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
