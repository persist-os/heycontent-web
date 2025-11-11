import React from 'react';
import { 
  Mail, 
  MessageSquare, 
  Edit3, 
  Zap,
  Eye,
  Scissors,
  Activity,
  Briefcase,
  MessageCircle,
  CheckCircle
} from 'lucide-react';

export interface EmailCommand {
  id: string;
  label: string;
  icon: React.ReactNode;
  category: string;
}

// Helper function to create icon components
const createIcon = (IconComponent: React.ComponentType<{ className?: string }>) => 
  React.createElement(IconComponent, { className: "w-4 h-4" });

// Email Compose Commands
export const EMAIL_COMPOSE_COMMANDS: EmailCommand[] = [
  {
    id: 'draft-email',
    label: 'Draft a professional email',
    icon: createIcon(Mail),
    category: 'Compose'
  },
  {
    id: 'outreach-email',
    label: 'Write an outreach email',
    icon: createIcon(MessageSquare),
    category: 'Compose'
  },
  {
    id: 'follow-up',
    label: 'Create a follow-up email',
    icon: createIcon(Edit3),
    category: 'Compose'
  },
  {
    id: 'introduction',
    label: 'Write an introduction email',
    icon: createIcon(Zap),
    category: 'Compose'
  }
];

// Email Reply Commands
export const EMAIL_REPLY_COMMANDS: EmailCommand[] = [
  {
    id: 'professional-reply',
    label: 'Write a professional reply',
    icon: createIcon(Mail),
    category: 'Reply'
  },
  {
    id: 'concise-reply',
    label: 'Write a concise reply',
    icon: createIcon(MessageSquare),
    category: 'Reply'
  },
  {
    id: 'friendly-reply',
    label: 'Write a friendly reply',
    icon: createIcon(Edit3),
    category: 'Reply'
  }
];

// Email Refinement Commands
export const EMAIL_REFINEMENT_COMMANDS: EmailCommand[] = [
  {
    id: 'make-clearer',
    label: 'Make this clearer',
    icon: createIcon(Eye),
    category: 'Refine'
  },
  {
    id: 'make-concise',
    label: 'Make this more concise',
    icon: createIcon(Scissors),
    category: 'Refine'
  },
  {
    id: 'improve-tone',
    label: 'Improve the tone',
    icon: createIcon(Activity),
    category: 'Refine'
  },
  {
    id: 'make-professional',
    label: 'Make this more professional',
    icon: createIcon(Briefcase),
    category: 'Refine'
  },
  {
    id: 'make-casual',
    label: 'Make this more casual',
    icon: createIcon(MessageCircle),
    category: 'Refine'
  },
  {
    id: 'fix-grammar',
    label: 'Fix the grammar',
    icon: createIcon(CheckCircle),
    category: 'Refine'
  }
];

// Helper functions to get commands by context
export function getEmailCommandsForContext(context: 'compose' | 'reply'): EmailCommand[] {
  return context === 'compose' ? EMAIL_COMPOSE_COMMANDS : EMAIL_REPLY_COMMANDS;
}

export function getEmailRefinementCommands(): EmailCommand[] {
  return EMAIL_REFINEMENT_COMMANDS;
}

