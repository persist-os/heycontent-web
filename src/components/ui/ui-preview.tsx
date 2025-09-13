'use client'

import React, { useState } from 'react'

export function UIPreview() {
  const [activeView, setActiveView] = useState<'current' | 'future'>('current')

  return (
    <section className="py-24 bg-slate-50/30 dark:bg-slate-800/30">
      <div className="max-w-7xl mx-auto px-8 sm:px-12">
        {/* Toggle */}
        <div className="text-center mb-16">
          <div className="inline-flex bg-white dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveView('current')}
              className={`px-6 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                activeView === 'current'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              What's here now
            </button>
            <button
              onClick={() => setActiveView('future')}
              className={`px-6 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                activeView === 'future'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              What's coming
            </button>
          </div>
        </div>

        {/* Current Interface */}
        {activeView === 'current' && (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl sm:text-4xl font-light text-slate-900 dark:text-slate-100">
                Advanced chat with contextual notes
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                The foundation: AI that remembers your conversations and helps you think through complex ideas.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="flex h-[500px]">
                {/* Chat side */}
                <div className="flex-1 flex flex-col">
                  <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    <h3 className="font-medium text-slate-900 dark:text-slate-100">Conversation</h3>
                  </div>
                  <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                    <div className="text-right">
                      <div className="inline-block bg-blue-600 text-white rounded-lg px-4 py-2 max-w-xs">
                        I'm working on a product launch strategy. Can you help me think through the key milestones?
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="inline-block bg-slate-100 dark:bg-slate-800 rounded-lg px-4 py-2 max-w-sm">
                        Based on our previous conversations about your target market, here's a strategic approach...
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 border-t border-slate-200 dark:border-slate-600 pt-2">
                          Connected to: "Target Market Analysis" from March 15
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="inline-block bg-blue-600 text-white rounded-lg px-4 py-2 max-w-xs">
                        That's helpful. Can you save the key points to my notes?
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="inline-block bg-slate-100 dark:bg-slate-800 rounded-lg px-4 py-2 max-w-sm">
                        I've updated your "Product Launch Strategy" note with the timeline and key insights we discussed.
                      </div>
                    </div>
                  </div>
                  <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Continue the conversation..."
                        className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                        disabled
                      />
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-md">Send</button>
                    </div>
                  </div>
                </div>

                {/* Notes side */}
                <div className="w-80 border-l border-slate-200 dark:border-slate-700 flex flex-col">
                  <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    <h3 className="font-medium text-slate-900 dark:text-slate-100">File System</h3>
                  </div>
                  <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                      <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Product Launch Strategy</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        Target market: Small business owners who value time-saving solutions
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Key insight: They prefer simple onboarding over feature-rich demos
                      </p>
                      <div className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                        Connected to 3 conversations
                      </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                      <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Competitor Analysis</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Average CAC in our space: $45-65. Most successful companies focus on quick wins first.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Future Interface */}
        {activeView === 'future' && (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl sm:text-4xl font-light text-slate-900 dark:text-slate-100">
                Project coordination that thinks ahead
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                The vision: AI that maintains project context, coordinates team members, and surfaces insights automatically.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Project Brief */}
              <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-4">Auto-Generated Project Brief</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Current Goals</h4>
                    <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                      <li>• Launch MVP by Q2 with core authentication</li>
                      <li>• Validate product-market fit with 100 beta users</li>
                      <li>• Establish sustainable unit economics</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Open Questions</h4>
                    <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                      <li>• iOS vs web-first for launch?</li>
                      <li>• Target customer acquisition cost?</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Next Steps</h4>
                    <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                      <li>• Finalize onboarding flow design</li>
                      <li>• Set up analytics tracking</li>
                      <li>• Schedule user interviews</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Auto-updated from team conversations and notes
                  </p>
                </div>
              </div>

              {/* Team Context */}
              <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-4">Team Context</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400">AS</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Alex (Designer)</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Working on onboarding flow mockups</p>
                      <p className="text-xs text-slate-500 dark:text-slate-500">Last active: 2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-green-600 dark:text-green-400">JD</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Jordan (Developer)</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Implementing authentication system</p>
                      <p className="text-xs text-slate-500 dark:text-slate-500">Last active: 30 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-purple-600 dark:text-purple-400">SM</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Sam (Product)</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Analyzing user interview feedback</p>
                      <p className="text-xs text-slate-500 dark:text-slate-500">Last active: 1 hour ago</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Everyone has access to shared project context
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-slate-500 dark:text-slate-400 font-light">
                Plus: automated conflict detection, intelligent task suggestions, and seamless handoffs between team members.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
