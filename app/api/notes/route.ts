import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET() {
  try {
    const token = cookies().get('firebase-auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user ID from the token
    const userId = await convex.query(api.queries.getUserIdFromToken, { token });
    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const notes = await convex.query(api.notes.getNotes, { userId });
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
    const token = cookies().get('firebase-auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user ID from the token
    const userId = await convex.query(api.queries.getUserIdFromToken, { token });
    if (!userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const json = await req.json();
    const { title, content, important, tags, references } = json;

    const noteId = await convex.mutation(api.notes.createNote, {
      userId,
      title: title || 'Untitled Note',
      content: content || '',
      important: important || false,
      tags: tags || [],
      references: references || []
    });

    return NextResponse.json({ id: noteId });
  } catch (error: any) {
    console.error('[NOTES_POST]', error);
    return NextResponse.json(
      { error: 'Internal error', details: error?.message },
      { status: 500 }
    );
  }
} 