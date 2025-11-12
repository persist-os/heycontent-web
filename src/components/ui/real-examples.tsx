'use client'

import React from 'react'
import { T } from '@/components/translation'

export function RealExamples() {
  const examples = [
    {
      title: "Spotify PM Interview Prep",
      input: "I have a job interview at Spotify next Tuesday for a product manager role. I know nothing about their recent launches or strategy. Build me a prep kit.",
      artifacts: [
        "Structured List: Key talking points (AI integration, emergent learning, values alignment)",
        "Analysis: SWOT format with strengths, opportunities, threats",
        "Report: Product strategy & competitive analysis with specific recommendations"
      ]
    },
    {
      title: "AI Strategy for Board Presentation",
      input: "Just got asked to present our 'AI strategy' to the board next week. We're a mid-size logistics company and honestly have no AI strategy. Create a realistic 90-day AI implementation plan with quick wins, budget estimates, and a pilot project proposal that won't embarrass me.",
      artifacts: [
        "Tracker: Budget & resource estimate ($71K total, 71% utilization)",
        "Structured List: Quick wins with implementation steps and priorities",
        "Timeline: 10 implementation milestones from Nov 2024 to Feb 2025"
      ]
    },
    {
      title: "Hot Sauce Subscription Launch",
      input: "I'm launching a hot sauce subscription box called 'Monthly Burn.' I need everything to go from idea to first 10 customers - landing page copy, pricing tiers, email templates for outreach, and a content calendar for social posts.",
      artifacts: [
        "Structured List: Launch blueprint with tasks, due dates, assigned teams",
        "Email: Campaign template ready to send via Gmail",
        "Analysis: Marketing strategy with target audience and channel selection",
        "Report: Content calendar with specific posts, topics, and goals for Nov-Dec"
      ]
    }
  ]

  return (
    <section className="py-12 sm:py-20 lg:py-32 bg-gradient-to-br from-background via-primary/[0.02] to-accent/[0.02] dark:from-background dark:via-primary/[0.01] dark:to-accent/[0.01] relative overflow-hidden min-h-screen flex items-center">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12 relative z-10 w-full">
        <div className="space-y-8 sm:space-y-12 lg:space-y-16">
          {/* Header */}
          <div className="text-center space-y-4 sm:space-y-6">
            <h2 className="text-xl sm:text-3xl lg:text-5xl font-light text-foreground leading-tight">
              <T context="section.examples.title">Real Examples, Real Output</T>
            </h2>
          </div>

          {/* Examples */}
          <div className="space-y-12 sm:space-y-16 lg:space-y-20">
            {examples.map((example, index) => (
              <div key={index} className="space-y-6 sm:space-y-8">
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-medium text-foreground">
                    {example.title}
                  </h3>
                  <div className="p-4 sm:p-5 rounded-lg bg-card/50 dark:bg-card/30 border border-border/50">
                    <p className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wide mb-2"><T context="section.examples.inputLabel">Input</T></p>
                    <p className="text-sm sm:text-base text-foreground italic">
                      "{example.input}"
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3 sm:space-y-4">
                  <p className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wide"><T context="section.examples.artifactsLabel">Artifacts Generated</T></p>
                  <div className="space-y-2 sm:space-y-3">
                    {example.artifacts.map((artifact, artifactIndex) => (
                      <div key={artifactIndex} className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg bg-gradient-to-br from-primary/[0.05] to-accent/[0.03] dark:from-primary/[0.02] dark:to-accent/[0.01] border border-primary/20">
                        <span className="text-primary mt-0.5 text-sm">•</span>
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                          {artifact}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Key Observations */}
          <div className="pt-8 sm:pt-12 border-t border-border/50">
            <div className="space-y-4 sm:space-y-6">
              <h3 className="text-base sm:text-lg lg:text-xl font-medium text-foreground"><T context="section.examples.observations.title">Key Observations</T></h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="p-4 sm:p-5 rounded-lg bg-card/50 dark:bg-card/30 border border-border/50">
                  <p className="text-sm sm:text-base text-muted-foreground">
                    <strong className="text-foreground"><T context="section.examples.observations.1.label">Everything interconnected:</T></strong> <T context="section.examples.observations.1.text">Reports reference analyses, emails align with content calendars, timelines inform budgets.</T>
                  </p>
                </div>
                <div className="p-4 sm:p-5 rounded-lg bg-card/50 dark:bg-card/30 border border-border/50">
                  <p className="text-sm sm:text-base text-muted-foreground">
                    <strong className="text-foreground"><T context="section.examples.observations.2.label">Immediate utility:</T></strong> <T context="section.examples.observations.2.text">Not advice but actual artifacts—emails ready to send, calendars with specific posts, budgets with real categories.</T>
                  </p>
                </div>
                <div className="p-4 sm:p-5 rounded-lg bg-card/50 dark:bg-card/30 border border-border/50">
                  <p className="text-sm sm:text-base text-muted-foreground">
                    <strong className="text-foreground"><T context="section.examples.observations.3.label">Surprisingly specific:</T></strong> <T context="section.examples.observations.3.text">Assigns teams even when not mentioned, creates actual post ideas not placeholders, includes dates and priorities.</T>
                  </p>
                </div>
                <div className="p-4 sm:p-5 rounded-lg bg-card/50 dark:bg-card/30 border border-border/50">
                  <p className="text-sm sm:text-base text-muted-foreground">
                    <strong className="text-foreground"><T context="section.examples.observations.4.label">Collaborative potential:</T></strong> <T context="section.examples.observations.4.text">All artifacts are editable, versioned, and shareable with teams.</T>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

