'use client'

import React from 'react'

export function WhyItWorks() {
  return (
    <section className="py-20 sm:py-28 lg:py-32 bg-slate-900 text-white relative overflow-hidden min-h-screen flex items-center">
      <div className="max-w-4xl mx-auto px-4 sm:px-8 lg:px-12 relative z-10 w-full">
        <div className="space-y-12 sm:space-y-16">
          <div className="text-center space-y-4 sm:space-y-6">
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-light leading-tight">
              The time you'll save back
            </h2>
          </div>

          <div className="space-y-8 sm:space-y-12">
            <div className="text-center space-y-6 sm:space-y-8">
              <div className="space-y-3 sm:space-y-4 p-4 sm:p-0 rounded-lg hover:bg-white/5 transition-all duration-300 active:scale-[0.98] sm:active:scale-100">
                <p className="text-lg sm:text-2xl font-light text-slate-300">
                  2 hours every morning
                </p>
                <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
                  Stop re-reading yesterday's notes, hunting through chat history, and rebuilding context from scratch. Your AI already knows where you left off.
                </p>
              </div>

              <div className="space-y-3 sm:space-y-4 p-4 sm:p-0 rounded-lg hover:bg-white/5 transition-all duration-300 active:scale-[0.98] sm:active:scale-100">
                <p className="text-lg sm:text-2xl font-light text-slate-300">
                  4 hours every week
                </p>
                <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
                  No more status meetings to sync everyone up. No more writing project summaries. No more losing track of decisions made in scattered conversations.
                </p>
              </div>

              <div className="space-y-3 sm:space-y-4 p-4 sm:p-0 rounded-lg hover:bg-white/5 transition-all duration-300 active:scale-[0.98] sm:active:scale-100">
                <p className="text-lg sm:text-2xl font-light text-slate-300">
                  Entire weekends back
                </p>
                <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
                  When projects coordinate themselves and contradictions surface automatically, you focus on creating instead of organizing. Your best work happens when your tools disappear.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-700 pt-12 sm:pt-16">
            <div className="text-center space-y-4 sm:space-y-6">
              <p className="text-lg sm:text-xl font-light text-slate-300 max-w-2xl mx-auto leading-relaxed">
                Start saving time today. Save even more time tomorrow.
              </p>
              <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
                Your projects remember everything so you can focus on what only you can do.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
