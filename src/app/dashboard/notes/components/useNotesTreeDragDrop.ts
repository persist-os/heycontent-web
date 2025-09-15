'use client';

import { useState, useCallback } from 'react';
import { DragEndEvent, DragStartEvent, DragOverEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { Note } from '../types';

interface UseNotesTreeDragDropProps {
  updateNote: (noteId: string, updates: Partial<Note>) => Promise<void>;
  addItemToProject: (projectId: string, itemType: string, itemId: string) => Promise<boolean>;
  moveNoteToFolder: (noteId: any, folderId: any) => Promise<void>;
}

export function useNotesTreeDragDrop({
  updateNote,
  addItemToProject,
  moveNoteToFolder
}: UseNotesTreeDragDropProps) {
  const [draggedNote, setDraggedNote] = useState<Note | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum distance to start dragging
      },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === 'note') {
      const note = active.data.current.note;
      // Only allow dragging if user has edit permission or owns the note
      if (!note.isSharedWithMe || note.permission === 'edit') {
        setDraggedNote(note);
      }
    }
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event;
    if (over?.data.current?.droppableType) {
      setDragOverFolder(String(over.id));
    } else {
      setDragOverFolder(null);
    }
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    
    setDraggedNote(null);
    setDragOverFolder(null);

    if (!over || !active.data.current?.note) return;

    const note = active.data.current.note as Note;
    const dropData = over.data.current;
    const droppableType = dropData?.droppableType;

    try {
      switch (droppableType) {
        case 'starred':
          // Toggle the important field to add to starred
          await updateNote(String(note._id), { important: true });
          break;
          
        case 'project':
          // Add note to project
          if (dropData?.projectId) {
            await addItemToProject(dropData.projectId, 'note', String(note._id));
          }
          break;
          
        case 'user-folder':
          // Move note to folder
          if (dropData?.folderId) {
            await moveNoteToFolder(String(note._id) as any, dropData.folderId as any);
          }
          break;
          
        case 'tag':
          // Add tag to note
          if (dropData?.tagName) {
            const currentTags = note.tags || [];
            if (!currentTags.includes(dropData.tagName)) {
              await updateNote(String(note._id), { 
                tags: [...currentTags, dropData.tagName] 
              });
            }
          }
          break;
          
        case 'all-notes':
          // Remove from special categories (make it a regular note)
          const updates: any = {};
          if (note.important) {
            updates.important = false;
          }
          if (Object.keys(updates).length > 0) {
            await updateNote(String(note._id), updates);
          }
          break;
      }
    } catch (error) {
      console.error('Failed to move note:', error);
    }
  }, [updateNote, addItemToProject, moveNoteToFolder]);

  return {
    sensors,
    draggedNote,
    dragOverFolder,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  };
}
