'use client'

import React from 'react'
import { Shield, Eye, Link } from 'lucide-react'

export function PrivacyTrust() {
  return (
    <section className="py-24 bg-gradient-to-b from-slate-50/50 via-blue-50/10 to-slate-50/50 dark:from-slate-800/50 dark:via-blue-950/10 dark:to-slate-800/50 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-green-100/20 to-blue-100/15 dark:from-green-900/10 dark:to-blue-900/8 rounded-full blur-3xl animate-pulse-slow" />
      
      <div className="max-w-5xl mx-auto px-8 sm:px-12 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-light text-slate-900 dark:text-slate-100 leading-tight tracking-wide mb-6 animate-fade-in-up">
            Privacy & trust
          </h2>
        </div>

        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-8 sm:p-12 border border-slate-200/50 dark:border-slate-700/50 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
          <div className="flex flex-col sm:flex-row items-start gap-8 text-center sm:text-left">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500/10 to-green-600/10 dark:from-green-400/10 dark:to-green-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-1">Local-first capture</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">Your data stays on your device by default</p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-1">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500/10 to-blue-600/10 dark:from-blue-400/10 dark:to-blue-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Eye className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-1">Explicit cloud calls</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">You see exactly when and why data is processed</p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-1">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500/10 to-purple-600/10 dark:from-purple-400/10 dark:to-purple-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Link className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-1">'Because' on every answer</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">Full provenance and source links</p>
              </div>
            </div>
          </div>
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
          50% { opacity: 0.2; transform: scale(1.02); }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
          opacity: 0;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 10s ease-in-out infinite;
        }
      `}</style>
    </section>
  )
}
