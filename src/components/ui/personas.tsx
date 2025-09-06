'use client'

import React from 'react'

const useCase = [
  {
    title: "Individual creators and builders",
    current: "Use advanced chat and notes to develop ideas, get writing help, and maintain context across projects",
    future: "Will coordinate multiple projects automatically and surface connections between different work streams"
  },
  {
    title: "Small teams (2-5 people)",
    current: "Each person gets their own contextual AI that understands their role and preferences",
    future: "Will share project context seamlessly, coordinate handoffs, and maintain team alignment without overhead"
  }
]

export function Personas() {
  return (
    <section className="py-24 bg-white dark:bg-slate-900">
      <div className="max-w-6xl mx-auto px-8 sm:px-12">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-light text-slate-900 dark:text-slate-100 leading-tight mb-4">
            Built for thoughtful work
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Whether you're working solo or with a small team, HeyContext grows with your complexity.
          </p>
        </div>

        <div className="space-y-12">
          {useCase.map((use, index) => (
            <div key={index} className="border-l-2 border-slate-200 dark:border-slate-700 pl-8">
              <h3 className="text-xl font-medium text-slate-900 dark:text-slate-100 mb-4">
                {use.title}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-sm font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-3">
                    Available now
                  </h4>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {use.current}
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-slate-500 dark:text-slate-500 uppercase tracking-wide mb-3">
                    Coming soon
                  </h4>
                  <p className="text-slate-500 dark:text-slate-500 leading-relaxed">
                    {use.future}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="inline-block bg-slate-50 dark:bg-slate-800 rounded-lg px-8 py-6">
            <p className="text-slate-600 dark:text-slate-400 font-light">
              Not for large enterprises or complex org structures. 
              <br />
              Built for people who want AI that actually understands their work.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
