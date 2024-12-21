import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('[NOTES_GET] Checking authentication...');
    const session = await auth();
    console.log('[NOTES_GET] Session:', {
      exists: !!session,
      user: session?.user ? {
        id: session.user.id,
        email: session.user.email
      } : null
    });

    if (!session?.user?.id) {
      console.error('[NOTES_GET] Unauthorized: No user session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[NOTES_GET] Fetching notes for user:', session.user.id);
    const notes = await prisma.note.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: 'desc' }
    });
    console.log('[NOTES_GET] Successfully fetched notes:', notes.length);

    return NextResponse.json(notes);
  } catch (error: any) {
    console.error('[NOTES_GET] Detailed error:', {
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

export async function POST(req: Request) {
  try {
    console.log('[NOTES_POST] Checking authentication...');
    const session = await auth();
    if (!session?.user?.id) {
      console.error('[NOTES_POST] Unauthorized: No user session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true }
    });

    if (!user) {
      console.error('[NOTES_POST] User not found in database:', session.user.id);
      return NextResponse.json(
        { error: 'Unauthorized', details: 'User not found' },
        { status: 401 }
      );
    }

    const json = await req.json();
    const { title, content } = json;

    if (!title) {
      console.error('[NOTES_POST] Missing title');
      return NextResponse.json(
        { error: 'Bad Request', details: 'Title is required' },
        { status: 400 }
      );
    }

    console.log('[NOTES_POST] Creating note for user:', session.user.id);
    const note = await prisma.note.create({
      data: {
        title,
        content: content || '',
        userId: user.id, // Use verified user ID
        tags: [],
        references: [],
        important: false
      }
    });
    console.log('[NOTES_POST] Successfully created note:', note.id);

    return NextResponse.json(note);
  } catch (error: any) {
    console.error('[NOTES_POST] Detailed error:', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
      code: error?.code
    });

    // Handle Prisma errors
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Conflict', details: 'A note with this title already exists' },
        { status: 409 }
      );
    }

    if (error?.code === 'P2003') {
      return NextResponse.json(
        { error: 'Invalid User', details: 'User account not properly set up' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal error', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
} 