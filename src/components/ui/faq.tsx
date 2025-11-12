'use client'

import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { T } from '@/components/translation'

const faqData = [
  {
    question: "What happens when I send a message?",
    answer: "Widgets appear, agents coordinate, and deliverables are built—lists, timelines, reports—all ready to edit. Everything runs autonomously in the background."
  },
  {
    question: "What are structured artifacts?",
    answer: "Real work you can edit: lists, reports, timelines, trackers. Version-tracked and editable. Multiple agents can update the same artifact as your project evolves."
  },
  {
    question: "How do agents coordinate?",
    answer: "Specialized agents share discoveries and work in the right order. Research happens first, then analysis uses those findings, then writers create the final work. Everyone stays in sync."
  },
  {
    question: "Can I edit artifacts after they're created?",
    answer: "Yes. Edit directly, and related artifacts automatically reflect changes. Everything is versioned so you can see what changed and when."
  },
  {
    question: "Does this integrate with my existing tools?",
    answer: "Yes. Email templates connect to Gmail. Timelines sync with calendars. Reports export to PDF or markdown. Works with tools you already use."
  },
  {
    question: "What if agents create something I don't want?",
    answer: "Delete it, edit it, or ask for revisions. You're always in control. Agents learn from your edits and get better over time."
  },
  {
    question: "How does team collaboration work?",
    answer: "Share the link. Everyone sees agents building and can edit artifacts in real-time. All changes are tracked and versioned."
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
    <section className="py-12 sm:py-20 lg:py-32 bg-gradient-to-b from-primary/[0.08] via-accent/[0.07] to-primary/[0.08] dark:from-background dark:via-muted/[0.05] dark:to-background relative overflow-hidden min-h-screen flex items-center">
        {/* Background elements - smaller on mobile */}
        <div className="absolute top-1/3 left-1/4 w-[200px] h-[200px] sm:w-[400px] sm:h-[400px] lg:w-[550px] lg:h-[550px] bg-gradient-to-br from-primary/[0.22] to-accent/[0.18] dark:from-primary/[0.04] dark:to-accent/[0.03] rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-[180px] h-[180px] sm:w-[350px] sm:h-[350px] lg:w-[500px] lg:h-[500px] bg-gradient-to-br from-accent/[0.20] to-primary/[0.15] dark:from-accent/[0.04] dark:to-primary/[0.03] rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '2s'}} />
        <div className="absolute top-1/2 right-1/3 w-[150px] h-[150px] sm:w-[300px] sm:h-[300px] lg:w-[450px] lg:h-[450px] bg-gradient-to-br from-primary/[0.18] to-accent/[0.12] dark:from-primary/[0.04] dark:to-accent/[0.03] rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '4s'}} />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-12 relative z-10 w-full">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-xl sm:text-3xl lg:text-5xl font-light text-foreground leading-tight tracking-wide mb-3 sm:mb-4 lg:mb-6 animate-fade-in-up">
              FAQ
            </h2>
          </div>

          <div className="space-y-2.5 sm:space-y-3 lg:space-y-4 animate-fade-in-up" style={{animationDelay: '0.4s'}}>
            {faqData.map((item, index) => {
              const isOpen = openItems.has(index)
              return (
                <div 
                  key={index}
                  className="bg-gradient-to-br from-card/85 via-primary/[0.07] to-accent/[0.06] dark:bg-card/70 backdrop-blur-xl hover:backdrop-blur-2xl rounded-lg sm:rounded-xl lg:rounded-2xl border-2 border-primary/[0.30] dark:border-border hover:border-accent/[0.40] dark:hover:border-primary/[0.15] shadow-xl shadow-primary/[0.20] hover:shadow-2xl hover:shadow-accent/[0.30] dark:shadow-primary/[0.10] dark:hover:shadow-primary/[0.15] hover:bg-gradient-to-br hover:from-card/90 hover:via-primary/[0.08] hover:to-accent/[0.08] transition-all duration-300 overflow-hidden hover:scale-[1.01] active:scale-[0.99]"
                >
                  <button
                    onClick={() => toggleItem(index)}
                    className="w-full px-4 sm:px-5 lg:px-7 py-4 sm:py-5 lg:py-6 text-left flex items-center justify-between hover:bg-gradient-to-r hover:from-primary/[0.04] hover:via-accent/[0.035] hover:to-primary/[0.03] dark:hover:bg-muted/50 rounded-t-lg sm:rounded-t-xl lg:rounded-t-2xl transition-all duration-200 touch-manipulation"
                    aria-controls={`faq-answer-${index}`}
                  >
                    <h3 className="text-sm sm:text-base lg:text-lg font-medium text-foreground pr-2 sm:pr-3 lg:pr-4">
                      <T context={`faq.question${index + 1}`}>{item.question}</T>
                    </h3>
                    <ChevronDown 
                      className={`w-3.5 sm:w-4 lg:w-5 h-3.5 sm:h-4 lg:h-5 text-muted-foreground transition-transform duration-200 flex-shrink-0 ${
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
                    <div className="px-4 sm:px-5 lg:px-7 pb-4 sm:pb-5 lg:pb-6 pt-0">
                      <div className="w-full h-px bg-gradient-to-r from-primary/[0.30] via-accent/[0.25] to-primary/[0.20] dark:bg-border mb-3 sm:mb-4 lg:mb-5" />
                      <div className="text-xs sm:text-sm lg:text-base text-muted-foreground leading-relaxed">
                        <T context={`faq.answer${index + 1}`}>{item.answer}</T>
                      </div>
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

