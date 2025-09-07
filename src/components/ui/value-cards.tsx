'use client'

import React from 'react'

const currentFeatures = [
  {
    title: "Contextual conversations",
    current: "Chat that connects what you said yesterday to what you're thinking today. Context builds naturally, like human understanding does.",
    future: "Living project intelligence that evolves continuously as agents work overnight to reconcile contradictions and surface insights before you even ask"
  },
  {
    title: "Connected thinking",
    current: "Notes that spot patterns in your thinking and connect ideas across conversations. Intelligence that sees relationships you might miss.",
    future: "Self-updating project briefs that condense messy inputs into structured schemas with goals, risks, and decisions automatically maintained"
  },
  {
    title: "Voice learning",
    current: "Writing help that learns how you sound and think. Understanding of your style that gets more accurate with every interaction.",
    future: "Context-aware content generation that understands your entire project landscape and suggests ideas based on evolving project schemas"
  },
  {
    title: "Personal AI",
    current: "AI that learns your preferences, patterns, and working style. Gets smarter about what you need without being told.",
    future: "Multi-agent orchestration where specialized agents handle different aspects of your projects, condensing information, detecting contradictions, and preparing insights"
  }
]

export function ValueCards() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-white dark:bg-slate-900 min-h-screen flex items-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16 items-start">
          {/* Left side - What's here now */}
          <div className="space-y-6 sm:space-y-8">
            <div className="space-y-3 sm:space-y-4">
              <div className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400 tracking-wide uppercase">
                Available today
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light text-slate-900 dark:text-slate-100 leading-tight">Memory that grows like you
              </h2>
            </div>
            
            <div className="space-y-5 sm:space-y-6">
              {currentFeatures.map((feature, index) => (
                <div key={index} className="group p-4 sm:p-0 rounded-lg hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-all duration-300 active:scale-[0.98] sm:active:scale-100">
                  <h3 className="text-base sm:text-lg font-medium text-slate-900 dark:text-slate-100 mb-2 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                    {feature.current}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right side - Where it's going */}
          <div className="space-y-6 sm:space-y-8">
            <div className="space-y-3 sm:space-y-4">
              <div className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 tracking-wide uppercase">
                Coming soon
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light text-slate-900 dark:text-slate-100 leading-tight">
                Projects that evolve while you sleep
              </h2>
            </div>
            
            <div className="space-y-5 sm:space-y-6">
              {currentFeatures.map((feature, index) => (
                <div key={index} className="group p-4 sm:p-0 rounded-lg opacity-75 hover:opacity-100 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all duration-300 active:scale-[0.98] sm:active:scale-100">
                  <h3 className="text-base sm:text-lg font-medium text-slate-700 dark:text-slate-300 mb-2 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-500 dark:text-slate-500 leading-relaxed group-hover:text-slate-600 dark:group-hover:text-slate-400 transition-colors">
                    {feature.future}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
