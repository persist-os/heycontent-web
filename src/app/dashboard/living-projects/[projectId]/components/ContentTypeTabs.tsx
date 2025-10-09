/**
 * Content Type Tabs Component
 * 
 * Tabbed interface for filtering project content by type.
 * Provides intuitive content navigation for the Project Content Display feature.
 */

"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { 
  FileText, 
  MessageCircle, 
  Gem, 
  Sparkles,
  Grid3X3
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ContentTypeFilter } from '@/convex/projectContentQueries';

interface ContentTypeTabsProps {
  activeTab: ContentTypeFilter;
  onTabChange: (tab: ContentTypeFilter) => void;
  contentCounts: {
    all: number;
    notes: number;
    conversations: number;
    crystals: number;
    shards: number;
  };
  className?: string;
}

interface TabConfig {
  id: ContentTypeFilter;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  hoverColor: string;
  activeColor: string;
}

const TAB_CONFIGS: TabConfig[] = [
  {
    id: "all",
    label: "All",
    icon: Grid3X3,
    color: "text-muted-foreground",
    hoverColor: "hover:text-foreground/70",
    activeColor: "text-foreground"
  },
  {
    id: "notes",
    label: "Notes",
    icon: FileText,
    color: "text-blue-600",
    hoverColor: "hover:text-blue-700",
    activeColor: "text-blue-600"
  },
  {
    id: "conversations",
    label: "Conversations",
    icon: MessageCircle,
    color: "text-green-600",
    hoverColor: "hover:text-green-700",
    activeColor: "text-green-600"
  },
  {
    id: "crystals",
    label: "Crystals",
    icon: Gem,
    color: "text-purple-600",
    hoverColor: "hover:text-purple-700",
    activeColor: "text-purple-600"
  },
  {
    id: "shards",
    label: "Shards",
    icon: Sparkles,
    color: "text-amber-600",
    hoverColor: "hover:text-amber-700",
    activeColor: "text-amber-600"
  }
];

export function ContentTypeTabs({
  activeTab,
  onTabChange,
  contentCounts,
  className = ''
}: ContentTypeTabsProps) {
  
  // Get count for a tab
  const getTabCount = (tabId: ContentTypeFilter): number => {
    return contentCounts[tabId] || 0;
  };

  // Check if tab is active
  const isActive = (tabId: ContentTypeFilter): boolean => {
    return activeTab === tabId;
  };

  // Get tab configuration
  const getTabConfig = (tabId: ContentTypeFilter): TabConfig => {
    return TAB_CONFIGS.find(config => config.id === tabId) || TAB_CONFIGS[0];
  };

  return (
    <div className={cn("border-b border-border/10 bg-background", className)}>
      <div className="flex items-center px-6">
        <div className="flex items-center gap-1 overflow-x-auto">
          {TAB_CONFIGS.map((config, index) => {
            const count = getTabCount(config.id);
            const active = isActive(config.id);
            const IconComponent = config.icon;
            
            return (
              <motion.button
                key={config.id}
                onClick={() => onTabChange(config.id)}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200 whitespace-nowrap",
                  "focus:outline-none focus:ring-2 focus:ring-accent/20 focus:ring-offset-2 rounded-lg",
                  active 
                    ? config.activeColor 
                    : `${config.color} ${config.hoverColor}`,
                  "hover:bg-muted/30 rounded-lg"
                )}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                {/* Icon */}
                <IconComponent className={cn(
                  "w-4 h-4 transition-colors",
                  active ? config.activeColor : config.color
                )} />
                
                {/* Label */}
                <span className="transition-colors">
                  {config.label}
                </span>
                
                {/* Count Badge */}
                {count > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.05 + 0.1 }}
                    className={cn(
                      "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-medium rounded-full transition-colors",
                      active 
                        ? "bg-accent/20 text-accent" 
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {count > 99 ? '99+' : count}
                  </motion.span>
                )}
                
                {/* Active indicator */}
                {active && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className={cn(
                      "absolute bottom-0 left-0 right-0 h-0.5 rounded-full",
                      config.activeColor.replace('text-', 'bg-')
                    )}
                    transition={{
                      type: "spring",
                      stiffness: 380,
                      damping: 30
                    }}
                  />
                )}
                
                {/* Hover indicator */}
                <motion.div
                  className={cn(
                    "absolute bottom-0 left-0 right-0 h-0.5 rounded-full opacity-0",
                    config.activeColor.replace('text-', 'bg-')
                  )}
                  initial={{ scaleX: 0, opacity: 0 }}
                  whileHover={{ 
                    scaleX: active ? 0 : 1, 
                    opacity: active ? 0 : 0.3 
                  }}
                  transition={{ duration: 0.2 }}
                />
              </motion.button>
            );
          })}
        </div>
        
        {/* Summary stats */}
        <div className="ml-auto flex items-center gap-4 text-xs text-muted-foreground">
          <div className="hidden sm:flex items-center gap-2">
            <span>Total:</span>
            <span className="font-medium text-foreground">
              {contentCounts.all}
            </span>
          </div>
          
          {/* Quick stats for mobile */}
          <div className="sm:hidden flex items-center gap-2">
            <span className="text-xs">
              {contentCounts.all} items
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
