import React, { useState, useEffect } from 'react';
import { AtSign, Lightbulb } from 'lucide-react';
import type { Note } from './index';
import { ShortcutManager } from './keyboard-shortcuts';

interface NoteAreaProps {
  note: Note;
  onUpdate: (noteId: string, updates: Partial<Note>) => void;
  showCommands: boolean;
  setShowCommands: (show: boolean) => void;
}

export function NoteArea({ note, onUpdate, showCommands, setShowCommands }: NoteAreaProps) {
  const [content, setContent] = useState(note.content);
  const references = Array.isArray(note.references) ? note.references : [];

  useEffect(() => {
    const shortcutManager = new ShortcutManager();

    // Register shortcuts
    shortcutManager.registerShortcut({
      key: 's',
      command: 'Save',
      description: 'Save current note',
      callback: () => {
        console.log('Saving note...');
        onUpdate(note.id, { content })
      }
    });

    shortcutManager.registerShortcut({
      key: 'k',
      command: 'Quick Capture',
      description: 'Capture current AI conversation',
      callback: () => {
        console.log('Quick capturing...');
        onUpdate(note.id, {
          references: [
            ...references,
            {
              type: 'conversation',
              content: 'Captured conversation'
            }
          ]
        });
      }
    });

    shortcutManager.registerShortcut({
      key: 'f',
      command: 'Search',
      description: 'Search notes',
      callback: () => {
        // Implement search functionality
      }
    });

    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      // Handle slash command
      if (e.key === '/' && !e.metaKey && !e.ctrlKey) {
        console.log('Opening command menu...');
        e.preventDefault();
        setShowCommands(true);
        return;
      }

      // Handle @ mentions
      if (e.key === '@' && !e.metaKey && !e.ctrlKey) {
        console.log('Opening mentions...');
        e.preventDefault();
        // Implement @ mentions
        return;
      }

      // Handle # tags
      if (e.key === '#' && !e.metaKey && !e.ctrlKey) {
        console.log('Opening tags...');
        e.preventDefault();
        // Implement # tags
        return;
      }

      shortcutManager.handleKeyDown(e);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [note.id, content, onUpdate, references, setShowCommands]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    
    // Check for command triggers
    if (newContent.endsWith('/')) {
      setShowCommands(true);
    } else if (showCommands && !newContent.endsWith('/')) {
      setShowCommands(false);
    }

    onUpdate(note.id, { content: newContent });
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b border-gray-100 p-4">
        <input 
          type="text"
          value={note.title}
          onChange={(e) => onUpdate(note.id, { title: e.target.value })}
          className="text-xl font-semibold bg-transparent border-none focus:outline-none w-full"
          placeholder="Untitled Note"
        />
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="max-w-2xl mx-auto space-y-4">
          {references.map((ref, index) => (
            <div 
              key={index}
              className={`p-3 ${
                ref.type === 'ai_insight' ? 'bg-blue-50' : 'border-l-4 border-purple-500 pl-3'
              } rounded-lg`}
            >
              <div className="flex items-center gap-2 text-blue-600 text-sm font-medium mb-2">
                {ref.type === 'ai_insight' ? (
                  <AtSign className="w-4 h-4" />
                ) : (
                  <Lightbulb className="w-4 h-4" />
                )}
                {ref.type === 'ai_insight' ? 'AI Insight Reference' : 'New Idea'}
              </div>
              <p className="text-gray-600">{ref.content}</p>
            </div>
          ))}

          <div className="relative">
            <textarea
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Type / for commands, @ to reference"
              className="w-full p-3 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
} 