/**
 * Briefing Room - Main Orchestrator Component
 * 
 * The living intelligence command center.
 * Not a dashboard - a stage where autonomous briefing agents perform.
 */

"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBriefingRoom } from "../hooks";
import { EmptyBriefingRoom } from "./EmptyBriefingRoom";
import { getFirebaseAuth } from "@/app/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export function BriefingRoom() {
  const [userId, setUserId] = React.useState<string | undefined>();
  
  // Auth
  React.useEffect(() => {
    let auth;
    try {
      auth = getFirebaseAuth();
    } catch (e) {
      auth = null;
    }
    if (!auth) return;
    
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUserId(firebaseUser?.uid);
    });
    
    return () => unsubscribe();
  }, []);
  
  // Briefing room data
  const {
    events,
    counts,
    preferences,
    isLoading,
    markViewed,
    archive,
    toggleStar,
  } = useBriefingRoom(userId);
  
  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="text-4xl mb-4">🌌</div>
          <p className="text-slate-600 dark:text-slate-400 font-light">
            Preparing the briefing room...
          </p>
        </motion.div>
      </div>
    );
  }
  
  // Empty state
  if (!events || events.length === 0) {
    return <EmptyBriefingRoom />;
  }
  
  // Main briefing room interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-baseline gap-4 mb-2">
            <h1 className="text-5xl font-light tracking-tight text-slate-900 dark:text-slate-100">
              Briefing Room
            </h1>
            <div className="h-px bg-slate-300 dark:bg-slate-700 flex-1 mb-4" />
          </div>
          <p className="text-xl font-light text-slate-600 dark:text-slate-400 ml-2">
            Your intelligence command center
          </p>
        </motion.div>
        
        {/* Stats Overview */}
        {counts && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12"
          >
            <StatCard
              label="Total"
              value={counts.total}
              color="slate"
            />
            <StatCard
              label="Unread"
              value={counts.unread}
              color="blue"
              pulse={counts.unread > 0}
            />
            <StatCard
              label="Crystals"
              value={counts.byCategory.crystal}
              color="blue"
            />
            <StatCard
              label="Widgets"
              value={counts.byCategory.widget}
              color="amber"
            />
            <StatCard
              label="Dreams"
              value={counts.byCategory.dream}
              color="purple"
            />
          </motion.div>
        )}
        
        {/* Briefings List (temporary simple implementation) */}
        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {events.map((event, index) => (
              <motion.div
                key={event._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-lg p-6 border border-slate-200/50 dark:border-slate-800/50"
              >
                {/* Category indicator */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${getCategoryColor(event.category)}`} />
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400 capitalize">
                      {event.category}
                    </span>
                    {!event.viewed && (
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                        New
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleStar(event._id)}
                      className="text-slate-400 hover:text-amber-500 transition-colors"
                    >
                      {event.starred ? "⭐" : "☆"}
                    </button>
                    <button
                      onClick={() => archive(event._id)}
                      className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
                
                {/* Content */}
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                  {event.type.replace(/_/g, " ")}
                </h3>
                
                {event.data && typeof event.data === "object" && (
                  <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                    {Object.entries(event.data as Record<string, any>).slice(0, 3).map(([key, value]) => (
                      <div key={key} className="flex gap-2">
                        <span className="font-medium">{key}:</span>
                        <span>{String(value).substring(0, 100)}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Timestamp */}
                <p className="text-xs text-slate-400 mt-4">
                  {new Date(event.timestamp).toLocaleString()}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// Helper Components

function StatCard({
  label,
  value,
  color,
  pulse = false
}: {
  label: string;
  value: number;
  color: string;
  pulse?: boolean;
}) {
  return (
    <div className={`bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-lg p-4 border border-slate-200/50 dark:border-slate-800/50 ${pulse ? "animate-pulse" : ""}`}>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{label}</p>
      <p className={`text-2xl font-light text-${color}-600 dark:text-${color}-400`}>
        {value}
      </p>
    </div>
  );
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    crystal: "bg-blue-500",
    widget: "bg-amber-500",
    dream: "bg-purple-500",
    collaboration: "bg-green-500",
    system: "bg-slate-500",
  };
  return colors[category] || "bg-slate-500";
}

