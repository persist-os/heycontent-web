import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/app/context/auth-context";
import { Note, NoteUpdate } from "../types";
import { Id } from "@/convex/_generated/dataModel";

export function useNotes() {
  const { user } = useAuth();

  const notes = useQuery(api.notes.getNotes, user?.uid ? { userId: user.uid } : "skip");
  const createNoteMutation = useMutation(api.notes.createNote);
  const updateNoteMutation = useMutation(api.notes.updateNote);
  const deleteNoteMutation = useMutation(api.notes.deleteNote);

  const createNote = async (note: Partial<Note>): Promise<Id<"notes">> => {
    if (!user?.uid) throw new Error("User must be logged in");
    
    const noteId = await createNoteMutation({
      userId: user.uid,
      title: note.title || "Untitled Note",
      content: note.content || "",
      important: note.important || false,
      type: note.type,
      tags: note.tags || [],
      references: note.references || [],
    });

    return noteId;
  };

  const updateNote = async (noteId: string, updates: NoteUpdate) => {
    if (!user?.uid) throw new Error("User must be logged in");
    
    return await updateNoteMutation({
      noteId,
      userId: user.uid,
      updates,
    });
  };

  const deleteNote = async (noteId: string) => {
    if (!user?.uid) throw new Error("User must be logged in");
    
    return await deleteNoteMutation({
      noteId,
      userId: user.uid,
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