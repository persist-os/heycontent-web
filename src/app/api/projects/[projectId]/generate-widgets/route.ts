import { NextRequest, NextResponse } from 'next/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/convex/_generated/api'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await context.params
    const body = await request.json()
    const { fingerprint_id, project_id, user_preferences } = body

    // Get Firebase ID token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 })
    }

    const idToken = authHeader.split('Bearer ')[1]

    // Get user ID from Firebase token (like in chat route)
    let userId = null
    try {
      const admin = require('firebase-admin')
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          }),
        })
      }
      
      const decodedToken = await admin.auth().verifyIdToken(idToken)
      userId = decodedToken.uid
      console.log('Retrieved user ID:', userId)
    } catch (error) {
      console.error('Failed to verify Firebase token:', error)
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    // Get fingerprint data from Convex
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)
    let fingerprint_data = null
    
    if (fingerprint_id && userId) {
      try {
        console.log('Attempting to fetch fingerprint:', { 
          fingerprint_id, 
          userId,
          fingerprintIdType: typeof fingerprint_id,
          userIdType: typeof userId,
          projectId
        })
        
        // First try to get the fingerprint without userId validation for debugging
        try {
          const debugFingerprint = await convex.query(api.fingerprintQueries.getFingerprintById, {
            fingerprintId: fingerprint_id as any
          })
          console.log('Debug fingerprint (no userId validation):', debugFingerprint)
        } catch (debugError) {
          console.error('Debug fingerprint fetch failed:', debugError)
        }
        
        fingerprint_data = await convex.query(api.projectFingerprintQueries.getFingerprint, {
          fingerprintId: fingerprint_id as any,
          userId: userId
        })
        console.log('Retrieved fingerprint data:', fingerprint_data)
      } catch (error) {
        console.error('Failed to fetch fingerprint data:', error)
        console.error('Debug info:', { fingerprint_id, userId, projectId })
        return NextResponse.json(
          { error: 'Failed to fetch fingerprint data' },
          { status: 500 }
        )
      }
    }

    // Call the backend FastAPI service
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend.hicontent.co'
    const requestBody = {
      project_id: project_id || projectId,
      fingerprint_id,
      fingerprint_data,
      user_preferences: user_preferences || {}
    }
    
    console.log('Calling backend with:', {
      url: `${backendUrl}/api/v1/project-widgets/generate`,
      project_id: requestBody.project_id,
      fingerprint_id: requestBody.fingerprint_id,
      has_fingerprint_data: !!requestBody.fingerprint_data,
      fingerprint_data_keys: requestBody.fingerprint_data ? Object.keys(requestBody.fingerprint_data) : []
    })
    
    const response = await fetch(`${backendUrl}/api/v1/project-widgets/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Backend error:', errorText)
      return NextResponse.json(
        { error: 'Failed to generate widgets', details: errorText },
        { status: response.status }
      )
    }

    const result = await response.json()
    return NextResponse.json(result)

  } catch (error) {
    console.error('Error in generate-widgets API route:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}