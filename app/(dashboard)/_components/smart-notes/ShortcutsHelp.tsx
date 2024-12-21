import React, { useEffect, useRef } from 'react';

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
      className="bg-white/80 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-gray-100"
    >
      <h3 className="font-medium mb-4">Keyboard Shortcuts</h3>
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {SHORTCUTS.map((shortcut, index) => (
          <div key={index} className="flex items-center justify-between hover:bg-gray-50 p-2 rounded-lg">
            <div className="flex items-center gap-3">
              <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                {shortcut.key}
              </code>
              <span className="text-gray-600">{shortcut.description}</span>
            </div>
            {shortcut.example && (
              <span className="text-sm text-gray-400 font-mono">{shortcut.example}</span>
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          Press ⌘ + / to toggle this help menu at any time
        </p>
      </div>
    </div>
  );
} 