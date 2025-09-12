import { NextResponse } from 'next/server';
import { extractAuthInfo } from '@/app/lib/api-helpers-server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function POST(
  request: Request,
  context: { params: any }
) {
  const requestId = Math.random().toString(36).substring(7);
  try {
    const paramsObj = await (context as any).params;
    const projectId: string = paramsObj?.projectId;
    // Get Firebase ID token from Authorization header
    const authHeader = request.headers.get('Authorization');
    const idToken = authHeader?.startsWith('Bearer ')
      ? authHeader.split(' ', 2)[1]
      : undefined;
    if (!idToken) {
      return NextResponse.json({ error: 'Unauthorized - Missing Firebase ID token' }, { status: 401 });
    }

    // Extract userId from Firebase ID token
    let userId = null;
    try {
      const admin = require('firebase-admin');
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          }),
        });
      }
      
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      userId = decodedToken.uid;
      console.log(`[process-message:${requestId}] Retrieved user ID:`, userId);
    } catch (error) {
      console.error(`[process-message:${requestId}] Failed to verify Firebase token:`, error);
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { message, conversationHistory } = body;
    if (!message || !conversationHistory) {
      return NextResponse.json({ error: 'message and conversationHistory are required' }, { status: 400 });
    }

    // Prepare conversation transcript for the backend with normalization
    const toStringSafe = (val: any) => {
      if (val == null) return ''
      if (typeof val === 'string') return val
      try { return JSON.stringify(val) } catch { return String(val) }
    }
    const toNumberSafe = (val: any) => {
      if (typeof val === 'number' && Number.isFinite(val)) return val
      const n = Number(val)
      return Number.isFinite(n) ? n : Date.now()
    }
    const conversationTranscript = conversationHistory.map((msg: any) => ({
      role: toStringSafe(msg.role),
      content: toStringSafe(msg.content),
      timestamp: toNumberSafe(msg.timestamp)
    }));

    // Add the current message to the transcript
    conversationTranscript.push({
      role: toStringSafe(message.role),
      content: toStringSafe(message.content),
      timestamp: toNumberSafe(message.timestamp)
    });

    // Get the actual project name from Convex
    let projectName = 'Creating a small OS'; // Default fallback
    let projectDescription = 'Developing a small operating system from scratch'; // Default fallback
    
    try {
      const project = await convex.query(api.projectsQueries.getProjectById, {
        projectId: projectId as any
      });
      if (project) {
        projectName = project.name || projectName;
        projectDescription = `Project: ${projectName}`;
      }
    } catch (error) {
      console.warn(`[process-message:${requestId}] Could not fetch project name:`, error);
    }

    // Call backend: simplified flow expects backend to accept the full transcript and return a fingerprint immediately
    console.log(`[process-message:${requestId}] calling backend`, {
      backendUrl: `${BACKEND_URL}/api/v1/project-fingerprint/generate`,
      projectId,
      projectName,
      projectDescription,
      transcriptLen: conversationTranscript.length,
      hasIdToken: !!idToken,
      conversationPreview: conversationTranscript.slice(-3).map(msg => `${msg.role}: ${msg.content.slice(0, 100)}...`)
    })
    const response = await fetch(`${BACKEND_URL}/api/v1/project-fingerprint/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        // Backend expects Firebase token
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({
        project_id: projectId,
        project_name: projectName,
        project_description: projectDescription,
        conversation_transcript: conversationTranscript,
        user_context: {
          user_id: userId,
          project_id: projectId
        }
      })
    });

    if (!response.ok) {
      // Read raw text to capture FastAPI 422 validation details reliably
      const errorText = await response.text();
      let errorJson: any = null;
      try { errorJson = JSON.parse(errorText); } catch {}
      console.error(`[process-message:${requestId}] backend error`, {
        status: response.status,
        errorJson,
        errorText
      })
      return NextResponse.json({ error: errorJson?.error || errorJson?.detail || errorText || 'Backend error' }, { status: response.status });
    }

    const result = await response.json();
    console.log(`[process-message:${requestId}] backend success`, {
      success: result?.success,
      hasFingerprint: !!result?.fingerprint_data
    })

    // Return minimal response used by simplified flow
    return NextResponse.json({
      success: result.success,
      data: {
        finalFingerprint: result.fingerprint_data
      }
    });
  } catch (error) {
    console.error(`[process-message:${requestId}] exception`, error);
    return NextResponse.json({ error: (error as Error).message || 'Internal server error' }, { status: 500 });
  }
}
