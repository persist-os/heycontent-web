'use client'

import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { T } from '@/components/translation'

const faqData = [
  {
    question: "How does it work without prompts?",
    answer: "The system automatically creates the right instructions for each agent based on your project. You never write prompts—everything is handled behind the scenes. Each agent gets exactly what it needs to do its job, tailored to your specific work. And every time they work, they learn and get better."
  },
  {
    question: "Why one conversation per project?",
    answer: "Traditional AI forgets after a few messages and requires constant new conversations. HeyContext remembers everything by tying one conversation to one project and searching through individual messages so it finds exactly what you mentioned, even weeks later. Each agent only looks at what it needs and can share what it discovers with other agents."
  },
  {
    question: "What actually happens when I send a message?",
    answer: "Everything starts moving: widgets appear, an execution plan is created, instructions are created automatically, and agents begin working. They understand your context, figure out what needs to happen first, and work together. Your deliverables appear as they're built—lists, timelines, reports—all ready to edit. It all happens quickly."
  },
  {
    question: "What are structured artifacts?",
    answer: "Not just text—real work you can edit and use: lists, reports, timelines, trackers, and more. Everything is saved with version tracking, so multiple agents can update the same piece as your project evolves. Think of them as living documents that grow with your work."
  },
  {
    question: "Can I really walk away and come back?",
    answer: "Yes—that's the design. Start a project, close your laptop, and return later to completed work. Or watch it happen in real-time if you prefer. Agents can schedule recurring work and keep going while you're offline. Updates appear in your conversation when ready."
  },
  {
    question: "How do agents coordinate on complex projects?",
    answer: "Each project brings together specialized agents—researchers, analysts, writers—that share what they discover. The system figures out the right order: research happens first, then analysis uses those findings, then writers create the final work. Everyone stays in sync."
  },
  {
    question: "Does it actually learn and improve?",
    answer: "Yes. The system learns from how you interact—what you like, what you change, how you work. Agents adapt to your style, remember your preferences, and get better with each project. The more you use it, the smarter it becomes for you."
  },
  {
    question: "What about teams and enterprises?",
    answer: "Coming soon: company-wide setups with admin tools, industry grade security, team collaboration, and custom features for different industries. Consulting firms save significant time per person each week. Law firms write briefs much faster. Enterprise plans will be available with flexible pricing. Contact us at hello@persistos.co to discuss your needs."
  },
  {
    question: "How much time does this actually save?",
    answer: "Individual users save massive amounts of time on research and planning—what used to take hours now takes just minutes of review. Enterprise teams save many hours per employee each week, effectively multiplying capacity without adding people."
  },
  {
    question: "How do I start?",
    answer: "Sign up free—no credit card required. Create your first project, send one message describing what you need, and watch widgets appear. The system handles everything behind the scenes. Review, edit, and reference when ready. "
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
              <T context="faq.heading">Frequently asked questions</T>
            </h2>
            <p className="text-sm sm:text-base lg:text-xl text-muted-foreground font-light max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              <T context="faq.subheading">Everything you need to know about HeyContext and how it works.</T>
            </p>
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
                      <div 
                        className="text-xs sm:text-sm lg:text-base text-muted-foreground leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: item.answer }}
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
