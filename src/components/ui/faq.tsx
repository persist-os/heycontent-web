'use client'

import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'
const faqData = [
  {
    question: "What's available right now?",
    answer: "Memory that accumulates and connects automatically. Every conversation you have, every note you write, feeds a system that spots patterns and surfaces insights.<br><br>Chat that references what you said last month without prompting. Notes that link to related thinking across all your content. Writing assistance that knows your voice because it's been listening.<br><br>Not a storage system. Active memory that processes and grows."
  },
  {
    question: "Where is this headed?",
    answer: "Background processing that happens overnight. Contradictions spotted before you see them. Understanding that refines itself while you're away.<br><br>Multiple forms of analysis running simultaneously—each one feeding insights to the others. Your work developing depth even when you're not actively working on it.<br><br>Eventually: memory so deep it anticipates what you need before you ask."
  },
  {
    question: "How is this different from ChatGPT or Claude?",
    answer: "They remember conversations. We extract understanding.<br><br>ChatGPT and Claude: You upload a document, it stays exactly as uploaded. Static memory that requires you to manage it.<br><br>This: Every interaction feeds background analysis. Connections form between old conversations and new ones. Patterns emerge across everything you've said. Memory that actively processes instead of passively storing.<br><br>Their memory is a filing cabinet. Ours is a living system that thinks about your work even when you're not."
  },
  {
    question: "Who is this for?",
    answer: "Anyone drowning in scattered notes and disconnected thoughts.<br><br>Anyone tired of re-explaining the same context to AI over and over.<br><br>Anyone who wishes their tools remembered not just what they said, but why it mattered.<br><br>If your work involves ideas that build over time, this was built for you."
  },
  {
    question: "What about privacy?",
    answer: "Your conversations and notes stay yours. Period.<br><br>We use cloud AI only when you explicitly ask for help. You see exactly what's processing. Nothing trains external models. Nothing gets shared or sold.<br><br>Your thinking belongs to you. We just help you make sense of it."
  },
  {
    question: "Is this complicated to use?",
    answer: "Talk about whatever you're working on. Write notes like you normally would. The system figures out what matters.<br><br>No prompt engineering. No organizing into the 'right' format. No setup rituals. It learns how you naturally communicate and adapts.<br><br>Complicated under the hood. Dead simple in practice."
  },
  {
    question: "How do I start?",
    answer: "Sign up. Start a conversation about your work.<br><br>The memory begins building immediately. Every message adds context. Every note creates connections. Within days, you'll have an AI that knows your work better than any tool you've used.<br><br>The sooner you start, the sooner it becomes indispensable."
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
                    aria-expanded={isOpen ? 'true' : 'false'}
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
