import { NextResponse } from 'next/server';
import sharp from 'sharp';

export async function GET() {
  try {
    const svg = `
      <svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
        <rect width="1024" height="1024" fill="#4F46E5"/>
        <text x="512" y="512" font-family="Arial" font-size="200" fill="white" text-anchor="middle" dominant-baseline="middle">
          HeyContext
        </text>
      </svg>
    `;

    const buffer = await sharp(Buffer.from(svg))
      .png()
      .toBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Icon generation error:', error);
    return new NextResponse('Error generating icon', { status: 500 });
  }
} 