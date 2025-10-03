'use client'

import React from 'react'

export function WhyItWorks() {
  return (
    <section className="py-20 sm:py-28 lg:py-32 bg-slate-900 text-white relative overflow-hidden min-h-screen flex items-center">
      <div className="max-w-4xl mx-auto px-4 sm:px-8 lg:px-12 relative z-10 w-full">
        <div className="space-y-12 sm:space-y-16">
          <div className="text-center space-y-4 sm:space-y-6">
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-light leading-tight hover:text-white transition-colors duration-300 cursor-default">
              Most AI makes you work for it. This one works for you.
            </h2>
          </div>

          <div className="space-y-8 sm:space-y-12">
            <div className="text-center space-y-6 sm:space-y-8">
              <div className="space-y-3 sm:space-y-4 p-4 rounded-lg hover:bg-white/5 transition-all duration-300 cursor-pointer">
                <p className="text-lg sm:text-2xl font-light text-slate-300">
                  Start where you left off, instantly
                </p>
                <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
                  No more "wait, what was I doing?" No more rereading yesterday's notes. No more rebuilding context in your head. Open it up, and it remembers exactly where your thinking left off. Including the details you forgot.
                </p>
              </div>

              <div className="space-y-3 sm:space-y-4 p-4 rounded-lg hover:bg-white/5 transition-all duration-300 cursor-pointer">
                <p className="text-lg sm:text-2xl font-light text-slate-300">
                  Explain yourself once, never again
                </p>
                <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
                  How you prefer feedback. What matters in your work. Which ideas you're exploring. Your communication style. Every pattern learned once and remembered forever. It adapts to you instead of making you adapt to it.
                </p>
              </div>

              <div className="space-y-3 sm:space-y-4 p-4 rounded-lg hover:bg-white/5 transition-all duration-300 cursor-pointer">
                <p className="text-lg sm:text-2xl font-light text-slate-300">
                  Stop managing, start creating
                </p>
                <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
                  No folders to organize. No tags to maintain. No systems to manage. Talk naturally about your work. The structure builds itself. Connections form automatically. You focus on thinking. It handles the rest.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-700 pt-12 sm:pt-16">
            <div className="text-center space-y-4 sm:space-y-6">
              <p className="text-lg sm:text-xl font-light text-slate-300 max-w-2xl mx-auto leading-relaxed hover:text-white transition-colors duration-300 cursor-default">
                The more you use it, the more valuable it becomes. Not because you put in more effort.
              </p>
              <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto hover:text-slate-300 transition-colors duration-300 cursor-default">
                Because it's actually learning.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
