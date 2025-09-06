'use client'

import React from 'react'
import { Rocket, Search, Users } from 'lucide-react'

const personas = [
  {
    icon: Rocket,
    title: "Founders & indie builders",
    problem: "Juggling multiple initiatives without losing context",
    outcome: "Keep multiple initiatives moving without context loss."
  },
  {
    icon: Search,
    title: "Researchers",
    problem: "Turning scattered PDFs and links into coherent insights",
    outcome: "Turn PDFs/links into evolving briefs you can trust."
  },
  {
    icon: Users,
    title: "Freelancers",
    problem: "Managing many client threads and staying up to speed",
    outcome: "Walk into every client call fully up to speed."
  }
]

export function Personas() {
  return (
    <section className="py-32 bg-gradient-to-b from-slate-50/30 via-white to-slate-50/30 dark:from-slate-800/30 dark:via-slate-900 dark:to-slate-800/30 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-gradient-to-r from-emerald-100/20 to-teal-100/15 dark:from-emerald-900/10 dark:to-teal-900/8 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-gradient-to-l from-blue-100/15 to-indigo-100/10 dark:from-blue-900/8 dark:to-indigo-900/6 rounded-full blur-3xl animate-float-delayed" />
      
      <div className="max-w-6xl mx-auto px-8 sm:px-12 relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-4xl sm:text-5xl font-light text-slate-900 dark:text-slate-100 leading-tight tracking-wide mb-6 animate-fade-in-up">
            For whom
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 font-light max-w-3xl mx-auto leading-relaxed animate-fade-in-up" style={{animationDelay: '0.2s'}}>
            Built for people who manage complex, evolving work that matters.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {personas.map((persona, index) => {
            const IconComponent = persona.icon
            return (
              <div 
                key={index} 
                className="group bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl p-8 border border-slate-200/50 dark:border-slate-700/50 hover:border-blue-300/50 dark:hover:border-blue-600/30 transition-all duration-500 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/10 animate-fade-in-up"
                style={{animationDelay: `${0.4 + index * 0.2}s`}}
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-400/10 dark:to-indigo-400/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <IconComponent className="w-8 h-8 text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-300" />
                </div>
                
                <h3 className="text-2xl font-medium text-slate-900 dark:text-slate-100 mb-4 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors duration-300">
                  {persona.title}
                </h3>
                
                <div className="space-y-4">
                  <div className="text-slate-600 dark:text-slate-400 font-light leading-relaxed">
                    <span className="text-slate-500 dark:text-slate-500 text-sm uppercase tracking-wide">Problem:</span>
                    <p className="mt-1">{persona.problem}</p>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                    <span className="text-blue-600 dark:text-blue-400 text-sm uppercase tracking-wide font-medium">Outcome:</span>
                    <p className="mt-1 text-slate-700 dark:text-slate-300 font-medium">{persona.outcome}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom CTA hint */}
        <div className="mt-20 text-center animate-fade-in-up" style={{animationDelay: '1s'}}>
          <p className="text-slate-500 dark:text-slate-400 font-light text-lg">
            Whether you're building, researching, or consulting—HeyContext keeps your projects alive.
          </p>
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
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-20px) rotate(1deg); }
          66% { transform: translateY(10px) rotate(-1deg); }
        }
        
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(15px) rotate(-1deg); }
          66% { transform: translateY(-10px) rotate(1deg); }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
          opacity: 0;
        }
        
        .animate-float {
          animation: float 12s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 14s ease-in-out infinite;
        }
      `}</style>
    </section>
  )
}
