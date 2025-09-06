'use client'

import React from 'react'

export function WhyItWorks() {
  return (
    <section className="py-32 bg-slate-900 text-white relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-8 sm:px-12 relative z-10">
        <div className="space-y-16">
          <div className="text-center space-y-6">
            <h2 className="text-4xl sm:text-5xl font-light leading-tight">
              The gap we're filling
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-center">
            <div className="space-y-4">
              <h3 className="text-xl font-light text-slate-300">Most AI tools</h3>
              <div className="space-y-3 text-slate-400">
                <p>Start fresh every conversation</p>
                <p>Require you to organize everything</p>
                <p>Work in isolation</p>
                <p>Need constant prompting</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-light text-blue-400">HeyContext</h3>
              <div className="space-y-3 text-slate-300">
                <p>Builds understanding over time</p>
                <p>Organizes itself around your work</p>
                <p>Connects ideas across conversations</p>
                <p>Proactively surfaces insights</p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-700 pt-16">
            <div className="text-center space-y-6">
              <p className="text-xl font-light text-slate-300 max-w-2xl mx-auto leading-relaxed">
                We're not trying to replace your thinking. We're building AI that amplifies it.
              </p>
              <p className="text-slate-400 max-w-xl mx-auto">
                Start with advanced chat and notes. Soon: the project coordination layer that ties it all together.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
