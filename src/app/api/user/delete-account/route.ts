import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, token } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication token is required' },
        { status: 401 }
      );
    }

    // Call backend to delete account (cancels Stripe subscription and customer)
    const response = await fetch(`${BACKEND_URL}/api/v1/api/user/delete-account`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ userId }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false, 
          error: data.detail || 'Failed to delete account in backend',
          details: data
        },
        { status: response.status }
      );
    }

    // Return success with details about what was deleted
    return NextResponse.json({
      success: true,
      message: data.message,
      details: data.details,
      errors: data.errors,
    });

  } catch (error: any) {
    console.error('Error in delete-account API route:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}

