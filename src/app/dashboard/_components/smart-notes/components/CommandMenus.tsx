import React, { useRef, useEffect } from 'react';
import { AtSign, Hash } from 'lucide-react';
import { CommandMenu, type Command } from '../CommandMenu';
import type { Note } from '../types';
import { PlatformKey } from '../types/platformPrompts';
import styles from './CommandMenus.module.css';

interface CommandMenusProps {
  showCommands: boolean;
  showMentions: boolean;
  showTags: boolean;
  menuPosition: { top: number; left: number };
  searchTerm: string;
  onCommandSelect: (command: Command) => void;
  onCloseCommands: () => void;
  textAreaRef: React.RefObject<HTMLTextAreaElement>;
  onUpdate: (noteId: string, updates: any) => void;
  noteId: string;
  platform: PlatformKey;
}

export function CommandMenus({
  showCommands,
  showMentions,
  showTags,
  menuPosition,
  searchTerm,
  onCommandSelect,
  onCloseCommands,
  textAreaRef,
  onUpdate,
  noteId,
  platform
}: CommandMenusProps) {
  const mentionOptions = [
    { id: 'conversation', label: 'Conversation', description: 'Reference a chat or discussion' },
    { id: 'ai_insight', label: 'AI Insight', description: 'Reference an AI-generated insight' },
    { id: 'idea', label: 'Idea', description: 'Reference an idea or concept' },
    { id: 'url', label: 'URL', description: 'Reference a web link or resource' },
    { id: 'date', label: 'Date', description: 'Reference a specific date or event' },
    { id: 'screen', label: 'Screen', description: 'Reference a specific screen/page' },
    { id: 'component', label: 'Component', description: 'Reference a UI component' },
    { id: 'section', label: 'Section', description: 'Reference a specific section of the app' },
    { id: 'feature', label: 'Feature', description: 'Reference a specific feature' },
    { id: 'workflow', label: 'Workflow', description: 'Reference a specific workflow' }
  ];

  const tagOptions = [
    'content',    // Content-related notes
    'idea',       // Ideas and concepts
    'todo',       // Tasks and to-dos
    'important',  // Important notes
    'research',   // Research and findings
    'question',   // Questions to explore
    'insight',    // Key insights
    'strategy',   // Strategic thinking
    'review',     // Items to review
    'followup',   // Follow-up items
    'reference',  // Reference material
    'draft'       // Draft content
  ];

  const MentionsMenu = () => (
    <div className="p-2 space-y-2">
      <div className="text-sm font-medium mb-2">Reference content</div>
      {mentionOptions.map((option) => (
        <button
          key={option.id}
          onClick={async () => {
            const start = textAreaRef.current?.selectionStart || 0;
            const textContent = textAreaRef.current?.value || '';
            const mentionText = `@${option.id}`;
            const newContent = textContent.substring(0, start - 1) + mentionText + ' ' + textContent.substring(start);
            const newReference = {
              type: option.id as Note['references'][0]['type'],
              content: option.label,
              isLoading: false
            };
            try {
              const currentNote = textAreaRef.current?.closest('.note-container')?.getAttribute('data-note');
              const currentReferences = currentNote ? JSON.parse(currentNote).references || [] : [];
              const updatedReferences = [...currentReferences, newReference];
              await onUpdate(noteId, {
                updates: {
                  content: newContent,
                  references: updatedReferences,
                  updatedAt: Date.now()
                }
              });
              onCloseCommands();
            } catch (error) {
              // Optionally handle error
            }
          }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-50 text-left text-sm group"
          title={option.description}
        >
          <AtSign className="w-4 h-4 text-gray-500 group-hover:text-purple-500" />
          <div className="flex flex-col">
            <span className="font-medium group-hover:text-purple-500">@{option.label}</span>
            <span className="text-xs text-gray-500">{option.description}</span>
          </div>
        </button>
      ))}
    </div>
  );

  const TagsMenu = () => (
    <div className="p-2 space-y-2">
      <div className="text-sm font-medium mb-2">Add a tag</div>
      {tagOptions.map((option, index) => (
        <button
          key={index}
          onClick={() => {
            const start = textAreaRef.current?.selectionStart || 0;
            const textContent = textAreaRef.current?.value || '';
            const newContent = textContent.substring(0, start - 1) + `#${option} ` + textContent.substring(start);
            onUpdate(noteId, { content: newContent });
          }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-50 text-left text-sm group"
          title={getTagDescription(option)}
        >
          <Hash className="w-4 h-4 text-gray-500 group-hover:text-purple-500" />
          <div className="flex flex-col">
            <span className="font-medium group-hover:text-purple-500">#{option}</span>
            <span className="text-xs text-gray-500">{getTagDescription(option)}</span>
          </div>
        </button>
      ))}
    </div>
  );

  const getTagDescription = (tag: string): string => {
    const descriptions: { [key: string]: string } = {
      content: 'Content-related notes and drafts',
      idea: 'Ideas and concepts to explore',
      todo: 'Tasks and action items',
      important: 'Important notes that need attention',
      research: 'Research findings and data',
      question: 'Questions to explore or answer',
      insight: 'Key insights and learnings',
      strategy: 'Strategic thinking and planning',
      review: 'Items that need review',
      followup: 'Items that need follow-up',
      reference: 'Reference material and resources',
      draft: 'Draft content that needs work'
    };
    return descriptions[tag] || '';
  };

  // Refs for dynamic positioning
  const mentionsRef = useRef<HTMLDivElement>(null);
  const tagsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mentionsRef.current) {
      mentionsRef.current.style.setProperty('--command-menu-top', `${menuPosition.top}px`);
      mentionsRef.current.style.setProperty('--command-menu-left', `${menuPosition.left}px`);
    }
    if (tagsRef.current) {
      tagsRef.current.style.setProperty('--command-menu-top', `${menuPosition.top}px`);
      tagsRef.current.style.setProperty('--command-menu-left', `${menuPosition.left}px`);
    }
  }, [menuPosition]);

  // Debug log when component renders
  useEffect(() => {
    if (showCommands) {
      console.log('CommandMenus - showCommands is TRUE', { platform, menuPosition });
    }
  }, [showCommands, platform, menuPosition]);

  return (
    <>
      {showCommands && (
        <div
          className={`${styles['command-menu-position']} fixed z-50 w-80 max-h-[400px] overflow-y-auto bg-white rounded-lg shadow-xl border border-gray-200`}
          style={{
            top: menuPosition.top,
            left: menuPosition.left,
          }}
        >
          <div className="p-2 bg-purple-50 border-b border-gray-200">
            <div className="text-sm font-medium text-purple-800">
              {platform.charAt(0).toUpperCase() + platform.slice(1)} prompts
            </div>
          </div>
          <CommandMenu 
            onSelect={onCommandSelect} 
            onClose={onCloseCommands} 
            searchTerm={searchTerm} 
            position={menuPosition}
            platform={platform}
          />
        </div>
      )}

      {showMentions && (
        <div
          ref={mentionsRef}
          className={`fixed bg-white rounded-lg shadow-lg border border-gray-200 z-50 w-64 ${styles['command-menu-position']}`}
        >
          <MentionsMenu />
        </div>
      )}

      {showTags && (
        <div
          ref={tagsRef}
          className={`fixed bg-white rounded-lg shadow-lg border border-gray-200 z-50 w-64 ${styles['command-menu-position']}`}
        >
          <TagsMenu />
        </div>
      )}
    </>
  );
} 