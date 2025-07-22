import React from 'react';
import { Lightbulb, FileText, Users, BarChart3, BookOpen, CheckSquare, Link } from 'lucide-react';

export const NOTE_TYPES = [
  { value: 'idea_bank', label: 'Idea Bank', description: 'Spark fresh concepts and brainstorm your next viral idea' },
  { value: 'content_script', label: 'Content Script', description: 'Structure your content like a pro creator' },
  { value: 'analytics_insight', label: 'Analytics Insight', description: 'Turn your data into growth strategies' },
  { value: 'collaboration_note', label: 'Collaboration Note', description: 'Organize your brand partnerships and team projects' },
  { value: 'reflection_journal', label: 'Reflection Journal', description: 'Document your creative journey and insights' },
  { value: 'task_checklist', label: 'Task Checklist', description: 'Stay organized and hit every deadline' },
  { value: 'email_draft', label: 'Email Draft', description: 'Write emails that get opened and get results' },
];

// Helper function to create icon components
const createIcon = (IconComponent: React.ComponentType<{ className?: string }>) => 
  React.createElement(IconComponent, { className: "w-4 h-4" });

export const NOTE_TYPE_ICONS: Record<string, React.ReactNode> = {
  idea_bank: createIcon(Lightbulb),
  content_script: createIcon(FileText),
  analytics_insight: createIcon(BarChart3),
  collaboration_note: createIcon(Users),
  reflection_journal: createIcon(BookOpen),
  task_checklist: createIcon(CheckSquare),
  email_draft: createIcon(FileText),
};

export const PALETTE_CONFIG = {
  width: 600,
  maxHeight: 400,
  margin: 20,
  maxOptionsHeight: 320, // 80 * 4 (4 options visible)
} as const;

export const KEYBOARD_SHORTCUTS = {
  navigation: '↑↓ to navigate',
  select: '↵ to select',
  close: 'esc to close',
  accept: '↵ to accept',
  retry: 'r to retry',
  nextField: 'Tab to next field',
} as const; 