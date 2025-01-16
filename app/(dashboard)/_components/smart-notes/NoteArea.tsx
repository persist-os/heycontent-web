import React, { useState, useEffect, useRef } from 'react';
import { AtSign, Lightbulb, Hash, Star, Calendar, Image, LinkIcon, MessageSquare } from 'lucide-react';
import type { Note } from './index';
import { ShortcutManager } from './keyboard-shortcuts';
import { CommandMenu, type Command } from './CommandMenu';

// Local storage helper
const saveToLocal = (noteId: string, updates: Partial<Note>) => {
  const key = `note_${noteId}`;
  const existing = localStorage.getItem(key);
  const note = existing ? JSON.parse(existing) : {};
  localStorage.setItem(key, JSON.stringify({ ...note, ...updates }));
};

interface NoteAreaProps {
  note: Note;
  onUpdate: (noteId: string, updates: Partial<Note>, shouldSync?: boolean) => void;
  onSave?: () => void;
  onToggleShortcuts?: () => void;
}

export function NoteArea({ 
  note, 
  onUpdate, 
  onSave,
  onToggleShortcuts
}: NoteAreaProps) {
  const [content, setContent] = useState(note.content);
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);
  const [showCommands, setShowCommands] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<Set<string>>(new Set());
  
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const shortcutManager = useRef<ShortcutManager>();
  const references = Array.isArray(note.references) ? note.references : [];

  // Load from local storage on mount
  useEffect(() => {
    const key = `note_${note.id}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      const localNote = JSON.parse(saved);
      setContent(localNote.content || note.content);
    }
  }, [note.id]);

  const insertText = (text: string) => {
    if (!textAreaRef.current) return;
    
    // Get the current selection
    const start = textAreaRef.current.selectionStart;
    const end = textAreaRef.current.selectionEnd;
    
    // If there's selected text, wrap it with the formatting
    const selectedText = content.substring(start, end);
    let newText = text;
    let newCursorPosition = start + text.length;
    
    if (text === '#' || text === '@' || text === '/') {
      // For tags, mentions, and commands just insert at cursor and show menu
      newText = text;
      newCursorPosition = start + 1;
      updateMenuPosition();
      
      if (text === '/') {
        setShowCommands(true);
        setShowMentions(false);
        setShowTags(false);
      }
      if (text === '@') {
        setShowMentions(true);
        setShowCommands(false);
        setShowTags(false);
      }
      if (text === '#') {
        setShowTags(true);
        setShowCommands(false);
        setShowMentions(false);
      }
    } else if (selectedText) {
      // For formatting shortcuts with selected text
      if (text === '**') {
        newText = `**${selectedText}**`;
        newCursorPosition = end + 4;
      } else if (text === '_') {
        newText = `_${selectedText}_`;
        newCursorPosition = end + 2;
      } else if (text === '<u>') {
        newText = `<u>${selectedText}</u>`;
        newCursorPosition = end + 7;
      }
    } else {
      // For formatting without selected text
      if (text === '**') {
        newText = '**';
        newCursorPosition = start + 1;
      } else if (text === '_') {
        newText = '_';
        newCursorPosition = start + 1;
      } else if (text === '<u>') {
        newText = '<u></u>';
        newCursorPosition = start + 3;
      }
    }
    
    // Create the new content
    const newContent = content.substring(0, start) + newText + content.substring(end);
    
    // Update state and storage
    setContent(newContent);
    onUpdate(note.id, { content: newContent });
    saveToLocal(note.id, { content: newContent });
    
    // Focus and set cursor position immediately
    if (textAreaRef.current) {
      textAreaRef.current.focus();
      textAreaRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
    }
  };

  // Initialize shortcut manager once
  useEffect(() => {
    console.log('Initializing shortcut manager');
    
    const handleBold = () => {
      console.log('Bold shortcut triggered');
      if (!textAreaRef.current) return;
      const start = textAreaRef.current.selectionStart;
      const end = textAreaRef.current.selectionEnd;
      const selectedText = content.substring(start, end);
      
      if (selectedText) {
        const newContent = content.substring(0, start) + `**${selectedText}**` + content.substring(end);
        setContent(newContent);
        onUpdate(note.id, { content: newContent });
        saveToLocal(note.id, { content: newContent });
        textAreaRef.current.setSelectionRange(end + 4, end + 4);
      } else {
        insertText('**');
      }
    };

    const handleItalic = () => {
      console.log('Italic shortcut triggered');
      if (!textAreaRef.current) return;
      const start = textAreaRef.current.selectionStart;
      const end = textAreaRef.current.selectionEnd;
      const selectedText = content.substring(start, end);
      
      if (selectedText) {
        const newContent = content.substring(0, start) + `_${selectedText}_` + content.substring(end);
        setContent(newContent);
        onUpdate(note.id, { content: newContent });
        saveToLocal(note.id, { content: newContent });
        textAreaRef.current.setSelectionRange(end + 2, end + 2);
      } else {
        insertText('_');
      }
    };

    const handleUnderline = () => {
      console.log('Underline shortcut triggered');
      if (!textAreaRef.current) return;
      const start = textAreaRef.current.selectionStart;
      const end = textAreaRef.current.selectionEnd;
      const selectedText = content.substring(start, end);
      
      if (selectedText) {
        const newContent = content.substring(0, start) + `<u>${selectedText}</u>` + content.substring(end);
        setContent(newContent);
        onUpdate(note.id, { content: newContent });
        saveToLocal(note.id, { content: newContent });
        textAreaRef.current.setSelectionRange(end + 7, end + 7);
      } else {
        insertText('<u>');
      }
    };

    shortcutManager.current = new ShortcutManager({
      onSave: () => {
        console.log('Save shortcut triggered');
        onSave?.();
      },
      onQuickCapture: () => {
        console.log('Quick capture shortcut triggered');
        insertText('/capture');
        setShowCommands(true);
      },
      onCommandMenu: () => {
        console.log('Command menu shortcut triggered');
        insertText('/');
      },
      onMention: () => {
        console.log('Mention shortcut triggered');
        insertText('@');
      },
      onTag: () => {
        console.log('Tag shortcut triggered');
        insertText('#');
      },
      onBold: handleBold,
      onItalic: handleItalic,
      onUnderline: handleUnderline,
      onIndent: () => {
        console.log('Indent shortcut triggered');
        insertText('  ');
      },
      onUnindent: () => {
        console.log('Unindent shortcut triggered');
        if (!textAreaRef.current) return;
        const start = textAreaRef.current.selectionStart;
        const lineStart = content.lastIndexOf('\n', start - 1) + 1;
        const line = content.substring(lineStart, start);
        if (line.startsWith('  ')) {
          const newContent = content.substring(0, lineStart) + line.substring(2) + content.substring(start);
          setContent(newContent);
          saveToLocal(note.id, { content: newContent });
          onUpdate(note.id, { content: newContent });
          setCursorPosition(start - 2);
        }
      },
      onToggleShortcuts: () => {
        console.log('Toggle shortcuts help triggered');
        onToggleShortcuts?.();
      }
    });
  }, [note.id, content]); // Add content as dependency to ensure shortcuts work with latest content

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    onUpdate(note.id, { content: newContent });
    saveToLocal(note.id, { content: newContent });
  };

  const handleCommand = (command: Command) => {
    setShowCommands(false);
    
    if (command.type === 'metadata') {
      // Handle metadata updates (ideas, important)
      if (command.metadata?.type === 'idea' || command.metadata?.type === 'important') {
        onUpdate(note.id, { [command.metadata.type]: command.metadata.value }, true);
      }
      return;
    }
    
    // Handle block and format commands
    if (command.template) {
      if (!textAreaRef.current) return;
      const start = textAreaRef.current.selectionStart;
      const end = textAreaRef.current.selectionEnd;
      
      // Remove the trigger character
      const newContent = content.substring(0, start - 1) + command.template + content.substring(end);
      setContent(newContent);
      onUpdate(note.id, { content: newContent });
      saveToLocal(note.id, { content: newContent });
      
      // Set cursor position after inserted text
      const newPosition = start - 1 + command.template.length;
      setTimeout(() => {
        if (textAreaRef.current) {
          textAreaRef.current.focus();
          textAreaRef.current.setSelectionRange(newPosition, newPosition);
        }
      }, 0);
    }
  };

  const updateMenuPosition = () => {
    if (!textAreaRef.current) return;
    
    const textarea = textAreaRef.current;
    const cursorPosition = textarea.selectionStart;
    const text = textarea.value;
    
    // Get cursor coordinates
    const coords = getCursorCoordinates(textarea, cursorPosition);
    const textareaRect = textarea.getBoundingClientRect();
    
    // Calculate position accounting for scroll
    const scrollTop = textarea.scrollTop;
    const scrollLeft = textarea.scrollLeft;
    
    // Set menu position with offset to not cover the cursor
    setMenuPosition({
      top: textareaRect.top + coords.top - scrollTop + 24, // Add offset below cursor
      left: textareaRect.left + coords.left - scrollLeft
    });
  };

  // Get precise cursor coordinates
  const getCursorCoordinates = (textarea: HTMLTextAreaElement, position: number) => {
    const text = textarea.value.substring(0, position);
    const mirror = document.createElement('div');
    const style = window.getComputedStyle(textarea);
    
    // Copy textarea styles to mirror
    mirror.style.cssText = `
      position: absolute;
      overflow: hidden;
      white-space: pre-wrap;
      word-wrap: break-word;
      box-sizing: border-box;
      border-style: solid;
      padding: ${style.padding};
      width: ${textarea.offsetWidth}px;
      font-family: ${style.fontFamily};
      font-size: ${style.fontSize};
      font-weight: ${style.fontWeight};
      line-height: ${style.lineHeight};
      border-width: ${style.borderWidth};
      visibility: hidden;
    `;
    
    // Create a span for the text before cursor
    const textNode = document.createTextNode(text);
    const span = document.createElement('span');
    span.appendChild(textNode);
    mirror.appendChild(span);
    
    document.body.appendChild(mirror);
    const coords = {
      top: span.offsetTop,
      left: span.offsetLeft
    };
    document.body.removeChild(mirror);
    
    return coords;
  };

  // Update menu position when showing menus
  useEffect(() => {
    if (showMentions || showTags || showCommands) {
      updateMenuPosition();
    }
  }, [showMentions, showTags, showCommands]);

  // Also update position when content changes
  useEffect(() => {
    if (showMentions || showTags || showCommands) {
      updateMenuPosition();
    }
  }, [content]);

  // Add predefined options
  const tagOptions = ['content', 'idea', 'todo'];
  const mentionOptions = ['conversation', 'insight'];

  // Add rendered content display
  const renderFormattedContent = (text: string) => {
    if (!text) return null;

    return text.split('\n').map((line, lineIndex) => {
      // Check for headers first
      if (line.startsWith('# ')) {
        const content = line.slice(2).trim();
        return (
          <div key={lineIndex} className="text-5xl font-bold mb-4 text-gray-800">
            {content || <span className="text-gray-300">Type heading 1</span>}
          </div>
        );
      }
      if (line.startsWith('## ')) {
        const content = line.slice(3).trim();
        return (
          <div key={lineIndex} className="text-3xl font-bold mb-3 text-gray-800">
            {content || <span className="text-gray-300">Type heading 2</span>}
          </div>
        );
      }
      if (line.startsWith('### ')) {
        const content = line.slice(4).trim();
        return (
          <div key={lineIndex} className="text-2xl font-bold mb-2 text-gray-800">
            {content || <span className="text-gray-300">Type heading 3</span>}
          </div>
        );
      }

      // Handle other formatting within the line
      return (
        <div key={lineIndex} className="mb-1 text-gray-800">
          {line.split(/(\*\*.*?\*\*|_.*?_|<u>.*?<\/u>)/).map((part, partIndex) => {
        if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={partIndex}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('_') && part.endsWith('_')) {
              return <em key={partIndex}>{part.slice(1, -1)}</em>;
        }
        if (part.startsWith('<u>') && part.endsWith('</u>')) {
              return <u key={partIndex}>{part.slice(3, -4)}</u>;
        }
        return part;
          })}
        </div>
      );
      });
  };

  // Update the mentions UI
  const MentionsMenu = () => (
    <div className="p-2 space-y-1">
      <div className="text-sm font-medium mb-2">Reference content</div>
      {mentionOptions.map((option, index) => (
        <button
          key={index}
          onClick={() => {
            const start = textAreaRef.current?.selectionStart || 0;
            const content = textAreaRef.current?.value || '';
            const newContent = content.substring(0, start - 1) + `@${option} ` + content.substring(start);
            setContent(newContent);
            onUpdate(note.id, { content: newContent });
            saveToLocal(note.id, { content: newContent });
            setShowMentions(false);
          }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-50 text-left text-sm"
        >
          <AtSign className="w-4 h-4 text-gray-500" />
          <span>@{option}</span>
        </button>
      ))}
    </div>
  );

  // Update the tags UI
  const TagsMenu = () => (
    <div className="p-2 space-y-1">
      <div className="text-sm font-medium mb-2">Add a tag</div>
      {tagOptions.map((option, index) => (
        <button
          key={index}
          onClick={() => {
            const start = textAreaRef.current?.selectionStart || 0;
            const content = textAreaRef.current?.value || '';
            const newContent = content.substring(0, start - 1) + `#${option} ` + content.substring(start);
            setContent(newContent);
            onUpdate(note.id, { content: newContent });
            saveToLocal(note.id, { content: newContent });
            setShowTags(false);
          }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-50 text-left text-sm"
        >
          <Hash className="w-4 h-4 text-gray-500" />
          <span>#{option}</span>
        </button>
      ))}
    </div>
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const cmdKey = isMac ? e.metaKey : e.ctrlKey;
    
    // Let ShortcutManager handle its shortcuts first
    if (shortcutManager.current?.handleKeyDown(e as any)) {
      return;
    }

    // Handle command menu trigger
    if (e.key === '/' && !cmdKey) {
      const start = e.currentTarget.selectionStart;
      const text = e.currentTarget.value;
      const beforeCursor = text.substring(0, start);
      
      // Only trigger if at start of line or after whitespace
      if (start === 0 || /[\n\s]$/.test(beforeCursor)) {
        e.preventDefault();
        insertText('/');
        setShowCommands(true);
        setShowMentions(false);
        setShowTags(false);
        updateMenuPosition();
      }
    }

    // Handle special characters
    if (e.key === '@') {
      e.preventDefault();
      insertText('@');
      setShowMentions(true);
      setShowCommands(false);
      setShowTags(false);
      updateMenuPosition();
    }

    if (e.key === '#') {
      e.preventDefault();
      insertText('#');
      setShowTags(true);
      setShowCommands(false);
      setShowMentions(false);
      updateMenuPosition();
    }

    // Handle search in command menu
    if (showCommands && e.key !== 'Escape') {
      const newSearchTerm = e.currentTarget.value.substring(e.currentTarget.value.lastIndexOf('/') + 1);
      setSearchTerm(newSearchTerm);
    }

    // Handle formatting shortcuts
    if (cmdKey) {
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const selectedText = content.substring(start, end);
      
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          applyFormat(selectedText, '**', '**', start, end);
          return;
        case 'i':
          e.preventDefault();
          applyFormat(selectedText, '_', '_', start, end);
          return;
        case 'u':
          e.preventDefault();
          applyFormat(selectedText, '<u>', '</u>', start, end);
          return;
      }
    }
  };

  const applyFormat = (selectedText: string, prefix: string, suffix: string = prefix, start: number, end: number) => {
    if (!textAreaRef.current) return;
    
    let newContent = content;
    let newStart = start;
    let newEnd = end;
    
    if (selectedText) {
      // If text is selected, wrap it with format
      newContent = content.substring(0, start) + prefix + selectedText + suffix + content.substring(end);
      newEnd = start + prefix.length + selectedText.length + suffix.length;
    } else {
      // If no text is selected, insert format markers and place cursor between them
      newContent = content.substring(0, start) + prefix + suffix + content.substring(end);
      newStart = start + prefix.length;
      newEnd = newStart;
    }
    
    setContent(newContent);
    onUpdate(note.id, { content: newContent });
    saveToLocal(note.id, { content: newContent });
    
    // Restore selection
    textAreaRef.current.focus();
    textAreaRef.current.setSelectionRange(newStart, newEnd);
  };

  const handleCommandSelect = (command: Command) => {
    if (!textAreaRef.current) return;
    
    const start = textAreaRef.current.selectionStart;
    const end = textAreaRef.current.selectionEnd;
    const text = textAreaRef.current.value;
    
    // Find the start of the command (where the / is)
    const commandStart = text.substring(0, start).lastIndexOf('/');
    if (commandStart === -1) return;

    // Handle headers
    if (command.label.startsWith('Heading')) {
      // Remove the command text (including the /)
      let newContent = text.substring(0, commandStart);
      
      // Add a newline if we're not at the start of a line
      if (commandStart > 0 && text[commandStart - 1] !== '\n') {
        newContent += '\n';
      }
      
      // Add the header markup only (without placeholder text)
      const headerLevel = command.label === 'Heading 1' ? '# ' : command.label === 'Heading 2' ? '## ' : '### ';
      newContent += headerLevel;
      
      // Add the rest of the text
      newContent += text.substring(end);
      
      // Update content
      setContent(newContent);
      onUpdate(note.id, { content: newContent });
      saveToLocal(note.id, { content: newContent });
      
      // Position cursor after the header markup
      const newPosition = commandStart + 
        (commandStart > 0 && text[commandStart - 1] !== '\n' ? 1 : 0) + 
        headerLevel.length;
      
      setTimeout(() => {
        if (textAreaRef.current) {
          textAreaRef.current.focus();
          textAreaRef.current.setSelectionRange(newPosition, newPosition);
        }
      }, 0);
      
      setShowCommands(false);
      return;
    }

    // Handle other commands (keeping existing code)
    if (command.type === 'metadata') {
      // Handle metadata updates (Important, Ideas)
      if (command.metadata?.type === 'important') {
        onUpdate(note.id, { important: !note.important }, true); // Force sync
      } else if (command.metadata?.type === 'idea') {
        onUpdate(note.id, { type: 'idea' }, true); // Force sync
      }
      
      // Remove the command text
      const newContent = text.substring(0, commandStart) + text.substring(end);
      setContent(newContent);
      onUpdate(note.id, { content: newContent });
      saveToLocal(note.id, { content: newContent });
      
      // Position cursor at command start
      setTimeout(() => {
        if (textAreaRef.current) {
          textAreaRef.current.focus();
          textAreaRef.current.setSelectionRange(commandStart, commandStart);
        }
      }, 0);
      
      setShowCommands(false);
      return;
    } else if (command.template) {
      // ... existing template handling code ...
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="border-b border-gray-100 px-6 py-4">
        <input 
          type="text"
          value={note.title}
          onChange={(e) => {
            const newTitle = e.target.value;
            saveToLocal(note.id, { title: newTitle });
            onUpdate(note.id, { title: newTitle });
          }}
          className="text-2xl font-semibold bg-transparent border-none focus:outline-none w-full"
          placeholder="Untitled Note"
        />
      </div>

      <div className="flex-1 p-6 overflow-y-auto relative">
        <div className="max-w-4xl mx-auto space-y-4">
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

          <div className="relative min-h-[calc(100vh-200px)]">
            <textarea
              ref={textAreaRef}
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type / for commands, @ to reference content, # to add tags"
              className="w-full p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-base leading-relaxed absolute inset-0 text-transparent"
              style={{ 
                minHeight: 'calc(100vh - 200px)',
                height: 'auto',
                caretColor: '#4B5563', // Gray-600 for better cursor visibility
                background: 'transparent'
              }}
            />

            {/* Rendered content */}
            <div className="w-full p-4 rounded-lg text-base leading-relaxed pointer-events-none">
              {renderFormattedContent(content)}
            </div>

            {/* Command menus */}
            {showCommands && (
                <CommandMenu
                onSelect={handleCommandSelect}
                  onClose={() => setShowCommands(false)}
                searchTerm={searchTerm}
                position={menuPosition}
                />
            )}

            {showMentions && (
              <div 
                className="absolute bg-white rounded-lg shadow-lg border border-gray-200 z-50 w-64"
                style={{ 
                  top: menuPosition.top,
                  left: menuPosition.left
                }}
              >
                <MentionsMenu />
              </div>
            )}

            {showTags && (
              <div 
                className="absolute bg-white rounded-lg shadow-lg border border-gray-200 z-50 w-64"
                style={{ 
                  top: menuPosition.top,
                  left: menuPosition.left
                }}
              >
                <TagsMenu />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 