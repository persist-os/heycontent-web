import { NextResponse } from 'next/server';
import { adminAuth } from '@/app/lib/firebase-admin';
import { fetchQuery, fetchAction } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export async function POST(request: Request) {
  try {
    console.log('Convex debug endpoint called');

    // Get the token from the request
    const { token, operation } = await request.json();
    const authHeader = request.headers.get('Authorization');

    if (!token && (!authHeader || !authHeader.startsWith('Bearer '))) {
      console.log('No token provided');
      return NextResponse.json({
        error: 'No token provided',
        authHeader: authHeader ? 'Present' : 'Missing'
      }, { status: 400 });
    }

    // Use the token from the Authorization header if available
    const bearerToken = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : token;

    // Verify the token with Firebase Admin
    console.log('Verifying token with Firebase Admin...');
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(bearerToken);
      console.log('Token verified successfully for user:', decodedToken.uid);
    } catch (verifyError) {
      console.error('Token verification failed:', verifyError);
      return NextResponse.json({
        error: 'Invalid token',
        details: verifyError instanceof Error ? verifyError.message : 'Unknown error'
      }, { status: 401 });
    }

    // Perform the requested operation
    switch (operation) {
      case 'getUserInfo': {
        // Check if user exists in Convex
        console.log('Getting user info from Convex...');
        try {
          const convexUser = await fetchQuery(api.users.getUserById, { userId: decodedToken.uid });
          return NextResponse.json({
            success: true,
            user: convexUser
          });
        } catch (error) {
          console.error('Error getting user from Convex:', error);
          return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }, { status: 500 });
        }
      }

      case 'createUser': {
        // Create user in Convex
        console.log('Creating user in Convex...');
        try {
          await fetchAction(api.users.create, {
            userId: decodedToken.uid,
            name: decodedToken.name || 'Unknown User',
            email: decodedToken.email || '',
            image: decodedToken.picture || ''
          });
          
          // Fetch the user to confirm creation
          const convexUser = await fetchQuery(api.users.getUserById, { userId: decodedToken.uid });
          
          return NextResponse.json({
            success: true,
            message: 'User created successfully',
            user: convexUser
          });
        } catch (error) {
          console.error('Error creating user in Convex:', error);
          return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }, { status: 500 });
        }
      }

      case 'updateUser': {
        // Update user in Convex
        console.log('Updating user in Convex...');
        try {
          await fetchAction(api.auth.updateUser, {
            userId: decodedToken.uid,
            name: decodedToken.name || 'Updated User',
            email: decodedToken.email || '',
            image: decodedToken.picture || ''
          });
          
          // Fetch the user to confirm update
          const convexUser = await fetchQuery(api.users.getUserById, { userId: decodedToken.uid });
          
          return NextResponse.json({
            success: true,
            message: 'User updated successfully',
            user: convexUser
          });
        } catch (error) {
          console.error('Error updating user in Convex:', error);
          return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }, { status: 500 });
        }
      }

      case 'getConnectionStatus': {
        // Get social connection status
        console.log('Getting connection status from Convex...');
        try {
          const connectionStatus = await fetchQuery(api.social.getConnectionStatus, { 
            userId: decodedToken.uid 
          });
          
          return NextResponse.json({
            success: true,
            connectionStatus
          });
        } catch (error) {
          console.error('Error getting connection status from Convex:', error);
          return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }, { status: 500 });
        }
      }

      case 'getGmailData': {
        // Get Gmail data
        console.log('Getting Gmail data from Convex...');
        try {
          const gmailData = await fetchQuery(api.query.getAllGmailData);
          
          return NextResponse.json({
            success: true,
            gmailData
          });
        } catch (error) {
          console.error('Error getting Gmail data from Convex:', error);
          return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }, { status: 500 });
        }
      }

      case 'getYoutubeData': {
        // Get YouTube data
        console.log('Getting YouTube data from Convex...');
        try {
          const youtubeData = await fetchQuery(api.query.getAllYouTubeData);
          
          return NextResponse.json({
            success: true,
            youtubeData
          });
        } catch (error) {
          console.error('Error getting YouTube data from Convex:', error);
          return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }, { status: 500 });
        }
      }

      case 'testConnection': {
        // Test Convex connection
        console.log('Testing Convex connection...');
        try {
          // Try to get all users as a simple connection test
          const users = await fetchQuery(api.users.list);
          
          return NextResponse.json({
            success: true,
            message: 'Convex connection successful',
            userCount: users.length
          });
        } catch (error) {
          console.error('Error testing Convex connection:', error);
          return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }, { status: 500 });
        }
      }

      default:
        return NextResponse.json({
          error: 'Invalid operation',
          validOperations: [
            'getUserInfo', 
            'createUser', 
            'updateUser', 
            'getConnectionStatus', 
            'getGmailData', 
            'getYoutubeData',
            'testConnection'
          ]
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Convex debug error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
