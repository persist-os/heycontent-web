import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user exists, if not create them
    let user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user && session.user.email) {
      user = await prisma.user.create({
        data: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name || null
        }
      });
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const notes = await prisma.note.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

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

    // Check if user exists, if not create them
    let user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user && session.user.email) {
      user = await prisma.user.create({
        data: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name || null
        }
      });
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const json = await req.json();
    const { title, content, important, tags, references } = json;

    const note = await prisma.note.create({
      data: {
        userId: session.user.id,
        title: title || 'Untitled Note',
        content: content || '',
        important: important || false,
        tags: tags || [],
        references: references || []
      }
    });

    return NextResponse.json(note);
  } catch (error: any) {
    console.error('[NOTES_POST]', error);
    return NextResponse.json(
      { error: 'Internal error', details: error?.message },
      { status: 500 }
    );
  }
} 