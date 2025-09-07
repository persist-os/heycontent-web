'use client'

import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'
const faqData = [
  {
    question: "What's available right now?",
    answer: "Intelligence that builds like yours does. Conversations that remember what you discussed last week and connect it to what you're thinking today. Notes that spot patterns in your thinking. Writing help that knows your voice because it's been listening.<br><br>Not another chatbot. Not another note-taking app. An AI system that evolves with your work."
  },
  {
    question: "What's the project platform you're building toward?",
    answer: "Projects with their own living intelligence. Briefs that rewrite themselves as decisions change. Context that flows between team members without meetings or handoffs. Contradictions that surface before they become problems.<br><br>We're not building project management software. We're building projects that manage themselves through evolving AI."
  },
  {
    question: "How is this different from ChatGPT or Claude?",
    answer: "ChatGPT and Claude can remember conversations and have project features, but their memory is static. You upload a document once, it stays exactly the same forever.<br><br>HeyContext memory evolves. Your project briefs update themselves as you add new information. Contradictions get flagged automatically. Context builds and improves over time without you having to manage it.<br><br>It's the difference between a filing cabinet that stores things versus a project manager that actually thinks about your work."
  },
  {
    question: "Is this for teams or individuals?",
    answer: "Anyone whose work depends on context and continuity. Right now, each person gets their own evolving AI system. Soon, teams will share living project intelligence that updates everyone automatically.<br><br>Whether you're working alone or with others, the core value is the same: AI that thinks with you."
  },
  {
    question: "How do you handle privacy?",
    answer: "Your information stays yours. We only use cloud AI when you explicitly ask for help, and we show you exactly what's being processed. Your conversations, notes, and projects remain private.<br><br>No training on your data. No sharing with third parties. Your thoughts belong to you."
  },
  {
    question: "Do I need to be technical to use this?",
    answer: "Just think out loud. Chat about your work, jot down notes, work naturally. The AI builds itself around how you actually think and work.<br><br>No prompting. No organizing. No setup. Intelligence that adapts to you, not the other way around."
  },
  {
    question: "How do I get started?",
    answer: "Start talking about your work. The understanding begins forming immediately. Every conversation, every note, every idea becomes part of a growing intelligence that gets more valuable over time.<br><br>Your AI starts working from day one and gets smarter every day after."
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
    <section className="py-20 sm:py-28 lg:py-32 bg-gradient-to-b from-white via-slate-50/20 to-white dark:from-slate-900 dark:via-slate-800/20 dark:to-slate-900 relative overflow-hidden min-h-screen flex items-center">
        {/* Background elements */}
        <div className="absolute top-1/3 left-1/4 w-48 sm:w-64 h-48 sm:h-64 bg-gradient-to-br from-blue-100/15 to-indigo-100/10 dark:from-blue-900/8 dark:to-indigo-900/6 rounded-full blur-3xl animate-pulse-slow" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-8 lg:px-12 relative z-10 w-full">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-light text-slate-900 dark:text-slate-100 leading-tight tracking-wide mb-4 sm:mb-6 animate-fade-in-up">
              Frequently asked questions
            </h2>
            <p className="text-base sm:text-xl text-slate-600 dark:text-slate-400 font-light max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              Everything you need to know about HeyContext and how it works.
            </p>
          </div>

          <div className="space-y-3 sm:space-y-4 animate-fade-in-up" style={{animationDelay: '0.4s'}}>
            {faqData.map((item, index) => {
              const isOpen = openItems.has(index)
              return (
                <div 
                  key={index}
                  className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-lg sm:rounded-xl border border-slate-200/50 dark:border-slate-700/50 hover:border-blue-300/50 dark:hover:border-blue-600/30 transition-all duration-300 overflow-hidden active:scale-[0.99] sm:active:scale-100"
                >
                  <button
                    onClick={() => toggleItem(index)}
                    className="w-full px-4 sm:px-6 py-4 sm:py-5 text-left flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors duration-200 touch-manipulation"
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${index}`}
                  >
                    <h3 className="text-base sm:text-lg font-medium text-slate-900 dark:text-slate-100 pr-3 sm:pr-4">
                      {item.question}
                    </h3>
                    <ChevronDown 
                      className={`w-4 sm:w-5 h-4 sm:h-5 text-slate-500 dark:text-slate-400 transition-transform duration-200 flex-shrink-0 ${
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
                    <div className="px-4 sm:px-6 pb-4 sm:pb-5 pt-0">
                      <div className="w-full h-px bg-slate-200/50 dark:bg-slate-700/50 mb-3 sm:mb-4" />
                      <p 
                        className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed"
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
