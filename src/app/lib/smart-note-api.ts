/**
 * Smart Note API client functions
 */

import { getApiKey } from '@/app/lib/api-helpers';

/**
 * Generate content ideas for a note using the SmartNoteGemini agent
 *
 * @param platform - The platform for which to generate ideas
 * @param limit - The number of ideas to generate
 * @returns The generated ideas
 */
export async function analyzeNoteContent(platform: string = 'general', limit: number = 5) {
  const apiKey = await getApiKey();
  if (!apiKey) throw new Error('No API key found. Please log in.');

  try {
    const response = await fetch('/api/smart-note/ideas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ platform, limit }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || `Error generating ideas: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to generate content ideas:', error);
    throw error;
  }
}

/**
 * Types for the smart note analysis response
 */
export interface SmartNoteAnalysisResponse {
  success: boolean;
  data: {
    status: string;
    analysis: SmartNoteAnalysis;
  };
  message: string;
  suggestedTitle?: string;
}

export interface SmartNoteAnalysis {
  contentStrategy: {
    overview: {
      category: string;
      coreIdea: string;
      contentType: string;
      stage: string;
    };
    marketAnalysis: {
      audience: {
        demographics: string;
        interests: string;
        psychographics: string;
      };
      competition: {
        direct: string;
        indirect: string;
        analysis: string;
      };
    };
  };
  platformStrategy: {
    platforms: Array<{
      name: string;
      rationale: string;
      contentType: string;
    }>;
    timing: Record<string, {
      postingSchedule: string;
      analysis: string;
    }>;
    optimization: Record<string, {
      strategy: string;
      tactics: string;
    }>;
  };
  productionPlan: {
    resources: {
      equipment: string;
      software: string;
      props: string;
      budget: string;
    };
    timeline: Record<string, {
      duration: string;
      goals: string;
      milestones: string;
    }>;
    team: Record<string, {
      roles: string;
      responsibilities: string;
    }>;
  };
  growthStrategy: {
    monetization: {
      options: string[];
      strategy: string;
    };
    audience: {
      growthTactics: string[];
      engagementMetrics: string;
    };
    projections: {
      followers: Record<string, string>;
      revenue: Record<string, string>;
    };
  };
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  metrics: {
    kpis: string[];
    targets: Record<string, string>;
    tracking: {
      tools: string;
      frequency: string;
    };
  };
}
