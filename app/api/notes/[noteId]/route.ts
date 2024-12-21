import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

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
    const { title, content, important, tags, references } = json;

    const note = await prisma.note.update({
      where: {
        id: params.noteId,
        userId: session.user.id
      },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(important !== undefined && { important }),
        ...(tags !== undefined && { tags }),
        ...(references !== undefined && { references })
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

    await prisma.note.delete({
      where: {
        id: params.noteId,
        userId: session.user.id
      }
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