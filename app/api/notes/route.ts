import { NextResponse } from 'next/server';
import { auth } from '@/app/auth';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const notes = await convex.query(api.notes.getNotes, { userId: session.user.id });
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
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await req.json();
    const { title, content, important, tags, references } = json;

    const noteId = await convex.mutation(api.notes.createNote, {
      userId: session.user.id,
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