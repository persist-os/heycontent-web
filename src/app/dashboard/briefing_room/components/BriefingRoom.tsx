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
import { authStateManager } from "@/app/lib/auth-state-manager";
import { T } from '@/components/translation';

export function BriefingRoom() {
  const [userId, setUserId] = React.useState<string | undefined>();
  const [activeFilter, setActiveFilter] = React.useState<string | null>(null);
  
  // Auth - Use centralized auth state manager to prevent multiple listeners
  React.useEffect(() => {
    const unsubscribe = authStateManager.subscribe((firebaseUser) => {
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
  
  // Filter events based on active filter
  const filteredEvents = React.useMemo(() => {
    if (!events) return [];
    if (!activeFilter) return events;
    
    if (activeFilter === "unread") {
      return events.filter(event => !event.viewed);
    }
    
    return events.filter(event => event.category === activeFilter);
  }, [events, activeFilter]);
  
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
          <p className="text-muted-foreground font-light">
            <T context="briefing.loading">Preparing the briefing room...</T>
          </p>
        </motion.div>
      </div>
    );
  }
  
  // Empty state
  if (!events || events.length === 0) {
    return <EmptyBriefingRoom />;
  }
  
  // Empty filtered state
  if (filteredEvents.length === 0 && activeFilter) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-muted-foreground font-light mb-4">
            <T context="briefing.no_results">No {activeFilter} briefings found</T>
          </p>
          <button
            onClick={() => setActiveFilter(null)}
            className="text-primary hover:text-primary/80 transition-colors"
          >
            <T context="briefing.show_all">Show all briefings</T>
          </button>
        </motion.div>
      </div>
    );
  }
  
  // Main briefing room interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 p-8 relative overflow-hidden">
      {/* Animated gradient orbs for depth */}
      <div className="absolute top-1/4 right-1/3 w-[500px] h-[500px] bg-gradient-to-br from-primary/20 to-accent/15 rounded-full blur-3xl animate-pulse-slow pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/4 w-[450px] h-[450px] bg-gradient-to-br from-accent/15 to-primary/10 rounded-full blur-3xl animate-pulse-slow-delayed pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-baseline gap-4 mb-2">
            <h1 className="text-5xl font-light tracking-tight bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              <T context="briefing.title">Briefing Room</T>
            </h1>
            <div className="h-px bg-gradient-to-r from-primary/50 via-accent/50 to-transparent flex-1 mb-4" />
          </div>
          <p className="text-xl font-light text-muted-foreground ml-2">
            <T context="briefing.subtitle">Your intelligence command center</T>
          </p>
        </motion.div>
        
        {/* Stats Overview - Filter Cards */}
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
              isActive={activeFilter === null}
              onClick={() => setActiveFilter(null)}
            />
            <StatCard
              label="Unread"
              value={counts.unread}
              color="blue"
              isActive={activeFilter === "unread"}
              onClick={() => setActiveFilter(activeFilter === "unread" ? null : "unread")}
            />
            <StatCard
              label="Crystals"
              value={counts.byCategory.crystal}
              color="blue"
              isActive={activeFilter === "crystal"}
              onClick={() => setActiveFilter(activeFilter === "crystal" ? null : "crystal")}
            />
            <StatCard
              label="Widgets"
              value={counts.byCategory.widget}
              color="amber"
              isActive={activeFilter === "widget"}
              onClick={() => setActiveFilter(activeFilter === "widget" ? null : "widget")}
            />
            <StatCard
              label="Dreams"
              value={counts.byCategory.dream}
              color="purple"
              isActive={activeFilter === "dream"}
              onClick={() => setActiveFilter(activeFilter === "dream" ? null : "dream")}
            />
          </motion.div>
        )}
        
        {/* Briefings List with gradient cards */}
        <div className="space-y-6 relative z-10">
          <AnimatePresence mode="popLayout">
            {filteredEvents.map((event, index) => (
              <motion.div
                key={event._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                className={`
                  bg-gradient-to-br from-card via-card to-${getCategoryGradient(event.category)}
                  backdrop-blur-lg 
                  rounded-xl p-6 
                  border border-border/50
                  shadow-xl shadow-${getCategoryShadow(event.category)}
                  hover:shadow-2xl hover:shadow-${getCategoryShadow(event.category)}
                  hover:scale-[1.01]
                  transition-all duration-300
                  group
                `}
              >
                {/* Category indicator */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${getCategoryColor(event.category)} shadow-lg shadow-${getCategoryShadow(event.category)}`} />
                    <span className="text-sm font-medium text-muted-foreground capitalize">
                      {event.category}
                    </span>
                    {!event.viewed && (
                      <motion.span 
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="text-xs px-2 py-1 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 text-primary border border-primary/30 backdrop-blur-sm"
                      >
                        New
                      </motion.span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleStar(event._id)}
                      className="text-muted-foreground hover:text-accent hover:scale-110 transition-all duration-200"
                    >
                      {event.starred ? "⭐" : "☆"}
                    </button>
                    <button
                      onClick={() => archive(event._id)}
                      className="text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 px-2 py-1 rounded transition-all duration-200"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
                
                {/* Content */}
                <h3 className="text-lg font-medium text-card-foreground mb-2 group-hover:text-primary transition-colors duration-200">
                  {event.type.replace(/_/g, " ")}
                </h3>
                
                {event.data && typeof event.data === "object" && (
                  <div className="text-sm text-muted-foreground space-y-1">
                    {Object.entries(event.data as Record<string, any>).slice(0, 3).map(([key, value]) => (
                      <div key={key} className="flex gap-2">
                        <span className="font-medium text-primary/70">{key}:</span>
                        <span>{String(value).substring(0, 100)}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Timestamp */}
                <p className="text-xs text-muted-foreground/70 mt-4">
                  {new Date(event.timestamp).toLocaleString()}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Animation styles */}
      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.08; transform: scale(1); }
          50% { opacity: 0.25; transform: scale(1.05); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 6s ease-in-out infinite;
        }
        .animate-pulse-slow-delayed {
          animation: pulse-slow 6s ease-in-out infinite;
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}

// Helper Components

function StatCard({
  label,
  value,
  color,
  pulse = false,
  isActive = false,
  onClick
}: {
  label: string;
  value: number;
  color: string;
  pulse?: boolean;
  isActive?: boolean;
  onClick?: () => void;
}) {
  const getGradientClass = () => {
    if (color === "blue") return "from-primary/20 to-primary/5";
    if (color === "amber") return "from-accent/20 to-accent/5";
    if (color === "purple") return "from-secondary/20 to-secondary/5";
    return "from-muted to-card";
  };
  
  const colorClass = color === "blue" ? "text-primary" : color === "amber" ? "text-accent" : color === "purple" ? "text-secondary" : "text-foreground";
  const shadowColor = color === "blue" ? "shadow-primary/20" : color === "amber" ? "shadow-accent/20" : "shadow-secondary/20";
  
  return (
    <div 
      className={`
        bg-gradient-to-br ${getGradientClass()} 
        backdrop-blur-md 
        rounded-xl p-4 
        border ${isActive ? 'border-primary/50' : 'border-border/50'}
        shadow-lg ${shadowColor}
        hover:shadow-xl hover:scale-105
        transition-all duration-300
        ${pulse ? "animate-pulse" : ""}
        ${onClick ? "cursor-pointer" : ""}
        ${isActive ? "ring-2 ring-primary/30" : ""}
      `}
      onClick={onClick}
    >
      <p className="text-xs text-muted-foreground mb-1 font-medium">
        <T context={`briefing.stats.${label.toLowerCase()}`}>{label}</T>
      </p>
      <p className={`text-2xl font-light ${colorClass}`}>
        {value}
      </p>
    </div>
  );
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    crystal: "bg-primary",
    widget: "bg-accent",
    dream: "bg-secondary",
    collaboration: "bg-primary/70",
    system: "bg-muted-foreground",
  };
  return colors[category] || "bg-muted-foreground";
}

function getCategoryGradient(category: string): string {
  const gradients: Record<string, string> = {
    crystal: "primary/5",
    widget: "accent/5",
    dream: "secondary/5",
    collaboration: "primary/3",
    system: "muted",
  };
  return gradients[category] || "muted";
}

function getCategoryShadow(category: string): string {
  const shadows: Record<string, string> = {
    crystal: "primary/10",
    widget: "accent/10",
    dream: "secondary/10",
    collaboration: "primary/8",
    system: "muted-foreground/10",
  };
  return shadows[category] || "muted-foreground/10";
}

