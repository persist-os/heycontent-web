import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/app/context/auth-context";
import { Note, NoteUpdate } from "../types";
import { Id } from "@/convex/_generated/dataModel";

export function useNotes() {
  const { user } = useAuth();

  const notes = useQuery(api.notes.getNotesByUser, user?.uid ? { userId: user.uid } : "skip");
  const createNoteMutation = useMutation(api.notes.createNote);
  const updateNoteMutation = useMutation(api.notes.updateNote);
  const deleteNoteMutation = useMutation(api.notes.deleteNote);

  const createNote = async (note: Partial<Note>): Promise<Id<"notes">> => {
    if (!user?.uid) throw new Error("User must be logged in");
    
    const noteId = await createNoteMutation({
      userId: user.uid,
      content: note.content || "",
      platform: note.platform || "web", // Add default platform if not provided

      type: note.type, // Pass the note type (e.g. brainstorm)
      // Don't need templateInput for brainstorm notes
    });

    return noteId;
  };

  const updateNote = async (noteId: Id<"notes"> | string, updates: NoteUpdate) => {
    if (!user?.uid) throw new Error("User must be logged in");
    
    // The API expects noteId and updates directly, not wrapped in another object
    return await updateNoteMutation({
      noteId: noteId as Id<"notes">,
      userId: user.uid,
      updates: {
        content: updates.content,
        platform: updates.platform,
        title: updates.title,
        important: updates.important,
        type: updates.type,
        tags: updates.tags,
        // Include all fields that might be updated
      },
    });
  };

  const deleteNote = async (noteId: Id<"notes"> | string) => {
    if (!user?.uid) throw new Error("User must be logged in");
    
    return await deleteNoteMutation({
      noteId: noteId.toString(), // Convert to string as the API expects
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