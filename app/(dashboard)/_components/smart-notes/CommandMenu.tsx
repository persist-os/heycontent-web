import React, { useEffect, useRef } from 'react';
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
  onClose?: () => void;
}

export function CommandMenu({ onSelect, onClose }: CommandMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose?.();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleSelect = (command: Command) => {
    onSelect(command);
    onClose?.();
  };

  return (
    <div 
      ref={menuRef}
      className="absolute bottom-full left-0 w-48 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border border-gray-100 mb-2 max-h-[280px] overflow-y-auto"
    >
      <div className="p-1 space-y-0.5">
        {commands.map((command, index) => (
          <button
            key={index}
            onClick={() => handleSelect(command)}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-50 text-left text-sm group transition-colors"
          >
            <command.icon className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-700" />
            <span className="font-medium">{command.label}</span>
            <span className="text-[10px] text-gray-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
              {command.action}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
} 