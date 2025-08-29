import React from 'react';
import { Lightbulb, FileText, Users, BarChart3, BookOpen, CheckSquare, Link } from 'lucide-react';

export const NOTE_TYPES = [
  { value: 'idea_bank', label: 'Ideas', description: 'Capture thoughts, concepts, and inspiration as they come to you' },
  { value: 'content_script', label: 'Writing', description: 'Draft and organize written content, messages, and documents' },
  { value: 'analytics_insight', label: 'Insights', description: 'Record important learnings, observations, and discoveries' },
  { value: 'collaboration_note', label: 'People', description: 'Track relationships, conversations, and collaboration details' },
  { value: 'reflection_journal', label: 'Reflection', description: 'Work through complex thoughts and personal analysis' },
  { value: 'task_checklist', label: 'Tasks', description: 'Organize what needs to be done and track progress' },
  { value: 'email_draft', label: 'Messages', description: 'Prepare emails, responses, and important communications' },
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