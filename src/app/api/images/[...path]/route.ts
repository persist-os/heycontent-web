import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';
import path from 'path';

// Initialize Google Cloud Storage client using the same credentials as Firebase
const storage = new Storage({
  projectId: 'content-454219',
  keyFilename: path.join(process.cwd(), 'firebase_key.json'),
});
const BUCKET_NAME = 'smart-notes-image-upload';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Reconstruct the full path from the dynamic segments
    const imagePath = params.path.join('/');
    
    console.log(`[Image Proxy] Serving image: ${imagePath}`);
    
    // Get the file from Google Cloud Storage
    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(imagePath);
    
    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      console.log(`[Image Proxy] File not found: ${imagePath}`);
      return new NextResponse('Image not found', { status: 404 });
    }
    
    // Get file metadata
    const [metadata] = await file.getMetadata();
    const contentType = metadata.contentType || 'image/jpeg';
    
    // Stream the file
    const stream = file.createReadStream();
    
    // Convert stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    
    // Return the image with proper headers
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
        'Content-Length': buffer.length.toString(),
      },
    });
    
  } catch (error) {
    console.error('[Image Proxy] Error serving image:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 