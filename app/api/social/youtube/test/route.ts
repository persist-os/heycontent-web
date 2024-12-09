import { NextResponse } from 'next/server';

export async function GET() {
  console.log('YouTube test route hit');
  return NextResponse.json({ message: 'YouTube test route working' });
} 