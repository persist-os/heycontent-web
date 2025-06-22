'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useNotes } from '@/app/context/notes-context';
import { getApiKey } from '@/app/lib/api-helpers';

export const useCreateNote = () => {
  const router = useRouter();
  const { saveNote, setActiveNoteId } = useNotes();
  const [isCreating, setIsCreating] = useState(false);

  const generateMetadata = useCallback(async (
    noteId: string,
    noteContent: string
  ): Promise<{ success: boolean; data?: any; error?: string }> => {
    console.log("🚀 [generateMetadata] Starting metadata generation for note:", noteId);
    if (!noteContent || noteContent.trim().length < 10) {
      console.log("⏭️ [generateMetadata] Skipping: content is too short.");
      return { success: false, error: "Content too short" };
    }

    try {
      const apiKey = await getApiKey();
      if (!apiKey) {
        console.error("❌ [generateMetadata] API key not found.");
        return { success: false, error: "API key not found" };
      }

      const response = await fetch('/api/smart-notes/generate-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ noteId, noteContent }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ [generateMetadata] API call failed:", { status: response.status, errorData });
        throw new Error(errorData.message || 'Failed to generate metadata');
      }

      const data = await response.json();
      console.log("✅ [generateMetadata] Metadata generated successfully:", data);
      return { success: true, data };
    } catch (error) {
      console.error("💥 [generateMetadata] Error during metadata generation:", error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }, []);

  const createNote = async (content: string, callback?: () => void, customTitle?: string) => {
    if (!content.trim()) return;
    
    setIsCreating(true);
    
    try {
      console.log("🚀 [useCreateNote] Starting note creation process");
      
      const { success, noteId } = await saveNote(content, { title: customTitle });
      
      if (success && noteId) {
        console.log("✅ [useCreateNote] Note created successfully:", noteId);
        
        // Trigger metadata generation
        await generateMetadata(noteId.toString(), content);

        setActiveNoteId(noteId.toString());
        router.push('/dashboard/notes');
        if (callback) {
          callback();
        }
      } else {
        console.error("❌ [useCreateNote] Failed to create note - no ID returned");
      }
    } catch (error) {
      console.error("💥 [useCreateNote] Error creating note:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return { createNote, isCreating };
}; 