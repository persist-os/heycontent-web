'use client'

import React from 'react'
import { T } from '@/components/translation'

export function HotSauceProof() {
  return (
    <section className="py-12 sm:py-20 lg:py-32 bg-foreground text-background relative overflow-hidden min-h-screen flex items-center">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-12 relative z-10 w-full">
        <div className="space-y-8 sm:space-y-12 lg:space-y-16">
          {/* Header */}
          <div className="text-center space-y-4 sm:space-y-6">
            <h2 className="text-xl sm:text-3xl lg:text-5xl font-light leading-tight">
              <T context="section.proof.title">Proof: Real Request, Real System</T>
            </h2>
          </div>

          {/* Input */}
          <div className="space-y-4 sm:space-y-6">
            <div className="text-center">
              <p className="text-sm sm:text-base text-background/70 uppercase tracking-wide mb-2">
                <T context="section.proof.inputLabel">Input:</T>
              </p>
              <p className="text-lg sm:text-xl lg:text-2xl font-light text-background italic">
                <T context="section.proof.inputExample">"I want to quit my job, move abroad, and work remotely while traveling"</T>
              </p>
            </div>
          </div>

          {/* Output */}
          <div className="space-y-6 sm:space-y-8">
            <div className="text-center">
              <p className="text-sm sm:text-base text-background/70 uppercase tracking-wide mb-4">
                <T context="section.proof.outputLabel">Output (15-20 minutes, runs autonomously):</T>
              </p>
              <p className="text-base sm:text-lg lg:text-xl font-medium text-background mb-6">
                <T context="section.proof.outputCount">4 interconnected artifacts:</T>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="p-4 sm:p-5 rounded-lg bg-background/10 border border-background/20">
                <p className="text-sm sm:text-base font-medium text-background mb-2"><T context="section.proof.artifact1.title">Task List</T></p>
                <p className="text-xs sm:text-sm text-background/80">
                  <T context="section.proof.artifact1.description">Categorized tasks: legal (resignation, contracts), financial (budget, savings), logistical (visa, housing, shipping)</T>
                </p>
              </div>
              <div className="p-4 sm:p-5 rounded-lg bg-background/10 border border-background/20">
                <p className="text-sm sm:text-base font-medium text-background mb-2"><T context="section.proof.artifact2.title">Logistics Timeline</T></p>
                <p className="text-xs sm:text-sm text-background/80">
                  <T context="section.proof.artifact2.description">9 milestones from job quit date through visa approval, flight, and settling in</T>
                </p>
              </div>
              <div className="p-4 sm:p-5 rounded-lg bg-background/10 border border-background/20">
                <p className="text-sm sm:text-base font-medium text-background mb-2"><T context="section.proof.artifact3.title">Progress Tracker</T></p>
                <p className="text-xs sm:text-sm text-background/80">
                  <T context="section.proof.artifact3.description">Job applications (3/10), visa progress, savings target ($5K/$20K), housing research (20%)</T>
                </p>
              </div>
              <div className="p-4 sm:p-5 rounded-lg bg-background/10 border border-background/20">
                <p className="text-sm sm:text-base font-medium text-background mb-2"><T context="section.proof.artifact4.title">Legal Checklist</T></p>
                <p className="text-xs sm:text-sm text-background/80">
                  <T context="section.proof.artifact4.description">Employment law, visa requirements, tax implications, data protection—all interconnected</T>
                </p>
              </div>
            </div>

            <div className="text-center pt-4 sm:pt-6">
              <p className="text-base sm:text-lg lg:text-xl font-light text-background italic">
                <T context="section.proof.connection">Timeline references tasks. Tracker updates from timeline. Legal checklist informs visa timeline. Everything connected.</T>
              </p>
            </div>

            <div className="text-center pt-6 sm:pt-8 border-t border-background/20">
              <p className="text-lg sm:text-xl lg:text-2xl font-medium text-background">
                <T context="section.proof.conclusion">This isn't advice. It's your actual transition system.</T>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

