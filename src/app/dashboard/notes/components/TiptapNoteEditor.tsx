"use client";
import React, { useRef, useEffect, forwardRef, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { InlineCommandPalette } from './InlineCommandPalette';
import { useInlineAI } from '../hooks/useInlineAI';
import { Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { NoteLinkComponent } from './NoteLinkComponent';

interface TiptapNoteEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  placeholder?: string;
  disabled?: boolean;
  noteId?: string;
  noteTitle?: string;
  platform?: string;
  tags?: string[];
  userId: string;
  noteType?: string;
  availableNotes?: Array<{ _id: string; title: string; type: string }>;
  onLinkNote?: (noteId: string) => void;
}

// Tiptap extension for note links
const NoteLinkExtension = Node.create({
  name: 'noteLink',
  
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      noteId: {
        default: null,
        parseHTML: element => element.getAttribute('data-note-id'),
        renderHTML: attributes => {
          if (!attributes.noteId) {
            return {};
          }
          return {
            'data-note-id': attributes.noteId,
            'data-type': 'noteLink',
          };
        },
      },
      title: {
        default: null,
        parseHTML: element => element.getAttribute('data-title'),
        renderHTML: attributes => {
          if (!attributes.title) {
            return {};
          }
          return {
            'data-title': attributes.title,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="noteLink"]',
        getAttrs: element => {
          const noteId = element.getAttribute('data-note-id');
          const title = element.getAttribute('data-title');
          return noteId ? { noteId, title } : false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', HTMLAttributes];
  },

  addNodeView() {
    return ReactNodeViewRenderer(NoteLinkComponent);
  },
});

export const TiptapNoteEditor = forwardRef<HTMLDivElement, TiptapNoteEditorProps>((
  {
    content,
    onContentChange,
    placeholder = "Type your note here...",
    disabled = false,
    noteId,
    noteTitle,
    platform,
    tags,
    userId,
    noteType,
    availableNotes = [],
    onLinkNote
  }, 
  ref
) => {
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [palettePosition, setPalettePosition] = useState({ top: 0, left: 0 });
  const [paletteMode, setPaletteMode] = useState<'commands' | 'notes'>('commands');

  // Initialize the inline AI hook
  const { askAI, requestAnalysis, requestIdeas } = useInlineAI({
    noteId,
    noteContent: content,
    noteTitle,
    platform,
    tags,
    userId,
  });

  // Convert @[id]@ format to proper note links and vice versa
  const parseContentForEditor = useCallback((text: string) => {
    if (!text) return '';
    
    console.log('parseContentForEditor input:', text);
    console.log('Available notes:', availableNotes);
    
    // First, convert @[id]@ format to HTML with note link nodes
    let parsedContent = text;
    const linkRegex = /@\[([^\]]+)\]@/g;
    let match;
    const matches = [];
    
    // Collect all matches first to avoid regex state issues
    while ((match = linkRegex.exec(text)) !== null) {
      matches.push({
        fullMatch: match[0],
        noteId: match[1].trim(),
        index: match.index
      });
    }
    
    console.log('Found link matches:', matches);
    
    // Process matches in reverse order to maintain string positions
    for (let i = matches.length - 1; i >= 0; i--) {
      const { fullMatch, noteId } = matches[i];
      const linkedNote = availableNotes.find(note => note._id === noteId);
      
      console.log('Processing link:', { noteId, linkedNote });
      
      if (linkedNote) {
        // Create a proper HTML structure that Tiptap can parse
        const linkHtml = `<span data-type="noteLink" data-note-id="${linkedNote._id}" data-title="${linkedNote.title}"></span>`;
        parsedContent = parsedContent.replace(fullMatch, linkHtml);
        console.log('Replaced with HTML:', linkHtml);
      }
    }
    
    // Convert line breaks to HTML paragraphs for Tiptap
    // Split by double newlines (paragraph breaks) but preserve empty lines
    const paragraphs = parsedContent.split(/\n\n/);
    const htmlParagraphs = paragraphs.map(paragraph => {
      const trimmed = paragraph.trim();
      if (trimmed) {
        // Convert single line breaks within paragraphs to <br> tags
        const withBreaks = trimmed.replace(/\n/g, '<br>');
        return `<p>${withBreaks}</p>`;
      } else {
        // Empty paragraph for blank lines
        return '<p></p>';
      }
    });
    
    const finalHtml = htmlParagraphs.join('');
    
    console.log('parseContentForEditor output:', finalHtml);
    return finalHtml;
  }, [availableNotes]);

  const extractPlainContent = useCallback((html: string) => {
    console.log('extractPlainContent input:', html);
    
    // Convert HTML back to @[id]@ format and preserve line breaks
    let processedHtml = html;
    
    // First, handle note links - replace them with @[id]@ format
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = processedHtml;
    
    const noteLinks = tempDiv.querySelectorAll('[data-type="noteLink"]');
    console.log('Found note links in HTML:', noteLinks.length);
    
    noteLinks.forEach((link, index) => {
      const noteId = link.getAttribute('data-note-id');
      console.log(`Processing link ${index}:`, { noteId, element: link });
      if (noteId) {
        const linkText = `@[${noteId}]@`;
        processedHtml = processedHtml.replace(link.outerHTML, linkText);
      }
    });
    
    // Now convert HTML structure to plain text with proper line breaks
    // Replace </p><p> with double newlines (paragraph breaks)
    processedHtml = processedHtml.replace(/<\/p>\s*<p[^>]*>/g, '\n\n');
    
    // Replace <br> tags with single newlines
    processedHtml = processedHtml.replace(/<br\s*\/?>/g, '\n');
    
    // Replace empty paragraphs with blank lines
    processedHtml = processedHtml.replace(/<p[^>]*>\s*<\/p>/g, '\n');
    
    // Remove remaining HTML tags
    processedHtml = processedHtml.replace(/<[^>]*>/g, '');
    
    // Decode HTML entities
    const textDiv = document.createElement('div');
    textDiv.innerHTML = processedHtml;
    let result = textDiv.textContent || textDiv.innerText || '';
    
    // Clean up: remove leading/trailing whitespace but preserve internal structure
    result = result.replace(/^\s+|\s+$/g, '');
    
    console.log('extractPlainContent output:', result);
    return result;
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      NoteLinkExtension,
    ],
    content: parseContentForEditor(content),
    editable: !disabled,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      console.log('Editor updated, HTML:', html);
      const plainContent = extractPlainContent(html);
      console.log('Converted to plain content:', plainContent);
      onContentChange(plainContent);
    },
    onCreate: ({ editor }) => {
      console.log('Editor created with content:', editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] p-4',
        style: 'white-space: pre-wrap;',
      },
      handleKeyDown: (view, event) => {
        // If command palette is open, let it handle Enter but prevent it from going to editor
        if (showCommandPalette && event.key === 'Enter') {
          // Don't prevent or stop - let the palette handle it first
          // The palette will call handleLinkNote which closes the palette
          return false; // Let event bubble to palette, but don't let editor handle it after
        }

        // Cmd/Ctrl + K to open inline command palette
        if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
          event.preventDefault();
          event.stopPropagation();
          const coords = getCursorCoordinates();
          setPalettePosition(coords);
          setPaletteMode('commands');
          setShowCommandPalette(true);
          return true;
        }

        // '/' at the start of a line to open command palette
        if (event.key === '/') {
          const { from } = view.state.selection;
          const $from = view.state.doc.resolve(from);
          const lineStart = $from.start($from.depth);
          const lineContent = view.state.doc.textBetween(lineStart, from);
          
          if (lineContent.trim() === '') {
            event.preventDefault();
            event.stopPropagation();
            const coords = getCursorCoordinates();
            setPalettePosition(coords);
            setPaletteMode('commands');
            setShowCommandPalette(true);
            return true;
          }
        }

        // '@' to open note linking palette
        if (event.key === '@') {
          // Let the @ be typed first, then open palette
          setTimeout(() => {
            const coords = getCursorCoordinates();
            setPalettePosition(coords);
            setPaletteMode('notes');
            setShowCommandPalette(true);
          }, 0);
          return false; // Allow the @ to be typed
        }

        // Handle ESC to close command palette
        if (event.key === 'Escape' && showCommandPalette) {
          event.preventDefault();
          event.stopPropagation();
          setShowCommandPalette(false);
          return true;
        }

        return false;
      },
    },
  });

  // Update editor content when prop changes
  useEffect(() => {
    if (editor && content !== extractPlainContent(editor.getHTML())) {
      console.log('Content prop changed, updating editor from:', content);
      const parsedContent = parseContentForEditor(content);
      console.log('Setting editor content to:', parsedContent);
      editor.commands.setContent(parsedContent, false); // false = don't emit update event
    }
  }, [content, editor, parseContentForEditor, extractPlainContent]);

  // Calculate cursor position for command palette
  const getCursorCoordinates = useCallback(() => {
    if (!editor) return { top: 100, left: 100 };

    const { view } = editor;
    const { from } = view.state.selection;
    const coords = view.coordsAtPos(from);
    
    return {
      top: coords.bottom + 10,
      left: coords.left
    };
  }, [editor]);

  // Insert content at cursor position
  const insertAtCursor = useCallback((text: string) => {
    if (!editor) return;
    
    editor.chain().focus().insertContent(text).run();
  }, [editor]);

  // Handle AI responses
  const handleAskAI = useCallback(async (prompt: string) => {
    try {
      const response = await askAI(prompt);
      insertAtCursor(`${response}`);
    } catch (error) {
      console.error('Failed to get AI response:', error);
    }
  }, [askAI, insertAtCursor]);

  const handleRequestAnalysis = useCallback(async (noteType: string) => {
    try {
      const analysis = await requestAnalysis(noteType);
      insertAtCursor(`## Analysis\n\n${analysis}`);
    } catch (error) {
      console.error('Failed to get analysis:', error);
    }
  }, [requestAnalysis, insertAtCursor]);

  const handleRequestIdeas = useCallback(async () => {
    try {
      const ideas = await requestIdeas();
      const ideasText = ideas.map((idea, index) => `${index + 1}. ${idea}`).join('\n');
      insertAtCursor(`## Ideas\n\n${ideasText}`);
    } catch (error) {
      console.error('Failed to get ideas:', error);
    }
  }, [requestIdeas, insertAtCursor]);

  // Handle note linking
  const handleLinkNote = useCallback((noteId: string) => {
    console.log('🔗 handleLinkNote called with noteId:', noteId);
    
    if (!editor) {
      console.log('❌ No editor available');
      return;
    }

    const selectedNote = availableNotes.find(note => String(note._id) === noteId);
    if (!selectedNote) {
      console.log('❌ Selected note not found:', noteId);
      console.log('Available notes:', availableNotes.map(n => ({ id: n._id, title: n.title })));
      return;
    }

    console.log('✅ Selected note found:', selectedNote);
    
    // Close the palette immediately to prevent further key events
    setShowCommandPalette(false);

    // Get current selection position
    const { from, to } = editor.state.selection;
    console.log('📍 Selection range:', { from, to });
    
    // Look for @ symbol by checking character by character backwards
    let atPosition = -1;
    for (let i = from - 1; i >= Math.max(0, from - 20); i--) {
      const char = editor.state.doc.textBetween(i, i + 1);
      console.log(`📝 Character at position ${i}:`, JSON.stringify(char));
      if (char === '@') {
        atPosition = i;
        console.log('📍 Found @ at position:', atPosition);
        break;
      }
      // Stop if we hit whitespace or newline (@ should be recent)
      if (char === ' ' || char === '\n') {
        console.log('📍 Hit whitespace, stopping search');
        break;
      }
    }
    
    if (atPosition !== -1) {
      // Remove everything from @ to cursor and insert note link
      console.log('🔄 Replacing @ and text from position', atPosition, 'to', from, 'with note link node');
      
      const result = editor.chain()
        .deleteRange({ from: atPosition, to: from })
        .insertContent({
          type: 'noteLink',
          attrs: {
            noteId: selectedNote._id,
            title: selectedNote.title,
          },
        })
        .run();
        
      console.log('✅ Note link node insertion completed, result:', result);
      console.log('📄 Editor HTML after insertion:', editor.getHTML());
    } else {
      // No @ found, just insert the note link node
      console.log('➕ No @ found, inserting note link node at cursor');
      
      const result = editor.chain()
        .insertContent({
          type: 'noteLink',
          attrs: {
            noteId: selectedNote._id,
            title: selectedNote.title,
          },
        })
        .run();
        
      console.log('✅ Note link node insertion completed, result:', result);
      console.log('📄 Editor HTML after insertion:', editor.getHTML());
    }
  }, [editor, availableNotes]);

  // Sync the forwarded ref
  useEffect(() => {
    if (ref && typeof ref === 'function') {
      ref(editor?.view?.dom as HTMLDivElement);
    } else if (ref) {
      (ref as React.MutableRefObject<HTMLDivElement | null>).current = editor?.view?.dom as HTMLDivElement;
    }
  }, [ref, editor]);

  if (!editor) {
    return <div className="p-4 text-muted-foreground">Loading editor...</div>;
  }

  return (
    <div className="relative w-full h-full">
      <EditorContent 
        editor={editor} 
        className="w-full h-full min-h-[300px] prose prose-sm max-w-none"
      />
      
      <InlineCommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        position={palettePosition}
        onAskAI={handleAskAI}
        onRequestAnalysis={handleRequestAnalysis}
        onRequestIdeas={handleRequestIdeas}
        onLinkNote={handleLinkNote}
        noteType={noteType}
        availableNotes={availableNotes}
        currentNoteId={noteId}
        showNoteLinks={paletteMode === 'notes'}
      />
    </div>
  );
});

TiptapNoteEditor.displayName = 'TiptapNoteEditor'; 