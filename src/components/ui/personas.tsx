'use client'

/**
 * ⚠️ DEPRECATED: PERSONA UI COMPONENTS - SCHEDULED FOR REMOVAL
 * 
 * This entire persona UI system has been deprecated and replaced by the crystal system.
 * These components are kept for backwards compatibility only and will be removed in a future version.
 * 
 * TODO: Remove this entire file after confirming no active usage
 * TODO: Replace any remaining persona UI with crystal-based components
 * TODO: Update all imports to use crystal UI components instead
 * 
 * @deprecated Use crystal system UI components instead
 */

import React from 'react'

const scenarios = [
  {
    title: "The founder juggling everything",
    problem: "Investor deck says launch in August. Team standup notes say September. Customer feedback suggests October. Which is real?",
    solution: "Contradiction detection flags the mismatch before your next board meeting. Project brief updates automatically as decisions solidify."
  },
  {
    title: "The consultant managing six clients", 
    problem: "Client A wants feature X prioritized. But three weeks ago, they said Y was urgent. You're implementing the wrong thing.",
    solution: "Context builds per client. Previous preferences surface before each call. No more guessing what they actually want."
  },
  {
    title: "The product team shipping fast",
    problem: "User research says one thing. Engineering constraints say another. Marketing timeline says a third. Everyone's working from different truths.",
    solution: "Shared project memory keeps everyone aligned. Decisions made in Slack appear in your planning doc. No information gets lost between tools."
  },
  {
    title: "The creative agency staying organized",
    problem: "Brand guidelines buried in email. Client feedback scattered across calls. Creative brief outdated before the campaign launches.",
    solution: "Project schemas evolve with each input. Brand voice stays consistent. Creative direction stays current. Campaigns launch coherent."
  }
]

export function Personas() {
  return (
    <section className="py-24 bg-white dark:bg-slate-900">
      <div className="max-w-6xl mx-auto px-8 sm:px-12">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-light text-slate-900 dark:text-slate-100 leading-tight mb-4">
            Problems you recognize
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Every knowledge worker faces the same chaos. Information scattered. Context lost. Time wasted rebuilding what you already knew.
          </p>
        </div>

        <div className="space-y-16">
          {scenarios.map((scenario, index) => (
            <div key={index} className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h3 className="text-xl font-medium text-slate-900 dark:text-slate-100 mb-4">
                  {scenario.title}
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-red-600 dark:text-red-400 uppercase tracking-wide">
                    The problem
                  </h4>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed italic">
                    "{scenario.problem}"
                  </p>
                </div>
                
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">
                    With HeyContext
                  </h4>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {scenario.solution}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <p className="text-xl font-light text-slate-900 dark:text-slate-100">
              Your work is complex. Your tools shouldn't make it worse.
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              Whether you're running a startup, consulting for clients, shipping products, or creating campaigns, the pattern is the same: information chaos costs time. HeyContext gives you that time back.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
