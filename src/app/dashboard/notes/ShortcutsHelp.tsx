import React, { useEffect, useRef } from 'react';
import { T } from '@/components/translation/T';

interface ShortcutHelpItem {
  key: string;
  description: string;
  example?: string;
}

interface ShortcutsHelpProps {
  onClose: () => void;
}

const SHORTCUTS: ShortcutHelpItem[] = [
  { key: '⌘ + S', description: 'Save current note' },
  { key: '⌘ + K', description: 'Quick capture AI conversation' },
  { key: '/', description: 'Open command menu', example: '/heading, /capture, /idea' },
  { key: '@', description: 'Reference content', example: '@conversation, @insight' },
  { key: '#', description: 'Add tag', example: '#content, #idea, #todo' },
  { key: 'Esc', description: 'Cancel current command or close menu' },
  { key: '⌘ + /', description: 'Show/hide shortcuts help' },
  { key: '⌘ + B', description: 'Bold text' },
  { key: '⌘ + I', description: 'Italic text' },
  { key: '⌘ + U', description: 'Underline text' },
  { key: 'Tab', description: 'Indent text' },
  { key: 'Shift + Tab', description: 'Unindent text' }
];

export function ShortcutsHelp({ onClose }: ShortcutsHelpProps) {
  const helpRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (helpRef.current && !helpRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div 
      ref={helpRef}
      className="fixed bottom-16 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-gray-200 w-80 max-h-[60vh] overflow-y-auto"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-700">
          <T context="shortcuts.title">Keyboard Shortcuts</T>
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>
      <div className="space-y-1.5">
        {SHORTCUTS.map((shortcut, index) => (
          <div key={index} className="flex items-center justify-between hover:bg-gray-50 p-1.5 rounded">
            <div className="flex items-center gap-2">
              <code className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">
                {shortcut.key}
              </code>
              <span className="text-xs text-gray-600">
                <T context={`shortcuts.${shortcut.key.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`}>
                  {shortcut.description}
                </T>
              </span>
            </div>
            {shortcut.example && (
              <span className="text-xs text-gray-400 font-mono">{shortcut.example}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 