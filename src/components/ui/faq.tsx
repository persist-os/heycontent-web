'use client'

import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'
const faqData = [
  {
    question: "What makes HeyContext different from notes apps or AI chat?",
    answer: "Notes store text; chat answers prompts. HeyContext keeps **projects** alive. It runs background agents that condense updates, flag contradictions, and prepare \"Since-You-Left\" bundles—so you always start from context, not from scratch."
  },
  {
    question: "What do I actually see in the app?",
    answer: "A **Project Brief** that updates itself (goals, decisions, milestones), **Since-You-Left bundles** when you return, **Contradiction Flags** for mismatched info, and a **Because panel** showing sources for every claim."
  },
  {
    question: "Do I need to organize anything?",
    answer: "No. Drop notes and conversations into a project; the system structures and updates the brief for you."
  },
  {
    question: "How is this private?",
    answer: "Local-first by default with explicit, itemized cloud calls. Every surfaced claim links back to its source. You decide what to share."
  },
  {
    question: "Can I use it without being \"good at AI\"?",
    answer: "Yes. You don't have to prompt. The value shows up as **ready-to-use outputs**—briefs, bundles, and tasks."
  },
  {
    question: "What's under the hood?",
    answer: "Async multi-agent orchestration and a Redis-powered working memory. That's how your projects stay current without you doing busywork."
  },
  {
    question: "How do I start?",
    answer: "Create a project, paste your notes/links, and come back later. You'll find a fresh brief and a **Since-You-Left** bundle waiting."
  }
]

export function FAQ() {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set())

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems)
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index)
    } else {
      newOpenItems.add(index)
    }
    setOpenItems(newOpenItems)
  }

  return (
    <section className="py-32 bg-gradient-to-b from-white via-slate-50/20 to-white dark:from-slate-900 dark:via-slate-800/20 dark:to-slate-900 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-gradient-to-br from-blue-100/15 to-indigo-100/10 dark:from-blue-900/8 dark:to-indigo-900/6 rounded-full blur-3xl animate-pulse-slow" />
        
        <div className="max-w-4xl mx-auto px-8 sm:px-12 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-light text-slate-900 dark:text-slate-100 leading-tight tracking-wide mb-6 animate-fade-in-up">
              Frequently asked questions
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 font-light max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              Everything you need to know about HeyContext and how it works.
            </p>
          </div>

          <div className="space-y-4 animate-fade-in-up" style={{animationDelay: '0.4s'}}>
            {faqData.map((item, index) => {
              const isOpen = openItems.has(index)
              return (
                <div 
                  key={index}
                  className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-xl border border-slate-200/50 dark:border-slate-700/50 hover:border-blue-300/50 dark:hover:border-blue-600/30 transition-all duration-300 overflow-hidden"
                >
                  <button
                    onClick={() => toggleItem(index)}
                    className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors duration-200"
                    aria-expanded={isOpen ? 'true' : 'false'}
                    aria-controls={`faq-answer-${index}`}
                  >
                    <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 pr-4">
                      {item.question}
                    </h3>
                    <ChevronDown 
                      className={`w-5 h-5 text-slate-500 dark:text-slate-400 transition-transform duration-200 flex-shrink-0 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  
                  <div 
                    id={`faq-answer-${index}`}
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="px-6 pb-5 pt-0">
                      <div className="w-full h-px bg-slate-200/50 dark:bg-slate-700/50 mb-4" />
                      <p 
                        className="text-slate-600 dark:text-slate-400 leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html: item.answer
                            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-700 dark:text-slate-300">$1</strong>')
                            .replace(/\n/g, '<br>')
                        }}
                      />
                    </div>
                  </div>
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
          
          @keyframes pulse-slow {
            0%, 100% { opacity: 0.1; transform: scale(1); }
            50% { opacity: 0.3; transform: scale(1.05); }
          }
          
          .animate-fade-in-up {
            animation: fade-in-up 0.8s ease-out forwards;
            opacity: 0;
          }
          
          .animate-pulse-slow {
            animation: pulse-slow 8s ease-in-out infinite;
          }
        `}</style>
      </section>
    )
}
