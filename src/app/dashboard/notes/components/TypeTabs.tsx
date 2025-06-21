"use client";
import React from 'react';
import { Star, Folder, Lightbulb, FileText, Users, BarChart3, BookOpen, CheckSquare } from 'lucide-react';
import { NoteType } from '../types';
import { TypeStats } from '../hooks/useNoteTypeStats';

interface TypeTabsProps {
  typeStats: TypeStats[];
  totalNotes: number;
  importantCount: number;
  selectedSection: 'all' | 'important' | NoteType;
  onSectionChange: (section: 'all' | 'important' | NoteType) => void;
}

// Icon mapping for dynamic rendering
const iconMap = {
  Lightbulb,
  FileText,
  Users,
  BarChart3,
  BookOpen,
  CheckSquare,
};

export function TypeTabs({ 
  typeStats, 
  totalNotes, 
  importantCount, 
  selectedSection, 
  onSectionChange 
}: TypeTabsProps) {
  return (
    <div className="border-b border-border bg-background">
      <div className="flex overflow-x-auto scrollbar-hide">
        {/* All Tab */}
        <button
          onClick={() => onSectionChange('all')}
          className={`flex-shrink-0 px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2 ${
            selectedSection === 'all' 
              ? 'text-purple-600 border-purple-600 bg-purple-500/10' 
              : 'text-muted-foreground hover:text-foreground border-transparent hover:border-gray-300 dark:hover:border-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Folder size={16} />
            <span>All</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              selectedSection === 'all' 
                ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300' 
                : 'bg-secondary text-secondary-foreground'
            }`}>
              {totalNotes}
            </span>
          </div>
        </button>

        {/* Important Tab - only show if there are important notes */}
        {importantCount > 0 && (
          <button
            onClick={() => onSectionChange('important')}
            className={`flex-shrink-0 px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2 ${
              selectedSection === 'important' 
                ? 'text-yellow-600 dark:text-yellow-400 border-yellow-500 bg-yellow-500/10' 
                : 'text-muted-foreground hover:text-foreground border-transparent hover:border-gray-300 dark:hover:border-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Star size={16} className="text-yellow-500" />
              <span>Important</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                selectedSection === 'important' 
                  ? 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-300' 
                  : 'bg-secondary text-secondary-foreground'
              }`}>
                {importantCount}
              </span>
            </div>
          </button>
        )}

        {/* Dynamic Type Tabs */}
        {typeStats.map((stat) => {
          const IconComponent = iconMap[stat.icon as keyof typeof iconMap];
          return (
            <button
              key={stat.type}
              onClick={() => onSectionChange(stat.type)}
              className={`flex-shrink-0 px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2 ${
                selectedSection === stat.type 
                  ? `${stat.color} bg-opacity-10` 
                  : 'text-muted-foreground hover:text-foreground border-transparent hover:border-gray-300 dark:hover:border-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                {IconComponent && <IconComponent size={16} />}
                <span>{stat.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  selectedSection === stat.type 
                    ? 'bg-black/5 dark:bg-white/10 text-current' 
                    : 'bg-secondary text-secondary-foreground'
                }`}>
                  {stat.count}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
} 