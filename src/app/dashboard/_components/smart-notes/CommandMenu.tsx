import React, { useEffect, useRef, useState } from 'react';
import { Hash, Star, Calendar, Image, LinkIcon, Lightbulb, MessageSquare, Type, ListOrdered, List } from 'lucide-react';
import { platformPrompts, PlatformKey } from './types/platformPrompts';

export interface Command {
  icon: any;
  label: string;
  action: string;
  shortcut?: string;
  preview?: string;
  template?: string;
  type?: 'format' | 'block' | 'metadata';
  metadata?: {
    type?: 'idea' | 'important';
    value?: boolean;
  };
}

const commands: Command[] = [
  { 
    icon: Type, 
    label: 'Text', 
    action: 'Add text block',
    preview: 'Just start writing with plain text.',
    template: '\n',
    type: 'block'
  },
  { 
    icon: Hash, 
    label: 'Heading 1', 
    action: 'Add large heading',
    shortcut: '# ',
    preview: 'Big section heading',
    template: '# Heading 1',
    type: 'block'
  },
  { 
    icon: Hash, 
    label: 'Heading 2', 
    action: 'Add medium heading',
    shortcut: '## ',
    preview: 'Medium section heading',
    template: '## Heading 2',
    type: 'block'
  },
  { 
    icon: Hash, 
    label: 'Heading 3', 
    action: 'Add small heading',
    shortcut: '### ',
    preview: 'Small section heading',
    template: '### Heading 3',
    type: 'block'
  },
  { 
    icon: List, 
    label: 'Bullet List', 
    action: 'Add bullet points',
    shortcut: '- ',
    preview: 'Create a bulleted list',
    template: '- ',
    type: 'block'
  },
  { 
    icon: ListOrdered, 
    label: 'Numbered List', 
    action: 'Add numbered list',
    shortcut: '1. ',
    preview: 'Create a numbered list',
    template: '1. ',
    type: 'block'
  },
  { 
    icon: Star, 
    label: 'Important', 
    action: 'Mark note as important',
    preview: 'Add this note to Important section',
    type: 'metadata',
    metadata: {
      type: 'important',
      value: true
    }
  },
  { 
    icon: Calendar, 
    label: 'Date', 
    action: 'Add current date',
    preview: 'Insert current date',
    template: new Date().toLocaleDateString(),
    type: 'block'
  },
  { 
    icon: Image, 
    label: 'Capture', 
    action: 'Save conversation snippet',
    preview: 'Save a part of your conversation',
    type: 'block',
    template: '[Capture]'
  },
  { 
    icon: LinkIcon, 
    label: 'Link', 
    action: 'Add link',
    preview: 'Create a link to another note or URL',
    type: 'format',
    template: '[](url)'
  },
  { 
    icon: Lightbulb, 
    label: 'Idea', 
    action: 'Mark as idea',
    preview: 'Add this note to Ideas section',
    type: 'metadata',
    metadata: {
      type: 'idea',
      value: true
    }
  },
  { 
    icon: MessageSquare, 
    label: 'Comment', 
    action: 'Add comment',
    preview: 'Add a comment or note',
    template: '> ',
    type: 'block'
  }
];

interface CommandMenuProps {
  onSelect: (command: Command) => void;
  onClose?: () => void;
  searchTerm?: string;
  position?: { top: number; left: number };
}

export function CommandMenu({ onSelect, onClose, searchTerm = '', position, platform }: CommandMenuProps & { platform: PlatformKey }) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filteredCommands, setFilteredCommands] = useState<any[]>([]);

  // Build commands from platformPrompts
  useEffect(() => {
    console.log('[CommandMenu] Received platform:', platform);
    const postTypePrompts = platformPrompts[platform] || [];
    console.log('[CommandMenu] Loaded postTypePrompts:', postTypePrompts);
    const platformCommands = postTypePrompts.map(prompt => ({
      icon: Lightbulb, // You can customize icons per type if desired
      label: prompt.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      action: prompt.key,
      preview: prompt.description,
      type: 'block',
      template: '', // You can add templates if you want to insert something
    }));
    const filtered = platformCommands.filter(cmd =>
      cmd.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cmd.action.toLowerCase().includes(searchTerm.toLowerCase())
    );
    console.log('[CommandMenu] Filtered commands:', filtered);
    setFilteredCommands(filtered);
    setSelectedIndex(0);
  }, [searchTerm, platform]);

  // Handle keyboard navigation and scroll into view
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(i => {
            const newIndex = (i + 1) % filteredCommands.length;
            scrollSelectedIntoView(newIndex);
            return newIndex;
          });
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(i => {
            const newIndex = (i - 1 + filteredCommands.length) % filteredCommands.length;
            scrollSelectedIntoView(newIndex);
            return newIndex;
          });
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            handleSelect(filteredCommands[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose?.();
          break;
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [filteredCommands, selectedIndex]);

  // Scroll selected item into view
  const scrollSelectedIntoView = (index: number) => {
    if (!menuRef.current) return;
    
    const menuElement = menuRef.current;
    const selectedElement = menuElement.children[0]?.children[index] as HTMLElement;
    if (!selectedElement) return;

    const menuRect = menuElement.getBoundingClientRect();
    const selectedRect = selectedElement.getBoundingClientRect();

    if (selectedRect.bottom > menuRect.bottom) {
      // Scroll down if selected item is below viewport
      selectedElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
    } else if (selectedRect.top < menuRect.top) {
      // Scroll up if selected item is above viewport
      selectedElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Handle click outside
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

  // Calculate menu position to ensure it stays within viewport
  const calculateMenuPosition = () => {
    if (!position) return {};
    
    const viewportHeight = window.innerHeight;
    const menuHeight = 400; // max-h-[400px]
    
    let top = position.top;
    // If menu would go below viewport, position it above the cursor
    if (top + menuHeight > viewportHeight) {
      top = Math.max(10, top - menuHeight);
    }

    return {
      top: `${top}px`,
      left: `${position.left}px`
    };
  };

  console.log('[CommandMenu] Rendering with filteredCommands:', filteredCommands);
  return (
    <div 
      ref={menuRef}
      className="fixed z-50 w-80 bg-white rounded-lg shadow-lg border border-gray-200 max-h-[400px] overflow-y-auto"
      style={calculateMenuPosition()}
    >
      <div className="p-2 space-y-1">
        {filteredCommands.map((command, index) => (
          <button
            key={index}
            onClick={() => handleSelect(command)}
            onMouseEnter={() => setSelectedIndex(index)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left text-sm group transition-colors ${
              index === selectedIndex ? 'bg-purple-50' : 'hover:bg-gray-50'
            }`}
          >
            <command.icon className={`w-4 h-4 ${
              index === selectedIndex ? 'text-purple-500' : 'text-gray-500 group-hover:text-gray-700'
            }`} />
            <div className="flex-1">
              <div className="font-medium flex items-center justify-between">
                {command.label}
                {command.shortcut && (
                  <span className="text-xs text-gray-400 font-mono">{command.shortcut}</span>
                )}
              </div>
              <div className="text-xs text-gray-400 group-hover:text-gray-500">
                {command.preview || command.action}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}