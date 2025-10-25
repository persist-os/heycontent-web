'use client'

import React from 'react'
import { Editor } from '@tiptap/react'
import { 
  Bold, 
  Italic, 
  Underline,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link,
  CheckSquare,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TiptapToolbarProps {
  editor: Editor
  className?: string
}

export function TiptapToolbar({ editor, className = '' }: TiptapToolbarProps) {
  if (!editor) return null

  const setLink = () => {
    const url = window.prompt('Enter URL:')
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  return (
    <div className={`flex flex-wrap items-center gap-0.5 py-1.5 w-full ${className}`}>
      {/* Text formatting */}
      <Button
        variant={editor.isActive('bold') ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className="h-7 w-7 p-0 hover:bg-muted/50"
      >
        <Bold className="h-3.5 w-3.5" />
      </Button>
      
      <Button
        variant={editor.isActive('italic') ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className="h-7 w-7 p-0 hover:bg-muted/50"
      >
        <Italic className="h-3.5 w-3.5" />
      </Button>
      
      <Button
        variant={editor.isActive('underline') ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        disabled={!editor.can().chain().focus().toggleUnderline().run()}
        className="h-7 w-7 p-0 hover:bg-muted/50"
      >
        <Underline className="h-3.5 w-3.5" />
      </Button>
      
      <Button
        variant={editor.isActive('code') ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleCode().run()}
        disabled={!editor.can().chain().focus().toggleCode().run()}
        className="h-7 w-7 p-0 hover:bg-muted/50"
      >
        <Code className="h-3.5 w-3.5" />
      </Button>

      <div className="w-px h-4 bg-border/30 mx-1" />

      {/* Headings */}
      <Button
        variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className="h-7 w-7 p-0 hover:bg-muted/50"
      >
        <Heading1 className="h-3.5 w-3.5" />
      </Button>
      
      <Button
        variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className="h-7 w-7 p-0 hover:bg-muted/50"
      >
        <Heading2 className="h-3.5 w-3.5" />
      </Button>
      
      <Button
        variant={editor.isActive('heading', { level: 3 }) ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className="h-7 w-7 p-0 hover:bg-muted/50"
      >
        <Heading3 className="h-3.5 w-3.5" />
      </Button>

      <div className="w-px h-4 bg-border/30 mx-1" />

      {/* Lists */}
      <Button
        variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className="h-7 w-7 p-0 hover:bg-muted/50"
      >
        <List className="h-3.5 w-3.5" />
      </Button>
      
      <Button
        variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className="h-7 w-7 p-0 hover:bg-muted/50"
      >
        <ListOrdered className="h-3.5 w-3.5" />
      </Button>
      
      <Button
        variant={editor.isActive('taskList') ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        className="h-7 w-7 p-0 hover:bg-muted/50"
      >
        <CheckSquare className="h-3.5 w-3.5" />
      </Button>

      <div className="w-px h-4 bg-border/30 mx-1" />

      {/* Blockquote */}
      <Button
        variant={editor.isActive('blockquote') ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className="h-7 w-7 p-0 hover:bg-muted/50"
      >
        <Quote className="h-3.5 w-3.5" />
      </Button>
      
      {/* Link */}
      <Button
        variant="ghost"
        size="sm"
        onClick={setLink}
        disabled={!editor.can().chain().focus().setLink({ href: '' }).run()}
        className="h-7 w-7 p-0 hover:bg-muted/50"
      >
        <Link className="h-3.5 w-3.5" />
      </Button>

      <div className="w-px h-4 bg-border/30 mx-1" />

      {/* Alignment */}
      <Button
        variant={editor.isActive({ textAlign: 'left' }) ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        className="h-7 w-7 p-0 hover:bg-muted/50"
      >
        <AlignLeft className="h-3.5 w-3.5" />
      </Button>
      
      <Button
        variant={editor.isActive({ textAlign: 'center' }) ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        className="h-7 w-7 p-0 hover:bg-muted/50"
      >
        <AlignCenter className="h-3.5 w-3.5" />
      </Button>
      
      <Button
        variant={editor.isActive({ textAlign: 'right' }) ? 'default' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        className="h-7 w-7 p-0 hover:bg-muted/50"
      >
        <AlignRight className="h-3.5 w-3.5" />
      </Button>

      <div className="w-px h-4 bg-border/30 mx-1" />

      {/* History */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        className="h-7 w-7 p-0 hover:bg-muted/50"
      >
        <Undo className="h-3.5 w-3.5" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        className="h-7 w-7 p-0 hover:bg-muted/50"
      >
        <Redo className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}
