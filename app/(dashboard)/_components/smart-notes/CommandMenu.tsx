import React from 'react';
import { FileText, Hash, Star, Calendar, Image, LinkIcon, Lightbulb, MessageSquare } from 'lucide-react';

export interface Command {
  icon: any;
  label: string;
  action: string;
}

const commands: Command[] = [
  { icon: FileText, label: 'Text', action: 'Add text block' },
  { icon: Hash, label: 'Heading', action: 'Add heading' },
  { icon: Star, label: 'Important', action: 'Mark as important' },
  { icon: Calendar, label: 'Date', action: 'Add date' },
  { icon: Image, label: 'Capture', action: 'Save conversation snippet' },
  { icon: LinkIcon, label: 'Link', action: 'Add link to conversation' },
  { icon: Lightbulb, label: 'Idea', action: 'Mark as idea' },
  { icon: MessageSquare, label: 'Comment', action: 'Add comment' }
];

interface CommandMenuProps {
  onSelect: (command: Command) => void;
}

export function CommandMenu({ onSelect }: CommandMenuProps) {
  return (
    <div className="absolute bottom-full left-0 w-64 bg-white rounded-lg shadow-lg border border-gray-100 mb-2">
      <div className="p-2 space-y-1">
        {commands.map((command, index) => (
          <button
            key={index}
            onClick={() => onSelect(command)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-left"
          >
            <command.icon className="w-4 h-4 text-gray-500" />
            <span>{command.label}</span>
            <span className="text-xs text-gray-400 ml-auto">
              {command.action}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
} 