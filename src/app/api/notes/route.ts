import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { fetchMutation, fetchQuery } from 'convex/nextjs';
import { api } from "@/convex/_generated/api";
import { getUserIdFromToken } from '@/app/lib/getUserIdFromToken';

export async function GET() {
  try {
    const token = (await cookies()).get('firebase-auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user ID from the token
    const userId = await getUserIdFromToken(token);
    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const notes = await fetchQuery(api.notes.getNotes, { userId });
    return NextResponse.json(notes);
  } catch (error: any) {
    console.error('[NOTES_GET]', error);
    return NextResponse.json(
      { error: 'Internal error', details: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const token = (await cookies()).get('firebase-auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user ID from the token
    const userId = await getUserIdFromToken(token);
    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Parse request body but use default values for new notes
    await req.json(); // Consume the request body

    // Create a new note with empty content
    const noteId = await fetchMutation(api.notes.createNote, {
      userId,
      title: 'Untitled Note', // Always use default title for new notes
      content: '', // Always start with empty content
      important: false, // Default to not important
      tags: [], // Start with no tags
      references: [] // Start with no references
    });

    if (!noteId) {
      console.error('[NOTES_POST] Failed to create note: No noteId returned');
      return NextResponse.json(
        { error: 'Failed to create note', details: 'No note ID returned from database' },
        { status: 500 }
      );
    }

    // Fetch the newly created note to return the full object
    const newNote = await fetchQuery(api.notes.getNote, { userId, noteId });

    // Ensure we have a valid note object to return
    if (!newNote) {
      console.error('[NOTES_POST] Failed to retrieve created note', { noteId });
      return NextResponse.json(
        { error: 'Failed to retrieve created note', details: 'Note was created but could not be retrieved' },
        { status: 500 }
      );
    }

    // Transform the Convex note to match the expected Note interface
    const formattedNote = {
      id: noteId,
      title: newNote.title || 'Untitled Note',
      content: newNote.content || '',
      createdAt: new Date(newNote.createdAt),
      updatedAt: new Date(newNote.updatedAt),
      important: newNote.important || false,
      type: newNote.type || 'idea',
      tags: newNote.tags || [],
      references: newNote.references || []
    };

    return NextResponse.json(formattedNote);
  } catch (error: any) {
    console.error('[NOTES_POST]', error);
    return NextResponse.json(
      { error: 'Internal error', details: error?.message },
      { status: 500 }
    );
  }
}