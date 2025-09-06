'use client'

import React from 'react'
import { Zap, Database, RefreshCw } from 'lucide-react'

const features = [
  {
    icon: Zap,
    title: "Async multi-agent orchestration",
    description: "Condenser, Contradiction, Schema, Resurfacer, Preparer, and Critic agents keep working while you're away—condensing notes, reconciling conflicts, and preparing your next steps."
  },
  {
    icon: Database,
    title: "Redis-enabled working memory",
    description: "Hybrid retrieval makes finding relevant information fast and contextual, so you always get the right details when you need them."
  },
  {
    icon: RefreshCw,
    title: "Living memory (reconsolidation)",
    description: "Your project understanding improves every time you use it. Memories evolve and become more accurate as you add context and make decisions."
  }
]

export function WhyItWorks() {
  return (
    <section className="py-32 bg-gradient-to-b from-white via-slate-50/20 to-white dark:from-slate-900 dark:via-slate-800/20 dark:to-slate-900 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-gradient-to-br from-purple-100/20 to-indigo-100/15 dark:from-purple-900/10 dark:to-indigo-900/8 rounded-full blur-3xl animate-drift-right" />
      <div className="absolute bottom-0 right-1/3 w-80 h-80 bg-gradient-to-br from-blue-100/15 to-cyan-100/10 dark:from-blue-900/8 dark:to-cyan-900/6 rounded-full blur-3xl animate-drift-left" />
      
      <div className="max-w-6xl mx-auto px-8 sm:px-12 relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-4xl sm:text-5xl font-light text-slate-900 dark:text-slate-100 leading-tight tracking-wide mb-6 animate-fade-in-up">
            Why it works
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 font-light max-w-3xl mx-auto leading-relaxed animate-fade-in-up" style={{animationDelay: '0.2s'}}>
            Built on proven AI orchestration principles that keep your projects organized without the busywork.
          </p>
        </div>

        <div className="space-y-16">
          {features.map((feature, index) => {
            const IconComponent = feature.icon
            const isEven = index % 2 === 0
            
            return (
              <div 
                key={index}
                className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-12 animate-fade-in-up`}
                style={{animationDelay: `${0.4 + index * 0.3}s`}}
              >
                {/* Icon and Title */}
                <div className={`flex-1 text-center ${isEven ? 'lg:text-left' : 'lg:text-right'}`}>
                  <div className={`w-20 h-20 mx-auto ${isEven ? 'lg:mx-0' : 'lg:ml-auto lg:mr-0'} bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-400/10 dark:to-indigo-400/10 rounded-2xl flex items-center justify-center mb-6 hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                  </div>
                  
                  <h3 className="text-2xl font-medium text-slate-900 dark:text-slate-100 mb-4">
                    {feature.title}
                  </h3>
                </div>

                {/* Description */}
                <div className="flex-1">
                  <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl p-8 border border-slate-200/30 dark:border-slate-700/30 hover:border-blue-300/30 dark:hover:border-blue-600/20 transition-all duration-500 hover:shadow-lg hover:shadow-blue-500/5">
                    <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed font-light">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom summary */}
        <div className="mt-20 text-center animate-fade-in-up" style={{animationDelay: '1.3s'}}>
          <div className="inline-block bg-gradient-to-r from-blue-50/80 to-indigo-50/60 dark:from-blue-950/40 dark:to-indigo-950/30 backdrop-blur-sm rounded-2xl px-8 py-6 border border-blue-200/30 dark:border-blue-700/30">
            <p className="text-slate-700 dark:text-slate-300 font-light text-lg max-w-2xl">
              The result? Projects that stay current and actionable without you having to remember every detail or manually update status documents.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes drift-right {
          0%, 100% { transform: translateX(0px) translateY(0px); }
          33% { transform: translateX(30px) translateY(-15px); }
          66% { transform: translateX(-20px) translateY(20px); }
        }
        
        @keyframes drift-left {
          0%, 100% { transform: translateX(0px) translateY(0px); }
          33% { transform: translateX(-25px) translateY(15px); }
          66% { transform: translateX(20px) translateY(-25px); }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
          opacity: 0;
        }
        
        .animate-drift-right {
          animation: drift-right 15s ease-in-out infinite;
        }
        
        .animate-drift-left {
          animation: drift-left 18s ease-in-out infinite;
        }
      `}</style>
    </section>
  )
}
