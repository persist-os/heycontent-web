import { useState, useEffect, useCallback } from "react";
import { Note, NoteUpdate } from "../types";
import { getApiKey } from "@/app/lib/api-helpers";

export function useNotes(userId: string | undefined) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch notes from backend
  useEffect(() => {
    if (!userId) return;
    setIsLoading(true);
    getApiKey().then(apiKey => {
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/smart-note/user/${userId}`, {
        headers: { Authorization: `Bearer ${apiKey}` }
      })
        .then(res => res.json())
        .then(data => setNotes(data.data || []))
        .finally(() => setIsLoading(false));
    });
  }, [userId]);

  // Create, update, delete using backend API
  const createNote = useCallback(async (note: Partial<Note>) => {
    if (!userId) throw new Error("User ID is required to create a note");
    const apiKey = await getApiKey();
    const now = Date.now();
    const notePayload: any = {
      userId,
      content: note.content || "",
      platform: note.platform || "web",
      createdAt: now,
      type: note.type,
    };
    if ((note as any).templateInput) notePayload.templateInput = (note as any).templateInput;
    if ((note as any).analysisId) notePayload.analysisId = (note as any).analysisId;
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/smart-note/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(notePayload),
    });
    const data = await res.json();
    // Optionally refetch notes here
    return data;
  }, [userId]);

  const updateNote = useCallback(async (noteId: string, updates: NoteUpdate) => {
    const apiKey = await getApiKey();
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/smart-note/${noteId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    // Optionally refetch notes here
    return data;
  }, []);

  const deleteNote = useCallback(async (noteId: string) => {
    const apiKey = await getApiKey();
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/smart-note/${noteId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const data = await res.json();
    // Optionally refetch notes here
    return data;
  }, []);

  return {
    notes,
    isLoading,
    createNote,
    updateNote,
    deleteNote,
  };
}