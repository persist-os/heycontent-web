'use client'

import React from 'react'
import { FileText, Clock, AlertTriangle } from 'lucide-react'

const valueCards = [
  {
    icon: FileText,
    title: "Auto-updated Project Briefs",
    description: "Goals, decisions, milestones—kept current without manual upkeep."
  },
  {
    icon: Clock,
    title: "Since-You-Left Bundles",
    description: "Come back to a crisp digest of what changed and what's next."
  },
  {
    icon: AlertTriangle,
    title: "Contradiction Flags",
    description: "Catch mismatched dates or priorities before they cost you."
  }
]

export function ValueCards() {
  return (
    <section className="py-32 bg-gradient-to-b from-white via-slate-50/30 to-white dark:from-slate-900 dark:via-slate-800/30 dark:to-slate-900 relative overflow-hidden">
      {/* Subtle background animation */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-to-r from-blue-100/20 to-cyan-100/15 dark:from-blue-900/10 dark:to-cyan-900/8 rounded-full blur-3xl animate-drift-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-l from-indigo-100/15 to-purple-100/10 dark:from-indigo-900/8 dark:to-purple-900/6 rounded-full blur-3xl animate-drift-slow" style={{animationDelay: '2s'}} />
      
      <div className="max-w-6xl mx-auto px-8 sm:px-12 relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-4xl sm:text-5xl font-light text-slate-900 dark:text-slate-100 leading-tight tracking-wide mb-6 animate-fade-in-up">
            How it saves your time
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 font-light max-w-3xl mx-auto leading-relaxed animate-fade-in-up" style={{animationDelay: '0.2s'}}>
            Stop manually tracking project status. Let HeyContext maintain the overview while you focus on the work.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {valueCards.map((card, index) => {
            const IconComponent = card.icon
            return (
              <div 
                key={index} 
                className="group text-center space-y-6 p-8 rounded-2xl hover:bg-white/60 dark:hover:bg-slate-800/40 transition-all duration-500 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/5 cursor-default backdrop-blur-sm animate-fade-in-up border border-slate-200/30 dark:border-slate-700/30 hover:border-blue-300/30 dark:hover:border-blue-600/20"
                style={{animationDelay: `${0.4 + index * 0.2}s`}}
              >
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-400/10 dark:to-indigo-400/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <IconComponent className="w-8 h-8 text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-300" />
                </div>
                
                <h3 className="text-2xl font-medium text-slate-900 dark:text-slate-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors duration-300">
                  {card.title}
                </h3>
                
                <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed font-light group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors duration-300">
                  {card.description}
                </p>
              </div>
            )
          })}
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
        
        @keyframes drift-slow {
          0%, 100% { transform: translateX(0px) translateY(0px); }
          50% { transform: translateX(15px) translateY(-15px); }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
          opacity: 0;
        }
        
        .animate-drift-slow {
          animation: drift-slow 20s ease-in-out infinite;
        }
      `}</style>
    </section>
  )
}
