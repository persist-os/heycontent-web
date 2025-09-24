/**
 * Reflection Example Component
 * 
 * ✅ EXAMPLE: Demonstrates how to use the connected reflection system
 * 
 * This shows the proper usage patterns for:
 * - useReflectionState & useReflectionActions (from store)
 * - useReflectionNotesActions (from provider) 
 * - useReflectionLoadingStates (from provider)
 */

'use client'

import { useState } from 'react'
import {
    useReflectionState,
    useReflectionActions,
    useReflectionNotesData
} from '../../stores/reflectionStore'
import {
    useReflectionNotesActions,
    useReflectionLoadingStates
} from './ReflectionProvider'

export function ReflectionExample() {
    // ✅ UI STATE FROM STORE
    const { isOpen, noteId, content, title, isDirty, error } = useReflectionState()
    const { openNotepad, closeNotepad, updateContent, updateTitle } = useReflectionActions()
    
    // ✅ NOTES DATA FROM STORE
    const { selectedNotesList } = useReflectionNotesData()
    
    // ✅ CONVEX OPERATIONS FROM PROVIDER
    const { createNote, updateNote, deleteNote, loadNotes } = useReflectionNotesActions()
    const { isLoadingNotes, isSaving, hasError, error: loadingError } = useReflectionLoadingStates()
    
    // Local state for demo
    const [newNoteContent, setNewNoteContent] = useState('')

    const handleCreateNewNote = async () => {
        try {
            const newNote = await createNote({
                content: newNoteContent,
                title: 'New Reflection',
                type: 'reflection_journal'
            })
            
            if (newNote) {
                openNotepad(newNote._id, newNote.content, newNote.title)
                setNewNoteContent('')
            }
        } catch (error) {
            console.error('Failed to create note:', error)
        }
    }

    const handleOpenNote = (note: any) => {
        openNotepad(note._id, note.content, note.title)
    }

    const handleSaveCurrentNote = async () => {
        if (!noteId) return
        
        try {
            await updateNote({
                noteId,
                content,
                title
            })
        } catch (error) {
            console.error('Failed to save note:', error)
        }
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Reflection System Example</h1>
            
            {/* ERROR DISPLAY */}
            {(error || loadingError) && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                    {error || loadingError}
                </div>
            )}
            
            {/* CREATE NEW NOTE */}
            <div className="mb-6 p-4 border rounded-lg">
                <h2 className="text-lg font-semibold mb-3">Create New Note</h2>
                <textarea
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    placeholder="Enter your reflection..."
                    className="w-full p-3 border rounded-md mb-3"
                    rows={3}
                />
                <button
                    onClick={handleCreateNewNote}
                    disabled={!newNoteContent.trim() || isSaving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
                >
                    {isSaving ? 'Creating...' : 'Create Note'}
                </button>
            </div>

            {/* NOTES LIST */}
            <div className="mb-6 p-4 border rounded-lg">
                <h2 className="text-lg font-semibold mb-3">Your Notes</h2>
                {isLoadingNotes ? (
                    <p>Loading notes...</p>
                ) : selectedNotesList.length > 0 ? (
                    <div className="space-y-2">
                        {selectedNotesList.map((note) => (
                            <div
                                key={note._id}
                                className="p-3 border rounded-md cursor-pointer hover:bg-gray-50"
                                onClick={() => handleOpenNote(note)}
                            >
                                <h3 className="font-medium">{note.title || 'Untitled'}</h3>
                                <p className="text-sm text-gray-600 truncate">
                                    {note.content.substring(0, 100)}...
                                </p>
                                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                    <span>{note.type}</span>
                                    {note.important && <span className="text-orange-600">Important</span>}
                                    <span>{note.tags.join(', ')}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">No notes yet. Create your first reflection!</p>
                )}
            </div>

            {/* NOTEPAD */}
            {isOpen && (
                <div className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold">
                            {noteId ? 'Edit Note' : 'New Note'}
                            {isDirty && <span className="text-orange-600 ml-2">*</span>}
                        </h2>
                        <button
                            onClick={closeNotepad}
                            className="px-3 py-1 text-gray-600 hover:text-gray-800"
                        >
                            Close
                        </button>
                    </div>
                    
                    <input
                        type="text"
                        value={title || ''}
                        onChange={(e) => updateTitle(e.target.value)}
                        placeholder="Note title..."
                        className="w-full p-2 border rounded-md mb-3"
                    />
                    
                    <textarea
                        value={content}
                        onChange={(e) => updateContent(e.target.value)}
                        placeholder="Write your reflection..."
                        className="w-full p-3 border rounded-md mb-3"
                        rows={8}
                    />
                    
                    <div className="flex gap-2">
                        <button
                            onClick={handleSaveCurrentNote}
                            disabled={!isDirty || isSaving}
                            className="px-4 py-2 bg-green-600 text-white rounded-md disabled:opacity-50"
                        >
                            {isSaving ? 'Saving...' : 'Save'}
                        </button>
                        
                        <button
                            onClick={closeNotepad}
                            className="px-4 py-2 bg-gray-600 text-white rounded-md"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
