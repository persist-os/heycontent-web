/**
 * Briefing Room - Empty State Component
 * 
 * Beautiful empty state when no briefings are present.
 */

"use client";

import React from "react";
import { motion } from "framer-motion";

export function EmptyBriefingRoom() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl text-center px-8"
      >
        {/* Icon/Illustration */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-8"
        >
          <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 flex items-center justify-center">
            <span className="text-6xl">🌌</span>
          </div>
        </motion.div>
        
        {/* Title */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-4xl font-light tracking-tight text-slate-900 dark:text-slate-100 mb-4"
        >
          Your Intelligence Room
          <span className="block text-2xl text-slate-500 dark:text-slate-400 mt-2 font-light">
            awaits briefings
          </span>
        </motion.h1>
        
        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-8"
        >
          This is where your living intelligence will surface. Crystal formations, 
          widget completions, dream reports, and collaborative insights will gather here, 
          waiting to brief you on what matters.
        </motion.p>
        
        {/* What to Expect */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12"
        >
          <div className="space-y-2">
            <div className="text-3xl">🔮</div>
            <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">
              Crystal Formations
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              New patterns and insights crystallize from your data
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="text-3xl">🤖</div>
            <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">
              Widget Reports
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Agents working while you sleep deliver findings
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="text-3xl">💭</div>
            <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">
              Dream Syntheses
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Your system dreams about connections you've missed
            </p>
          </div>
        </motion.div>
        
        {/* Subtle hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="text-sm text-slate-400 dark:text-slate-600 mt-12 font-light tracking-wide"
        >
          The room is listening. Intelligence will arrive when ready.
        </motion.p>
      </motion.div>
    </div>
  );
}

