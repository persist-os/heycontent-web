import { NextResponse } from 'next/server';
import { auth } from '@/app/auth';
import { api } from '@/convex/_generated/api';
import { fetchMutation } from 'convex/nextjs';

export async function PUT(
  req: Request,
  { params }: { params: { noteId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await req.json();
    const { title, content, important, type, tags, references } = json;

    // Update the note using Convex mutation
    const note = await fetchMutation(api.notes.updateNote, {
      noteId: params.noteId,
      userId: session.user.id,
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

    return NextResponse.json(note);
  } catch (error: any) {
    console.error('[NOTE_PUT] Detailed error:', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack
    });
    return NextResponse.json(
      { error: 'Internal error', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { noteId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete the note using Convex mutation
    await fetchMutation(api.notes.deleteNote, {
      noteId: params.noteId,
      userId: session.user.id
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[NOTE_DELETE] Detailed error:', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack
    });
    return NextResponse.json(
      { error: 'Internal error', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
} 