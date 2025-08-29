import React from 'react';
import { Lightbulb, FileText, Users, BarChart3, BookOpen, CheckSquare, Link } from 'lucide-react';

export const NOTE_TYPES = [
  { value: 'idea_bank', label: 'Things On My Mind', description: 'For whatever\'s floating around in your head - capture it before it disappears' },
  { value: 'content_script', label: 'Things I\'m Writing Out', description: 'When you need to get your thoughts organized and flowing clearly' },
  { value: 'analytics_insight', label: 'What I Don\'t Want to Forget', description: 'Hold onto something you learned or figured out so you can come back to it' },
  { value: 'collaboration_note', label: 'Things About People I Care About', description: 'Keep track of the relationships and connections that matter to you' },
  { value: 'reflection_journal', label: 'Trying to Figure Something Out', description: 'When you need space to work through something complicated step by step' },
  { value: 'task_checklist', label: 'Things I Need to Handle', description: 'Sort out what needs to get done so you don\'t forget anything important' },
  { value: 'email_draft', label: 'Things I\'m Writing Out', description: 'When you need to get your thoughts organized and flowing clearly' },
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