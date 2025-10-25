'use client'

import React, { forwardRef, useImperativeHandle, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Color from '@tiptap/extension-color'
import TextStyle from '@tiptap/extension-text-style'
import Highlight from '@tiptap/extension-highlight'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import Focus from '@tiptap/extension-focus'
import Typography from '@tiptap/extension-typography'
import { T } from '@/components/translation'

export interface SimpleTiptapEditorRef {
  getContent: () => string
  setContent: (content: string) => void
  clear: () => void
  hasContent: () => boolean
  focus: () => void
  editor: any
}

interface SimpleTiptapEditorProps {
  content: string
  onContentChange: (content: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  minHeight?: string
  isMobile?: boolean
}

export const SimpleTiptapEditor = forwardRef<SimpleTiptapEditorRef, SimpleTiptapEditorProps>(
  ({ 
    content, 
    onContentChange, 
    placeholder = 'Start writing...',
    disabled = false,
    className = '',
    minHeight = '300px',
    isMobile = false
  }, ref) => {
    
    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          codeBlock: false, // We'll add this back with syntax highlighting later
        }),
        Color,
        TextStyle,
        Highlight.configure({
          multicolor: true,
        }),
        TextAlign.configure({
          types: ['heading', 'paragraph'],
        }),
        Underline,
        Image.configure({
          HTMLAttributes: {
            class: 'rounded-lg max-w-full h-auto',
          },
        }),
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: 'text-blue-600 hover:text-blue-800 underline',
          },
        }),
        TaskList,
        TaskItem.configure({
          nested: true,
        }),
        Placeholder.configure({
          placeholder,
        }),
        CharacterCount,
        Focus.configure({
          className: 'has-focus',
          mode: 'all',
        }),
        Typography,
      ],
      content,
      editable: !disabled,
      onUpdate: ({ editor }) => {
        onContentChange(editor.getHTML())
      },
      editorProps: {
        attributes: {
          class: `prose prose-lg dark:prose-invert max-w-none focus:outline-none leading-relaxed ${className}`,
          style: `min-height: ${minHeight}`,
        },
      },
    })

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      getContent: () => editor?.getHTML() || '',
      setContent: (newContent: string) => {
        editor?.commands.setContent(newContent)
      },
      clear: () => {
        editor?.commands.clearContent()
      },
      hasContent: () => {
        return editor?.getText().trim().length > 0
      },
      focus: () => {
        editor?.commands.focus()
      },
      editor
    }), [editor])

    // Update content when prop changes
    React.useEffect(() => {
      if (editor && content !== editor.getHTML()) {
        editor.commands.setContent(content)
      }
    }, [content, editor])

    if (!editor) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">
            <T context="editor.loading">Loading editor...</T>
          </div>
        </div>
      )
    }

    return (
      <div className="relative w-full h-full">
        <style jsx>{`
          .tiptap-editor {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.7;
            color: hsl(var(--foreground));
            width: 100%;
            height: 100%;
            min-height: 100vh;
          }
          
          .tiptap-editor h1 {
            font-size: 2rem;
            font-weight: 700;
            line-height: 1.2;
            margin: 1.5rem 0 1rem 0;
            color: hsl(var(--foreground));
          }
          
          .tiptap-editor h2 {
            font-size: 1.5rem;
            font-weight: 600;
            line-height: 1.3;
            margin: 1.25rem 0 0.75rem 0;
            color: hsl(var(--foreground));
          }
          
          .tiptap-editor h3 {
            font-size: 1.25rem;
            font-weight: 600;
            line-height: 1.4;
            margin: 1rem 0 0.5rem 0;
            color: hsl(var(--foreground));
          }
          
          .tiptap-editor p {
            font-size: 1rem;
            margin: 0.75rem 0;
            color: hsl(var(--foreground) / 0.9);
          }
          
          .tiptap-editor ul, .tiptap-editor ol {
            margin: 0.75rem 0;
            padding-left: 1.5rem;
          }
          
          .tiptap-editor li {
            margin: 0.25rem 0;
            font-size: 1rem;
          }
          
          .tiptap-editor blockquote {
            border-left: 4px solid hsl(var(--primary));
            padding-left: 1rem;
            margin: 1rem 0;
            font-style: italic;
            color: hsl(var(--muted-foreground));
            background: hsl(var(--muted) / 0.3);
            padding: 1rem;
            border-radius: 0.5rem;
          }
          
          .tiptap-editor code {
            background: hsl(var(--muted));
            padding: 0.125rem 0.375rem;
            border-radius: 0.25rem;
            font-size: 0.875rem;
            font-family: 'JetBrains Mono', 'Fira Code', monospace;
          }
          
          .tiptap-editor pre {
            background: hsl(var(--muted));
            padding: 1rem;
            border-radius: 0.5rem;
            overflow-x: auto;
            margin: 1rem 0;
            font-family: 'JetBrains Mono', 'Fira Code', monospace;
            font-size: 0.875rem;
            line-height: 1.5;
          }
          
          .tiptap-editor a {
            color: hsl(var(--primary));
            text-decoration: underline;
            text-decoration-color: hsl(var(--primary) / 0.3);
            transition: all 0.2s ease;
          }
          
          .tiptap-editor a:hover {
            text-decoration-color: hsl(var(--primary));
            color: hsl(var(--primary) / 0.8);
          }
          
          .tiptap-editor mark {
            background: hsl(var(--primary) / 0.2);
            padding: 0.125rem 0.25rem;
            border-radius: 0.25rem;
          }
          
          .tiptap-editor img {
            border-radius: 0.5rem;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
            margin: 1rem 0;
          }
          
          .tiptap-editor .has-focus {
            outline: none;
          }
          
          .tiptap-editor ul[data-type="taskList"] {
            list-style: none;
            padding-left: 0;
          }
          
          .tiptap-editor ul[data-type="taskList"] li {
            display: flex;
            align-items: flex-start;
            margin: 0.5rem 0;
          }
          
          .tiptap-editor ul[data-type="taskList"] li > label {
            flex: 0 0 auto;
            margin-right: 0.5rem;
            user-select: none;
          }
          
          .tiptap-editor ul[data-type="taskList"] li > div {
            flex: 1 1 auto;
          }
        `}</style>
        
        <EditorContent 
          editor={editor} 
          className={`w-full h-full tiptap-editor py-4 ${isMobile ? 'px-4' : 'px-6'}`}
        />
        
        {/* Character count */}
        {editor.storage.characterCount && (
          <div className="absolute bottom-3 right-3 text-xs text-muted-foreground/70 bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-border/30 shadow-sm">
            {editor.storage.characterCount.characters()} characters
          </div>
        )}
      </div>
    )
  }
)

SimpleTiptapEditor.displayName = 'SimpleTiptapEditor'
