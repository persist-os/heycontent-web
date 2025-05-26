/**
 * Smart Note API client functions
 */

/**
 * Analyze a note's content using the SmartNoteGemini agent
 *
 * @param contentNote - The note content to analyze
 * @returns The analysis result
 */
export async function analyzeNoteContent(contentNote: string) {
  try {
    const response = await fetch('/api/smart-note/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content_note: contentNote }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || `Error analyzing note: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to analyze note content:', error);
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
