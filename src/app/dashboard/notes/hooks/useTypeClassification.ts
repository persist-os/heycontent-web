import { useState } from 'react';
import { getApiKey } from '@/app/lib/api-helpers';

export interface TypeClassificationRequest {
  content: string;
  platform?: string;
  noteId?: string;
}

export interface TypeClassificationResponse {
  success: boolean;
  type: string;
  confidence: number;
  reasoning: string;
  message: string;
  typeGenerated?: boolean;
}

export function useTypeClassification() {
  const [isClassifying, setIsClassifying] = useState(false);

  const classifyType = async (request: TypeClassificationRequest): Promise<TypeClassificationResponse> => {
    console.log('🔍 [useTypeClassification] classifyType called with:', {
      contentLength: request.content?.length || 0,
      contentPreview: request.content?.substring(0, 100) + "...",
      platform: request.platform,
      noteId: request.noteId
    });
    
    if (!request.content || request.content.trim().length < 5) {
      console.log('⚠️ [useTypeClassification] Content too short, returning default:', {
        contentLength: request.content?.length || 0,
        threshold: 5
      });
      return {
        success: false,
        type: 'idea_bank',
        confidence: 0,
        reasoning: 'Content too short for classification',
        message: 'Content must be at least 5 characters long',
        typeGenerated: false,
      };
    }

    try {
      setIsClassifying(true);
      console.log('📤 [useTypeClassification] Making API call to classify-type endpoint');
      
      const apiKey = await getApiKey();
      console.log('🔑 [useTypeClassification] API key obtained:', apiKey ? 'Yes' : 'No');
      
      const response = await fetch('/api/smart-note/ideas/classify-type', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(request),
      });

      console.log('📡 [useTypeClassification] API response status:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [useTypeClassification] API error response:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('📥 [useTypeClassification] API success response:', {
        success: result.success,
        type: result.type,
        confidence: result.confidence,
        reasoning: result.reasoning?.substring(0, 100) + "...",
        typeGenerated: result.typeGenerated,
        message: result.message
      });

      return result;
    } catch (error) {
      console.error('💥 [useTypeClassification] Error in classifyType:', error);
      return {
        success: false,
        type: 'idea_bank',
        confidence: 0,
        reasoning: `Classification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        message: 'Failed to classify note type',
        typeGenerated: false,
      };
    } finally {
      setIsClassifying(false);
      console.log('🏁 [useTypeClassification] Classification process completed');
    }
  };

  return {
    classifyType,
    isClassifying,
  };
} 