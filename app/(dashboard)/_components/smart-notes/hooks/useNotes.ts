import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@clerk/nextjs";
import { Note, NoteUpdate } from "../types";

export function useNotes() {
  const { userId } = useAuth();

  const notes = useQuery(api.notes.getNotes, userId ? { userId } : "skip");
  const createNoteMutation = useMutation(api.notes.createNote);
  const updateNoteMutation = useMutation(api.notes.updateNote);
  const deleteNoteMutation = useMutation(api.notes.deleteNote);

  const createNote = async (note: Partial<Note>) => {
    if (!userId) throw new Error("User must be logged in");
    
    const newNote = await createNoteMutation({
      userId,
      title: note.title || "Untitled Note",
      content: note.content || "",
      important: note.important || false,
      type: note.type,
      tags: note.tags || [],
      references: note.references || [],
    });

    return newNote;
  };

  const updateNote = async (noteId: string, updates: NoteUpdate) => {
    if (!userId) throw new Error("User must be logged in");
    
    return await updateNoteMutation({
      noteId,
      userId,
      updates,
    });
  };

  const deleteNote = async (noteId: string) => {
    if (!userId) throw new Error("User must be logged in");
    
    return await deleteNoteMutation({
      noteId,
      userId,
    });
  };

  return {
    notes: notes || [],
    isLoading: notes === undefined,
    createNote,
    updateNote,
    deleteNote,
  };
}