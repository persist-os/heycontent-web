import { NextResponse } from 'next/server';
import { getApiKey } from '@/app/lib/api-helpers';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function GET(_req: Request, { params }: { params: { noteId: string } }) {
  try {
    const apiKey = await getApiKey();
    if (!apiKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const backendRes = await fetch(`${BACKEND_URL}/api/v1/smart-note/${params.noteId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error: any) {
    console.error('[NOTE_GET]', error);
    return NextResponse.json(
      { error: 'Internal error', details: error?.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request, { params }: { params: { noteId: string } }) {
  try {
    const apiKey = await getApiKey();
    if (!apiKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    let json: any = {};
    try {
      json = await req.json();
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    // Remove userId from the payload if present
    delete json.userId;
    const backendRes = await fetch(`${BACKEND_URL}/api/v1/smart-note/${params.noteId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(json)
    });
    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error: any) {
    console.error('[NOTE_PUT]', error);
    return NextResponse.json(
      { error: 'Internal error', details: error?.message },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, { params }: { params: { noteId: string } }) {
  try {
    const apiKey = await getApiKey();
    if (!apiKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const backendRes = await fetch(`${BACKEND_URL}/api/v1/smart-note/${params.noteId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error: any) {
    console.error('[NOTE_DELETE]', error);
    return NextResponse.json(
      { error: 'Internal error', details: error?.message },
      { status: 500 }
    );
  }
}