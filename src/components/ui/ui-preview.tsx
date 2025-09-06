'use client'

import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, ExternalLink, AlertCircle, CheckCircle, Clock, Target, HelpCircle } from 'lucide-react'

const previewPanels = [
  {
    id: 'brief',
    title: 'Project Brief',
    caption: 'Living summary: goals, open questions, next steps, risks.',
    content: (
      <div className="space-y-6">
        <div className="flex items-start gap-3">
          <Target className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Current Goals</h4>
            <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
              <li>• Launch MVP by Q2 with core user authentication</li>
              <li>• Validate product-market fit with 100 beta users</li>
              <li>• Establish sustainable unit economics model</li>
            </ul>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <HelpCircle className="w-5 h-5 text-amber-500 mt-1 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Open Questions</h4>
            <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
              <li>• Should we prioritize iOS or web-first for launch?</li>
              <li>• What's our target customer acquisition cost?</li>
            </ul>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Next Steps</h4>
            <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
              <li>• Finalize user onboarding flow design</li>
              <li>• Set up analytics tracking for key metrics</li>
              <li>• Schedule user interviews for next week</li>
            </ul>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Risks</h4>
            <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
              <li>• Timeline may slip if authentication issues persist</li>
              <li>• Competitor launched similar feature last week</li>
            </ul>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'since-left',
    title: 'Since You Left',
    caption: '3 decisions, 2 contradictions, 1 resurfaced insight.',
    content: (
      <div className="space-y-6">
        <div className="border-l-4 border-blue-500 pl-4">
          <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">3 Key Decisions Made</h4>
          <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
            <div className="bg-blue-50/50 dark:bg-blue-900/20 p-3 rounded-lg">
              <p className="font-medium text-blue-700 dark:text-blue-300">Decided: Web-first launch approach</p>
              <p className="mt-1">Team agreed to prioritize web platform for faster iteration cycles</p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Yesterday, 2:30 PM</p>
            </div>
            <div className="bg-blue-50/50 dark:bg-blue-900/20 p-3 rounded-lg">
              <p className="font-medium text-blue-700 dark:text-blue-300">Decided: $50 target CAC</p>
              <p className="mt-1">Based on competitor analysis and unit economics modeling</p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Yesterday, 4:15 PM</p>
            </div>
          </div>
        </div>
        
        <div className="border-l-4 border-amber-500 pl-4">
          <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">2 Contradictions Found</h4>
          <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
            <div className="bg-amber-50/50 dark:bg-amber-900/20 p-3 rounded-lg">
              <p className="font-medium text-amber-700 dark:text-amber-300">Timeline mismatch detected</p>
              <p className="mt-1">Q2 launch conflicts with authentication timeline in dev notes</p>
            </div>
          </div>
        </div>
        
        <div className="border-l-4 border-green-500 pl-4">
          <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">1 Resurfaced Insight</h4>
          <div className="bg-green-50/50 dark:bg-green-900/20 p-3 rounded-lg text-sm text-slate-600 dark:text-slate-400">
            <p className="font-medium text-green-700 dark:text-green-300">Previous user research</p>
            <p className="mt-1">Remember: 73% of beta users preferred simple onboarding over feature-rich intro</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'because',
    title: 'Because Panel',
    caption: 'Source links on every claim, so you can trust it.',
    content: (
      <div className="space-y-4">
        <div className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Sources for: <span className="font-medium">"Q2 launch with core user authentication"</span>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-slate-50/50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100/50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer">
            <ExternalLink className="w-4 h-4 text-slate-400 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Product Roadmap Meeting Notes</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">March 15, 2024 • Mentioned 3 times</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">"Targeting Q2 for MVP launch with basic auth system..."</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 bg-slate-50/50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100/50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer">
            <ExternalLink className="w-4 h-4 text-slate-400 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Engineering Sprint Planning</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">March 18, 2024 • Mentioned 2 times</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">"Authentication module completion by end of Q1..."</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 bg-slate-50/50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100/50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer">
            <ExternalLink className="w-4 h-4 text-slate-400 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Slack: #product-updates</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">March 20, 2024 • Mentioned 1 time</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">"Let's make sure auth is solid before Q2 launch..."</p>
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">Confidence:</span> High (6 sources) • 
            <span className="font-medium ml-2">Last updated:</span> 2 hours ago
          </p>
        </div>
      </div>
    )
  }
]

export function UIPreview() {
  const [activePanel, setActivePanel] = useState(0)

  const nextPanel = () => {
    setActivePanel((prev) => (prev + 1) % previewPanels.length)
  }

  const prevPanel = () => {
    setActivePanel((prev) => (prev - 1 + previewPanels.length) % previewPanels.length)
  }

  const currentPanel = previewPanels[activePanel]

  return (
    <section className="py-32 bg-gradient-to-b from-slate-50/50 via-blue-50/20 to-slate-50/50 dark:from-slate-800/50 dark:via-blue-950/20 dark:to-slate-800/50 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-gradient-to-br from-blue-200/20 to-indigo-200/15 dark:from-blue-800/10 dark:to-indigo-800/8 rounded-full blur-3xl animate-pulse-slow" />
      
      <div className="max-w-6xl mx-auto px-8 sm:px-12 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-light text-slate-900 dark:text-slate-100 leading-tight tracking-wide mb-6 animate-fade-in-up">
            What you'll actually see
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 font-light max-w-3xl mx-auto leading-relaxed animate-fade-in-up" style={{animationDelay: '0.2s'}}>
            Real outputs that save you hours of manual project tracking and context switching.
          </p>
        </div>

        {/* Preview Panel */}
        <div className="max-w-4xl mx-auto animate-fade-in-up" style={{animationDelay: '0.4s'}}>
          <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
            {/* Panel Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                  {currentPanel.title}
                </h3>
                <div className="flex items-center gap-2">
                  {previewPanels.map((panel, index) => (
                    <button
                      key={index}
                      onClick={() => setActivePanel(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-200 ${
                        index === activePanel 
                          ? 'bg-blue-500 scale-125' 
                          : 'bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500'
                      }`}
                      aria-label={`View ${panel.title}`}
                      title={`View ${panel.title}`}
                    />
                  ))}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={prevPanel}
                  className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  aria-label="Previous panel"
                  title="Previous panel"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextPanel}
                  className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  aria-label="Next panel"
                  title="Next panel"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Panel Content */}
            <div className="p-8 min-h-[400px]">
              {currentPanel.content}
            </div>
          </div>

          {/* Caption */}
          <p className="text-center text-slate-500 dark:text-slate-400 mt-6 text-sm">
            {currentPanel.caption}
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
