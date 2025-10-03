'use client'

import React from 'react'

const currentFeatures = [
  {
    title: "Conversations that build on each other",
    current: "Every message adds to permanent memory. What you said three weeks ago surfaces when it's relevant today. No searching. No reminding. It just knows.",
    future: "Conversations from months ago connect automatically. Patterns emerge across everything you've ever discussed. Understanding compounds until it knows you better than you know yourself."
  },
  {
    title: "Notes that show you what you're missing",
    current: "Jot down half-formed thoughts. Scattered ideas. Random observations. The system spots patterns you don't see and shows how everything connects.",
    future: "Your notes reorganize themselves around emerging themes. Contradictions surface before they cause problems. Clarity appears from chaos without you touching anything."
  },
  {
    title: "Writing that captures how you actually think",
    current: "Every message, every note, every draft teaches the system how you communicate. It learns your voice by listening. Help with writing feels like you, not a robot.",
    future: "Generate ideas that sound exactly like you'd say them. First drafts that need minimal editing. Communication that maintains your voice at scale."
  },
  {
    title: "Work that continues when you're not working",
    current: "Set a task in motion. Come back later to find refined thinking, organized notes, and insights you didn't ask for. Processing happens in the background, ready when you are.",
    future: "Wake up to work that progressed overnight. Different aspects of your thinking handled simultaneously, each making the others better. Depth that builds while you sleep."
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
              <div className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400 tracking-wide uppercase hover:text-blue-700 dark:hover:text-blue-300 hover:tracking-wider transition-all duration-300 cursor-default">
                Available today
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light text-slate-900 dark:text-slate-100 leading-tight hover:text-slate-700 dark:hover:text-slate-200 transition-colors duration-300 cursor-default">Works from day one
              </h2>
            </div>
            
            <div className="space-y-5 sm:space-y-6">
              {currentFeatures.map((feature, index) => (
                <div key={index} className="group p-4 rounded-lg hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-all duration-300 cursor-pointer">
                  <h3 className="text-base sm:text-lg font-medium text-slate-900 dark:text-slate-100 mb-2 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-all duration-200 group-hover:translate-x-0.5">
                    {feature.title}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-all duration-200 group-hover:translate-x-1">
                    {feature.current}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right side - Where it's going */}
          <div className="space-y-6 sm:space-y-8">
            <div className="space-y-3 sm:space-y-4">
              <div className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 tracking-wide uppercase hover:text-slate-700 dark:hover:text-slate-300 hover:tracking-wider transition-all duration-300 cursor-default">
                Coming soon
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light text-slate-900 dark:text-slate-100 leading-tight hover:text-slate-700 dark:hover:text-slate-200 transition-colors duration-300 cursor-default">
                Gets more powerful over time
              </h2>
            </div>
            
            <div className="space-y-5 sm:space-y-6">
              {currentFeatures.map((feature, index) => (
                <div key={index} className="group p-4 rounded-lg opacity-75 hover:opacity-100 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all duration-300 cursor-pointer">
                  <h3 className="text-base sm:text-lg font-medium text-slate-700 dark:text-slate-300 mb-2 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-all duration-200 group-hover:translate-x-0.5">
                    {feature.title}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-500 dark:text-slate-500 leading-relaxed group-hover:text-slate-600 dark:group-hover:text-slate-400 transition-all duration-200 group-hover:translate-x-1">
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
