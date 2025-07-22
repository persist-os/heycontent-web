import { FormatTextParams, insertAtCursor } from './formatting-utils'
import { getApiKey } from '@/app/lib/api-helpers'

export interface AIHandlers {
  onAskAI?: (prompt: string) => Promise<string>
  onRequestAnalysis?: (noteType: string) => Promise<string>
  onRequestIdeas?: () => Promise<string[]>
}

// Refinement API interfaces
export interface RefinementRequest {
  refinement_type: string;
  selected_text: string;
  note_type: string;
  surrounding_context: {
    before_text: string;
    after_text: string;
    selection_position: {
      start_paragraph: number;
      end_paragraph: number;
      paragraph_total: number;
      is_full_paragraph: boolean;
    };
    note_title?: string;
  };
  refinement_intensity?: 'light' | 'medium' | 'heavy';
}

export interface RefinementResponse {
  refined_text: string;
  confidence_score: number;
  changes_summary: string;
  change_count: {
    words_added: number;
    words_removed: number;
    words_modified: number;
    total_changes: number;
  };
  preservation_notes?: string;
}

export interface RefinementError extends Error {
  type: 'network' | 'validation' | 'authentication' | 'timeout' | 'unknown';
  retry?: boolean;
}

// Context preparation function
const prepareRefinementContext = (
  fullContent: string,
  selectedText: string,
  selectionStart: number,
  selectionEnd: number,
  noteTitle?: string
): RefinementRequest['surrounding_context'] => {
  // Split content into paragraphs (handle both double and single newlines)
  const paragraphs = fullContent.split(/\n\s*\n|\n/).filter(p => p.trim().length > 0);
  
  // Find which paragraph(s) contain the selected text
  let startParagraph = -1;
  let endParagraph = -1;
  let charCount = 0;
  
  for (let i = 0; i < paragraphs.length; i++) {
    const paragraphStart = charCount;
    const paragraphEnd = charCount + paragraphs[i].length;
    
    // Check if selection starts in this paragraph
    if (startParagraph === -1 && selectionStart >= paragraphStart && selectionStart <= paragraphEnd) {
      startParagraph = i;
    }
    
    // Check if selection ends in this paragraph
    if (selectionEnd >= paragraphStart && selectionEnd <= paragraphEnd) {
      endParagraph = i;
    }
    
    charCount = paragraphEnd + 1; // +1 for the newline
  }
  
  // Fallback: if selection not found in paragraphs, estimate based on character position
  if (startParagraph === -1 || endParagraph === -1) {
    const contentBeforeSelection = fullContent.substring(0, selectionStart);
    const paragraphsBeforeSelection = contentBeforeSelection.split(/\n\s*\n|\n/).length - 1;
    // 🎯 FIX: Ensure paragraph indices never exceed valid range (0 to paragraphs.length - 1)
    startParagraph = Math.max(0, Math.min(paragraphsBeforeSelection, paragraphs.length - 1));
    endParagraph = startParagraph;
  }
  
  // Determine if selection spans full paragraph(s)
  const isFullParagraph = startParagraph === endParagraph && 
    paragraphs[startParagraph] && 
    selectedText.trim() === paragraphs[startParagraph].trim();
  
  // Extract context: 1-2 paragraphs before and after
  const contextBefore = Math.max(0, startParagraph - 2);
  const contextAfter = Math.min(paragraphs.length - 1, endParagraph + 2);
  
  const beforeParagraphs = paragraphs.slice(contextBefore, startParagraph);
  const afterParagraphs = paragraphs.slice(endParagraph + 1, contextAfter + 1);
  
  const beforeText = beforeParagraphs.join('\n\n').trim();
  const afterText = afterParagraphs.join('\n\n').trim();
  
  // 🎯 VALIDATION: Ensure paragraph indices are within valid bounds
  const maxValidIndex = paragraphs.length - 1;
  const validStartParagraph = Math.max(0, Math.min(startParagraph, maxValidIndex));
  const validEndParagraph = Math.max(0, Math.min(endParagraph, maxValidIndex));
  
  // Debug logging for paragraph position issues
  if (validStartParagraph !== startParagraph || validEndParagraph !== endParagraph) {
    console.warn('🎯 Paragraph indices clamped to valid range:', {
      original: { start: startParagraph, end: endParagraph },
      clamped: { start: validStartParagraph, end: validEndParagraph },
      totalParagraphs: paragraphs.length,
      maxValidIndex
    });
  }
  
  return {
    before_text: beforeText,
    after_text: afterText,
    selection_position: {
      start_paragraph: validStartParagraph,
      end_paragraph: validEndParagraph,
      paragraph_total: paragraphs.length,
      is_full_paragraph: isFullParagraph,
    },
    note_title: noteTitle,
  };
};

// Refinement API call function
export const callRefinementAPI = async (
  refinementType: string,
  selectedText: string,
  noteType: string,
  fullContent: string,
  selectionStart: number,
  selectionEnd: number,
  noteTitle?: string,
  intensity: 'light' | 'medium' | 'heavy' = 'medium'
): Promise<RefinementResponse> => {
  try {
    // Get API key for authentication
    const apiKey = await getApiKey();
    if (!apiKey) {
      const error = new Error('You are not authenticated. Please log in again.') as RefinementError;
      error.type = 'authentication';
      error.retry = false;
      throw error;
    }

    // Prepare structured context
    const surroundingContext = prepareRefinementContext(
      fullContent,
      selectedText,
      selectionStart,
      selectionEnd,
      noteTitle
    );

    // Build the request payload
    const requestPayload: RefinementRequest = {
      refinement_type: refinementType,
      selected_text: selectedText,
      note_type: noteType,
      surrounding_context: surroundingContext,
      refinement_intensity: intensity,
    };

    // Make the API call with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch('/api/smart_note_inline/refine-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          const error = new Error('Authentication failed. Please log in again.') as RefinementError;
          error.type = 'authentication';
          error.retry = false;
          throw error;
        } else if (response.status === 400) {
          const errorData = await response.json().catch(() => ({}));
          const error = new Error(errorData.error || 'Invalid refinement request') as RefinementError;
          error.type = 'validation';
          error.retry = false;
          throw error;
        } else if (response.status >= 500) {
          const error = new Error('Server error. Please try again.') as RefinementError;
          error.type = 'network';
          error.retry = true;
          throw error;
        } else {
          const error = new Error(`HTTP ${response.status}: ${response.statusText}`) as RefinementError;
          error.type = 'network';
          error.retry = true;
          throw error;
        }
      }

      const response_data = await response.json();

      // Extract the actual refinement data from the wrapper
      const data = response_data.data || response_data;

      // Validate response structure
      if (!data.refined_text || typeof data.refined_text !== 'string') {
        const error = new Error('Invalid response from refinement service') as RefinementError;
        error.type = 'validation';
        error.retry = true;
        throw error;
      }

      // Ensure refined text isn't empty or drastically different
      if (data.refined_text.trim().length === 0) {
        const error = new Error('Refinement resulted in empty text') as RefinementError;
        error.type = 'validation';
        error.retry = true;
        throw error;
      }

      // Check if text is drastically different (simple heuristic)
      const originalWords = selectedText.split(/\s+/).length;
      const refinedWords = data.refined_text.split(/\s+/).length;
      const lengthRatio = refinedWords / originalWords;
      
      if (lengthRatio > 3 || lengthRatio < 0.3) {
        console.warn('Refinement resulted in drastically different text length', {
          originalWords,
          refinedWords,
          ratio: lengthRatio,
          confidence_score: data.confidence_score
        });
      }

      // Return structured response with comprehensive validation
      return {
        refined_text: data.refined_text,
        confidence_score: typeof data.confidence_score === 'number' ? data.confidence_score : 0.8,
        changes_summary: data.changes_summary || 'Text has been refined',
        change_count: {
          words_added: data.change_count?.words_added || 0,
          words_removed: data.change_count?.words_removed || 0,
          words_modified: data.change_count?.words_modified || 0,
          total_changes: data.change_count?.total_changes || 1,
        },
        preservation_notes: data.preservation_notes,
      };

    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        const error = new Error('Request timed out. Please try again.') as RefinementError;
        error.type = 'timeout';
        error.retry = true;
        throw error;
      }
      
      throw fetchError;
    }

  } catch (error: any) {
    // Convert generic errors to RefinementError if not already
    if (!error.type) {
      const refinementError = new Error(error.message || 'Failed to refine text') as RefinementError;
      refinementError.type = 'unknown';
      refinementError.retry = true;
      throw refinementError;
    }
    
    throw error;
  }
};

// Enhanced AI handlers with fallbacks
export const createAIHandlers = (params: FormatTextParams, handlers: AIHandlers) => {
  const handleAskAI = async (prompt: string) => {
    if (handlers.onAskAI) {
      const response = await handlers.onAskAI(prompt)
      insertAtCursor(params, `\n\n${response}`)
    } else {
      insertAtCursor(params, `\n\n**AI Response to: "${prompt}"**\n\n[AI response would appear here]`)
    }
  }

  const handleRequestAnalysis = async (noteType: string) => {
    if (handlers.onRequestAnalysis) {
      const analysis = await handlers.onRequestAnalysis(noteType)
      insertAtCursor(params, `\n\n## Analysis\n\n${analysis}`)
    } else {
      insertAtCursor(params, `\n\n## Analysis (${noteType})\n\n[Analysis would appear here]`)
    }
  }

  const handleRequestIdeas = async () => {
    if (handlers.onRequestIdeas) {
      const ideas = await handlers.onRequestIdeas()
      const ideasText = ideas.map((idea, index) => `${index + 1}. ${idea}`).join('\n')
      insertAtCursor(params, `\n\n## Ideas\n\n${ideasText}`)
    } else {
      insertAtCursor(params, '\n\n## Ideas\n\n1. [Idea 1]\n2. [Idea 2]\n3. [Idea 3]')
    }
  }

  const handleGenerateTableFromContent = async () => {
    const tablePrompt = `Based on the following content, create a relevant and useful markdown table that organizes or summarizes key information. The table should have appropriate headers and meaningful data extracted from the content. If the content doesn't contain tabular data, create a summary table or analysis table that would be helpful for understanding the content.

Content:
${params.content}

Please respond with only the markdown table, no additional text.`

    if (handlers.onAskAI) {
      const response = await handlers.onAskAI(tablePrompt)
      insertAtCursor(params, `\n\n${response}`)
    } else {
      insertAtCursor(params, `\n\n| Column 1 | Column 2 | Column 3 |\n|----------|----------|----------|\n| Data 1   | Data 2   | Data 3   |\n| Data 4   | Data 5   | Data 6   |`)
    }
  }

  // Enhanced refinement handler with comprehensive error handling
  const handleRefineText = async (
    refinementType: string,
    selectedText: string,
    noteType: string,
    fullContent: string,
    selectionStart: number,
    selectionEnd: number,
    noteTitle?: string
  ): Promise<RefinementResponse> => {
    try {
      return await callRefinementAPI(
        refinementType,
        selectedText,
        noteType,
        fullContent,
        selectionStart,
        selectionEnd,
        noteTitle,
        'medium' // Default intensity
      );
    } catch (error: any) {
      const refinementError = error as RefinementError;
      
      // Log error for debugging
      console.error('Refinement failed:', {
        type: refinementError.type,
        message: refinementError.message,
        retry: refinementError.retry,
        refinementType,
        noteType,
        selectedTextLength: selectedText.length,
      });

      // Provide user-friendly error messages with improved fallback handling
      switch (refinementError.type) {
        case 'authentication':
          throw new Error('Please log in again to use text refinement');
        case 'validation':
          // For validation errors, try to provide helpful feedback
          if (refinementError.message.includes('refinement type') || refinementError.message.includes('Unsupported refinement type')) {
            console.warn('Unknown refinement type, backend should handle this with fallbacks now');
            throw new Error('This refinement type is not yet supported. Please try a different refinement option.');
          } else if (refinementError.message.includes('text too short') || refinementError.message.includes('text too long')) {
            // Length validation errors - these should be less common now with improved backend validation
            throw new Error('The selected text length is outside the expected range for this refinement type. Please try selecting different text.');
          } else if (refinementError.message.includes('empty') || refinementError.message.includes('cannot be empty')) {
            throw new Error('Please select some text to refine');
          } else {
            // Generic validation error
            throw new Error(refinementError.message || 'The selected text cannot be refined. Please try different text or refinement type.');
          }
        case 'network':
          throw new Error('Network error. Please check your connection and try again.');
        case 'timeout':
          throw new Error('Request timed out. Please try again with shorter text.');
        default:
          // For any other errors, try to be helpful
          const message = refinementError.message || 'Unable to refine text. Please try again.';
          throw new Error(message);
      }
    }
  }

  return {
    handleAskAI,
    handleRequestAnalysis,
    handleRequestIdeas,
    handleGenerateTableFromContent,
    handleRefineText
  }
} 