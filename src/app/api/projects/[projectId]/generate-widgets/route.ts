import { NextRequest, NextResponse } from 'next/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/convex/_generated/api'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await context.params
    const body = await request.json()
    const { fingerprint_id, project_id, user_preferences, check_fingerprint_only } = body

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

    // Get fingerprint data from Convex by project ID
    let fingerprint_data = null
    
    if (userId && projectId) {
      try {
        console.log('Attempting to fetch fingerprint by project:', { 
          projectId,
          userId,
          projectIdType: typeof projectId,
          userIdType: typeof userId,
          check_fingerprint_only
        })
        
        // Get fingerprint by project ID (this ensures we get the correct fingerprint for this project)
        fingerprint_data = await convex.query(api.projectFingerprintQueries.getFingerprintByProject, {
          projectId: projectId as any,
          userId: userId
        })
        console.log('Retrieved fingerprint data by project:', fingerprint_data)
        
        // If this is just a fingerprint check, return early
        if (check_fingerprint_only) {
          return NextResponse.json({
            success: true,
            fingerprint_exists: !!fingerprint_data,
            fingerprint_id: fingerprint_data?._id || null
          })
        }
        
        if (!fingerprint_data) {
          console.error('No fingerprint found for project:', { projectId, userId })
          return NextResponse.json(
            { 
              error: 'No fingerprint found for this project. Please complete the project discovery first.',
              success: false,
              fingerprint_exists: false
            },
            { status: 404 }
          )
        }
      } catch (error) {
        console.error('Failed to fetch fingerprint data by project:', error)
        console.error('Debug info:', { projectId, userId })
        return NextResponse.json(
          { 
            error: 'Failed to fetch fingerprint data',
            success: false,
            fingerprint_exists: false
          },
          { status: 500 }
        )
      }
    }

    // Call the backend FastAPI service
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend.hicontent.co'
    const requestBody = {
      project_id: project_id || projectId,
      fingerprint_id: fingerprint_data?._id || fingerprint_id, // Use the actual fingerprint ID from the data
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