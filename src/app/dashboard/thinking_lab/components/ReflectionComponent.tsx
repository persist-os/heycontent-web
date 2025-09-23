/**
 * Reflection Component
 *
 * Notepad interface that replaces existing notepad with context-based architecture.
 * Handles note editing, auto-save, quote insertion, and collaborative documentation.
 *
 * Features:
 * - Rich text editing with auto-save
 * - Quote insertion from dialogue
 * - Collapsible interface
 * - Save status indicators
 * - Mobile-optimized writing
 *
 * Dependencies: useReflection hook
 */

import React, { useRef, useEffect } from 'react'
import { useReflection } from '../hooks/useLabCore'

// =============================================================================
// INTERFACES
// =============================================================================

interface ReflectionComponentProps {
    className?: string
    showHeader?: boolean
    autoSave?: boolean
    placeholder?: string
    collapsible?: boolean
}

interface ReflectionHeaderProps {
    noteId?: string
    isDirty: boolean
    isSaving: boolean
    onSave: () => void
    onClose?: () => void
    onToggleCollapse?: () => void
}

interface ReflectionEditorProps {
    content: string
    onChange: (content: string) => void
    placeholder?: string
    disabled?: boolean
}

interface SaveStatusProps {
    isDirty: boolean
    isSaving: boolean
    lastSaved?: number
    error?: string
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ReflectionComponent({
                                        className = '',
                                        showHeader = true,
                                        autoSave = true,
                                        placeholder = "Start writing your thoughts...",
                                        collapsible = false
                                    }: ReflectionComponentProps) {
    const { state: reflectionState, actions: reflectionActions } = useReflection()
    const [isCollapsed, setIsCollapsed] = React.useState(false)

    const handleContentChange = (content: string) => {
        reflectionActions.updateContent(content)
    }

    const handleSave = async () => {
        try {
            await reflectionActions.saveNote()
        } catch (error) {
            // TODO: Add your error handling logic
            console.error('Failed to save note:', error)
        }
    }

    const handleClose = () => {
        if (reflectionState.isDirty) {
            // TODO: Show confirmation dialog before closing with unsaved changes?
            const confirmClose = window.confirm('You have unsaved changes. Close anyway?')
            if (!confirmClose) return
        }
        reflectionActions.closeNotepad()
    }

    const handleToggleCollapse = () => {
        setIsCollapsed(!isCollapsed)
    }

    // Don't render if notepad is not open
    if (!reflectionState.isOpen) {
        return null
    }

    return (
        <div className={`reflection-component ${className} ${isCollapsed ? 'collapsed' : ''}`}>
            {showHeader && (
                <ReflectionHeader
                    noteId={reflectionState.noteId}
                    isDirty={reflectionState.isDirty}
                    isSaving={reflectionState.isSaving}
                    onSave={handleSave}
                    onClose={handleClose}
                    onToggleCollapse={collapsible ? handleToggleCollapse : undefined}
                />
            )}

            {!isCollapsed && (
                <>
                    <ReflectionEditor
                        content={reflectionState.content}
                        onChange={handleContentChange}
                        placeholder={placeholder}
                        disabled={reflectionState.isSaving}
                    />

                    <SaveStatus
                        isDirty={reflectionState.isDirty}
                        isSaving={reflectionState.isSaving}
                        error={reflectionState.error}
                    />
                </>
            )}
        </div>
    )
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function ReflectionHeader({
                              noteId,
                              isDirty,
                              isSaving,
                              onSave,
                              onClose,
                              onToggleCollapse
                          }: ReflectionHeaderProps) {
    return (
        <div className="reflection-header">
            {/* TODO: Copy your existing notepad header structure and styling */}
            <div className="reflection-header-info">
        <span className="note-title">
          {noteId ? `Note: ${noteId}` : 'New Note'}
        </span>
                {isDirty && <span className="dirty-indicator">•</span>}
            </div>

            <div className="reflection-header-actions">
                <button
                    onClick={onSave}
                    disabled={!isDirty || isSaving}
                    className="save-button"
                >
                    {/* TODO: Add your save icon */}
                    {isSaving ? 'Saving...' : 'Save'}
                </button>

                {onToggleCollapse && (
                    <button
                        onClick={onToggleCollapse}
                        className="collapse-button"
                        title="Collapse notepad"
                    >
                        {/* TODO: Add your collapse icon */}
                        ↕
                    </button>
                )}

                {onClose && (
                    <button
                        onClick={onClose}
                        className="close-button"
                        title="Close notepad"
                    >
                        {/* TODO: Add your close icon */}
                        ✕
                    </button>
                )}
            </div>
        </div>
    )
}

function ReflectionEditor({
                              content,
                              onChange,
                              placeholder = "Start writing...",
                              disabled = false
                          }: ReflectionEditorProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Auto-resize textarea
    useEffect(() => {
        const textarea = textareaRef.current
        if (textarea) {
            textarea.style.height = 'auto'
            textarea.style.height = `${textarea.scrollHeight}px`
        }
    }, [content])

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange(e.target.value)
    }

    // TODO: Handle keyboard shortcuts for formatting, etc.
    const handleKeyDown = (e: React.KeyboardEvent) => {
        // TODO: Add any keyboard shortcuts you want to support
        // For example: Ctrl+S for save, Ctrl+B for bold, etc.
    }

    return (
        <div className="reflection-editor">
            {/* TODO: Copy your existing text editor structure and styling */}
            <textarea
                ref={textareaRef}
                value={content}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                className="reflection-textarea"
                autoFocus={true}
                // TODO: Add any other textarea props you need
            />

            {/* TODO: Add any formatting toolbar if you have one */}
            <div className="editor-toolbar">
                {/* Formatting buttons, word count, etc. */}
            </div>
        </div>
    )
}

function SaveStatus({
                        isDirty,
                        isSaving,
                        lastSaved,
                        error
                    }: SaveStatusProps) {
    const getStatusText = () => {
        if (error) return `Error: ${error}`
        if (isSaving) return 'Saving...'
        if (isDirty) return 'Unsaved changes'
        if (lastSaved) return `Saved ${new Date(lastSaved).toLocaleTimeString()}`
        return 'No changes'
    }

    const getStatusClass = () => {
        if (error) return 'status-error'
        if (isSaving) return 'status-saving'
        if (isDirty) return 'status-dirty'
        return 'status-saved'
    }

    return (
        <div className={`save-status ${getStatusClass()}`}>
            {/* TODO: Style this status indicator to match your design */}
            <span className="status-text">{getStatusText()}</span>

            {/* TODO: Add any status icons you want */}
            <span className="status-icon">
        {error && '⚠'}
                {isSaving && '⏳'}
                {isDirty && '●'}
                {!isDirty && !isSaving && !error && '✓'}
      </span>
        </div>
    )
}

// =============================================================================
// EXPORTS
// =============================================================================

export default ReflectionComponent
export type { ReflectionComponentProps, ReflectionEditorProps, SaveStatusProps }