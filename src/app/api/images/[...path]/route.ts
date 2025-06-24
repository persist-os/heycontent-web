import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';

// Initialize storage with environment-based authentication
const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || 'content-454219',
  // Use service account from environment variable (JSON string)
  credentials: process.env.GOOGLE_CLOUD_CREDENTIALS_JSON ? 
    JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS_JSON) : 
    undefined,
});

const SMART_NOTES_BUCKET = 'smart-notes-image-upload';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    console.log('🖼️ [Image Proxy] Requesting:', params.path);
    
    const filePath = params.path.join('/');
    const bucket = storage.bucket(SMART_NOTES_BUCKET);
    const file = bucket.file(filePath);
    
    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      console.log('❌ [Image Proxy] File not found:', filePath);
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }
    
    // Download file
    const [buffer] = await file.download();
    const [metadata] = await file.getMetadata();
    
    console.log('✅ [Image Proxy] Serving image:', filePath, 'Size:', buffer.length);
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': metadata.contentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Cross-Origin-Resource-Policy': 'cross-origin',
      },
    });
  } catch (error) {
    console.error('❌ [Image Proxy] Error serving image:', error);
    return NextResponse.json({ 
      error: 'Failed to load image',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 