import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function POST(request: Request) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  try {
    // Get API key from Authorization header
    const authHeader = request.headers.get('Authorization');
    const apiKey = authHeader?.replace('Bearer ', '').trim();
    
    if (!apiKey) {
      console.warn(`[${requestId}] Authentication failed: No Authorization header or invalid format`);
      return NextResponse.json({ error: 'Unauthorized - Missing or invalid Authorization header' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      refinement_type, 
      selected_text, 
      note_type, 
      surrounding_context, 
      refinement_intensity 
    } = body;
    
    if (!refinement_type || !selected_text) {
      console.warn(`[${requestId}] Invalid request: Missing required fields`);
      return NextResponse.json({ 
        error: 'refinement_type and selected_text are required', 
        status: 400 
      }, { status: 400 });
    }

    if (!surrounding_context || !surrounding_context.selection_position) {
      console.warn(`[${requestId}] Invalid request: Missing surrounding_context or selection_position`);
      return NextResponse.json({ 
        error: 'surrounding_context with selection_position is required', 
        status: 400 
      }, { status: 400 });
    }

    // Prepare payload for backend
    const payload = {
      refinement_type,
      selected_text,
      note_type: note_type || 'general',
      surrounding_context: {
        before_text: surrounding_context.before_text || '',
        after_text: surrounding_context.after_text || '',
        selection_position: {
          start_paragraph: surrounding_context.selection_position.start_paragraph || 0,
          end_paragraph: surrounding_context.selection_position.end_paragraph || 0,
          paragraph_total: surrounding_context.selection_position.paragraph_total || 1,
          is_full_paragraph: surrounding_context.selection_position.is_full_paragraph || false
        },
        note_title: surrounding_context.note_title || null
      },
      refinement_intensity: refinement_intensity || 'medium'
    };

    const headersToSend = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };

    const response = await fetch(`${BACKEND_URL}/api/v1/smart-notes/refine-text`, {
      method: 'POST',
      headers: headersToSend,
      body: JSON.stringify(payload)
    });

    let backendData = null;
    try {
      backendData = await response.clone().json();
    } catch (jsonErr) {
      // Handle non-JSON responses gracefully
    }

    if (!response.ok) {
      // Try to get error details from backend response with improved error handling
      let errorMessage = `Backend API responded with status: ${response.status} (${response.statusText})`;
      
      if (backendData && backendData.detail) {
        // Handle new structured error format
        if (typeof backendData.detail === 'object' && backendData.detail.message) {
          // Handle validation failures more gracefully
          if (backendData.detail.error_type === 'validation_failure' && backendData.detail.recoverable) {
            // For recoverable validation failures (like text length), provide original text as fallback
            const fallbackResponse = {
              refined_text: selected_text, // Return original text
              confidence_score: 0.0,
              changes_summary: 'No changes made - original text returned due to validation constraints',
              change_count: {
                words_added: 0,
                words_removed: 0,
                words_modified: 0,
                total_changes: 0
              },
              preservation_notes: 'Original text preserved due to length validation',
              success: true,
              fallback: true
            };
            
            return NextResponse.json(fallbackResponse);
          }
          
          errorMessage = backendData.detail.message;
        } else if (typeof backendData.detail === 'string') {
          errorMessage = backendData.detail;
          
          // Handle the specific case we were getting errors for
          if (errorMessage.includes('Unsupported refinement type')) {
            errorMessage = 'This refinement type is not yet supported. Please try a different option.';
          }
          
          // Handle text length validation failures
          if (errorMessage.includes('extremely short') || errorMessage.includes('absolute min')) {
            const fallbackResponse = {
              refined_text: selected_text, // Return original text
              confidence_score: 0.0,
              changes_summary: 'No changes made - text too short for refinement',
              change_count: {
                words_added: 0,
                words_removed: 0,
                words_modified: 0,
                total_changes: 0
              },
              preservation_notes: 'Original text preserved due to length constraints',
              success: true,
              fallback: true
            };
            
            return NextResponse.json(fallbackResponse);
          }
        } else {
          errorMessage = JSON.stringify(backendData.detail);
        }
      } else if (backendData && backendData.error) {
        errorMessage = backendData.error;
      }
      
      throw new Error(errorMessage);
    }

    const data = backendData;
    const refinementData = data.data || data;
    const totalDuration = Date.now() - startTime;

    console.info(`[${requestId}] Text refinement completed`, {
      duration_ms: totalDuration,
      refinement_type,
      selected_text_length: selected_text?.length || 0,
      refined_text_length: refinementData.refined_text?.length || 0,
      confidence_score: refinementData.confidence_score,
      total_changes: refinementData.change_count?.total_changes || 0
    });

    return NextResponse.json(refinementData);
  } catch (error: any) {
    const totalDuration = Date.now() - startTime;
    console.error(`[${requestId}] Text refinement failed`, {
      error: error.message,
      duration_ms: totalDuration
    });

    return NextResponse.json(
      { 
        error: 'Failed to refine text', 
        details: error.message,
        success: false
      }, 
      { status: 500 }
    );
  }
}
