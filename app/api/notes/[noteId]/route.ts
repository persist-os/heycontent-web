import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { fetchMutation, fetchQuery } from 'convex/nextjs';
import { api } from "@/convex/_generated/api";

export async function GET(
  _req: Request,
  { params }: { params: { noteId: string } }
) {
  try {
    const token = cookies().get('firebase-auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user ID from the token
    const userId = await fetchQuery(api.queries.getUserIdFromToken, { token });
    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get the note using Convex query
    const note = await fetchQuery(api.notes.getNote, {
      noteId: params.noteId,
      userId
    });

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Format the note to match the expected Note interface
    const formattedNote = {
      id: params.noteId,
      title: note.title || 'Untitled Note',
      content: note.content || '',
      createdAt: new Date(note.createdAt),
      updatedAt: new Date(note.updatedAt),
      important: note.important || false,
      type: note.type || 'idea',
      tags: note.tags || [],
      references: note.references || []
    };

    return NextResponse.json(formattedNote);
  } catch (error: any) {
    console.error('[NOTE_GET]', error);
    return NextResponse.json(
      { error: 'Internal error', details: error?.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { noteId: string } }
) {
  try {
    const token = cookies().get('firebase-auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user ID from the token
    const userId = await fetchQuery(api.queries.getUserIdFromToken, { token });
    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const json = await req.json();
    const { title, content, important, type, tags, references } = json;

    // Update the note using Convex mutation
    const note = await fetchMutation(api.notes.updateNote, {
      noteId: params.noteId,
      userId,
      updates: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(important !== undefined && { important }),
        ...(type !== undefined && { type }),
        ...(tags !== undefined && { tags }),
        ...(references !== undefined && { references }),
        updatedAt: Date.now()
      }
    });

    // Format the note to match the expected Note interface
    const formattedNote = {
      id: params.noteId,
      title: note.title || 'Untitled Note',
      content: note.content || '',
      createdAt: new Date(note.createdAt),
      updatedAt: new Date(note.updatedAt),
      important: note.important || false,
      type: note.type || 'idea',
      tags: note.tags || [],
      references: note.references || []
    };

    return NextResponse.json(formattedNote);
  } catch (error: any) {
    console.error('[NOTE_PUT]', error);
    return NextResponse.json(
      { error: 'Internal error', details: error?.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { noteId: string } }
) {
  try {
    const token = cookies().get('firebase-auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user ID from the token
    const userId = await fetchQuery(api.queries.getUserIdFromToken, { token });
    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Delete the note using Convex mutation
    await fetchMutation(api.notes.deleteNote, {
      noteId: params.noteId,
      userId
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[NOTE_DELETE]', error);
    return NextResponse.json(
      { error: 'Internal error', details: error?.message },
      { status: 500 }
    );
  }
}