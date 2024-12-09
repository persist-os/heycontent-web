import { NextResponse } from 'next/server';
import { auth } from '@/app/auth';
import { prisma } from '@/lib/db';

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
  } catch (error) {
    console.error('[NOTE_PUT]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
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
  } catch (error) {
    console.error('[NOTE_DELETE]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
} 