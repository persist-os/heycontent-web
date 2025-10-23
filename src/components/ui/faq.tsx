'use client'

import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { T } from '@/components/translation'

const faqData = [
  {
    question: "What's available right now?",
    answer: "Three powerful realms that work together. Constellations—visual projects where your goals evolve with custom AI tools. A Thinking Lab for deep conversations that remember everything you've ever discussed. Files that automatically link related ideas across all your content. Cosmic Intelligence that reveals patterns in your thinking and behavior.<br><br>Each realm learns from how you work and gets smarter over time. No setup required—just start using them naturally."
  },
  {
    question: "Where is this headed?",
    answer: "Your system will dream while you sleep. It'll discover connections between your work patterns, suggest experiments based on your behavior, and wake you up to insights you never noticed.<br><br>Your AI companions will develop personalities and teach each other new skills. Tools will automatically learn the perfect combinations for any task. Everything becomes more intelligent the more you use it."
  },
  {
    question: "How is this different from ChatGPT or Claude?",
    answer: "They're chatbots. This is a living system.<br><br>ChatGPT and Claude: You ask questions, they answer. Each conversation is separate.<br><br>This: Your projects evolve. Constellations generate custom tools for your goals. The Thinking Lab remembers every conversation and connects ideas across time. Cosmic Intelligence spots patterns you miss. It's not just AI—it's your second brain growing smarter."
  },
  {
    question: "Who is this for?",
    answer: "Anyone who thinks deeply about their work and life.<br><br>Anyone tired of explaining the same context to AI over and over.<br><br>Anyone who wants their tools to understand not just what they're doing, but how they think.<br><br>If you have ideas that build over time, goals that evolve, or thoughts that connect across different areas of your life—this was built for you."
  },
  {
    question: "Privacy & Trustworthiness",
    answer: "Your data is yours.<br>HeyContext DOES NOT sell your data or use it for profit-seeking purposes.<br><br>You can trust what you read.<br>Generated content links to source material for easy verification."
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
    <section className="py-20 sm:py-28 lg:py-32 bg-gradient-to-b from-primary/[0.08] via-accent/[0.07] to-primary/[0.08] dark:from-background dark:via-muted/[0.05] dark:to-background relative overflow-hidden min-h-screen flex items-center">
        {/* Background elements - dramatic gradient orbs */}
        <div className="absolute top-1/3 left-1/4 w-[550px] h-[550px] bg-gradient-to-br from-primary/[0.22] to-accent/[0.18] dark:from-primary/[0.04] dark:to-accent/[0.03] rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-accent/[0.20] to-primary/[0.15] dark:from-accent/[0.04] dark:to-primary/[0.03] rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '2s'}} />
        <div className="absolute top-1/2 right-1/3 w-[450px] h-[450px] bg-gradient-to-br from-primary/[0.18] to-accent/[0.12] dark:from-primary/[0.04] dark:to-accent/[0.03] rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '4s'}} />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-8 lg:px-12 relative z-10 w-full">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-light text-foreground leading-tight tracking-wide mb-4 sm:mb-6 animate-fade-in-up">
              <T context="faq.heading">Frequently asked questions</T>
            </h2>
            <p className="text-base sm:text-xl text-muted-foreground font-light max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              <T context="faq.subheading">Everything you need to know about HeyContext and how it works.</T>
            </p>
          </div>

          <div className="space-y-3 sm:space-y-4 animate-fade-in-up" style={{animationDelay: '0.4s'}}>
            {faqData.map((item, index) => {
              const isOpen = openItems.has(index)
              return (
                <div 
                  key={index}
                  className="bg-gradient-to-br from-card/85 via-primary/[0.07] to-accent/[0.06] dark:bg-card/70 backdrop-blur-xl hover:backdrop-blur-2xl rounded-xl sm:rounded-2xl border-2 border-primary/[0.30] dark:border-border hover:border-accent/[0.40] dark:hover:border-primary/[0.15] shadow-xl shadow-primary/[0.20] hover:shadow-2xl hover:shadow-accent/[0.30] dark:shadow-primary/[0.10] dark:hover:shadow-primary/[0.15] hover:bg-gradient-to-br hover:from-card/90 hover:via-primary/[0.08] hover:to-accent/[0.08] transition-all duration-300 overflow-hidden hover:scale-[1.01] active:scale-[0.99]"
                >
                  <button
                    onClick={() => toggleItem(index)}
                    className="w-full px-5 sm:px-7 py-5 sm:py-6 text-left flex items-center justify-between hover:bg-gradient-to-r hover:from-primary/[0.04] hover:via-accent/[0.035] hover:to-primary/[0.03] dark:hover:bg-muted/50 rounded-t-xl sm:rounded-t-2xl transition-all duration-200 touch-manipulation"
                    aria-expanded={isOpen ? "true" : "false"}
                    aria-controls={`faq-answer-${index}`}
                  >
                    <h3 className="text-base sm:text-lg font-medium text-foreground pr-3 sm:pr-4">
                      <T context={`faq.question${index + 1}`}>{item.question}</T>
                    </h3>
                    <ChevronDown 
                      className={`w-4 sm:w-5 h-4 sm:h-5 text-muted-foreground transition-transform duration-200 flex-shrink-0 ${
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
                    <div className="px-5 sm:px-7 pb-5 sm:pb-6 pt-0">
                      <div className="w-full h-px bg-gradient-to-r from-primary/[0.30] via-accent/[0.25] to-primary/[0.20] dark:bg-border mb-4 sm:mb-5" />
                      <div className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                        <T context={`faq.answer${index + 1}`}>{item.answer.replace(/<br><br>/g, '\n\n').replace(/<br>/g, '\n')}</T>
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
