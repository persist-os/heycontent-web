/**
 * Briefing Room - Empty State Component
 * 
 * Beautiful empty state when no briefings are present.
 */

"use client";

import React from "react";
import { motion } from "framer-motion";
import { T } from '@/components/translation';

export function EmptyBriefingRoom() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-accent/5 relative overflow-hidden">
      {/* Animated gradient orbs */}
      <div className="absolute top-1/4 right-1/3 w-[500px] h-[500px] bg-gradient-to-br from-primary/20 to-accent/15 rounded-full blur-3xl animate-pulse-slow pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/4 w-[450px] h-[450px] bg-gradient-to-br from-accent/15 to-secondary/10 rounded-full blur-3xl animate-pulse-slow-delay-2 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-br from-secondary/10 to-primary/5 rounded-full blur-3xl animate-pulse-slow-delay-4 pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl text-center px-8 relative z-10"
      >
        {/* Icon/Illustration with gradient */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-8"
        >
          <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-primary/20 via-accent/15 to-secondary/10 backdrop-blur-sm border border-primary/20 flex items-center justify-center shadow-2xl shadow-primary/20">
            <span className="text-6xl">🌌</span>
          </div>
        </motion.div>
        
        {/* Title with gradient text */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-4xl font-light tracking-tight mb-4"
        >
          <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            <T context="briefing.empty.title">Your Intelligence Room</T>
          </span>
          <span className="block text-2xl text-muted-foreground mt-2 font-light">
            <T context="briefing.empty.subtitle">awaits briefings</T>
          </span>
        </motion.h1>
        
        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-lg text-muted-foreground leading-relaxed mb-8"
        >
          <T context="briefing.empty.description">This is where your living intelligence will surface. Crystal formations, 
          widget completions, dream reports, and collaborative insights will gather here, 
          waiting to brief you on what matters.</T>
        </motion.p>
        
        {/* What to Expect - Gradient Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12"
        >
          {/* Crystal Card */}
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="space-y-2 bg-gradient-to-br from-primary/10 via-card to-card backdrop-blur-sm border border-primary/20 rounded-xl p-6 shadow-lg shadow-primary/10 hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300"
          >
            <div className="text-3xl">🔮</div>
            <h3 className="text-sm font-medium bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              <T context="briefing.empty.crystal.title">Crystal Formations</T>
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              <T context="briefing.empty.crystal.description">New patterns and insights crystallize from your data</T>
            </p>
          </motion.div>
          
          {/* Widget Card */}
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="space-y-2 bg-gradient-to-br from-accent/10 via-card to-card backdrop-blur-sm border border-accent/20 rounded-xl p-6 shadow-lg shadow-accent/10 hover:shadow-2xl hover:shadow-accent/20 transition-all duration-300"
          >
            <div className="text-3xl">🤖</div>
            <h3 className="text-sm font-medium bg-gradient-to-r from-accent to-accent/70 bg-clip-text text-transparent">
              <T context="briefing.empty.widget.title">Widget Reports</T>
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              <T context="briefing.empty.widget.description">Agents working while you sleep deliver findings</T>
            </p>
          </motion.div>
          
          {/* Dream Card */}
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="space-y-2 bg-gradient-to-br from-secondary/10 via-card to-card backdrop-blur-sm border border-secondary/20 rounded-xl p-6 shadow-lg shadow-secondary/10 hover:shadow-2xl hover:shadow-secondary/20 transition-all duration-300"
          >
            <div className="text-3xl">💭</div>
            <h3 className="text-sm font-medium bg-gradient-to-r from-secondary to-secondary/70 bg-clip-text text-transparent">
              <T context="briefing.empty.dream.title">Dream Syntheses</T>
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              <T context="briefing.empty.dream.description">Your system dreams about connections you've missed</T>
            </p>
          </motion.div>
        </motion.div>
        
        {/* Subtle hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="text-sm text-muted-foreground/60 mt-12 font-light tracking-wide"
        >
          <T context="briefing.empty.hint">The room is listening. Intelligence will arrive when ready.</T>
        </motion.p>
      </motion.div>
      
      {/* Animation styles */}
      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.08; transform: scale(1); }
          50% { opacity: 0.25; transform: scale(1.05); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 6s ease-in-out infinite;
        }
        .animate-pulse-slow-delay-2 {
          animation: pulse-slow 6s ease-in-out infinite;
          animation-delay: 2s;
        }
        .animate-pulse-slow-delay-4 {
          animation: pulse-slow 6s ease-in-out infinite;
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}

