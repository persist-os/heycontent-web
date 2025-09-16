/**
 * Generic markdown converter for persona traces and insights
 * Converts complex persona data structures into readable markdown format
 */

export interface PersonaTrace {
  _id?: string;
  trace_type: string;
  verbatim_quote?: string;
  extracted_insight: string;
  confidence: number;
  context: string;
  temporal_weight?: number;
  preference_strength?: number;
  created_at?: number;
  _creationTime?: number;
  metadata?: any;
}

export interface CrystallizedInsight {
  _id?: string;
  insight_type: string;
  crystallized_insight: string;
  confidence: number;
  temporal_stability?: number;
  contexts?: string[];
  last_observed?: number;
  created_at?: number;
  _creationTime?: number;
  supporting_traces?: any[];
  evolution_history?: any[];
  metadata?: any;
}

export interface MarkdownOptions {
  showMetadata?: boolean;
  showConfidence?: boolean;
  showTimestamps?: boolean;
  maxQuoteLength?: number;
  compactMode?: boolean;
}

const DEFAULT_OPTIONS: MarkdownOptions = {
  showMetadata: false,
  showConfidence: true,
  showTimestamps: false,
  maxQuoteLength: 150,
  compactMode: false
};

/**
 * Format a confidence score as a percentage with visual indicator
 */
function formatConfidence(confidence: number): string {
  const percentage = Math.round(confidence * 100);
  const indicator = percentage >= 80 ? '🟢' : percentage >= 60 ? '🟡' : '🔴';
  return `${indicator} ${percentage}%`;
}

/**
 * Format a timestamp into a human-readable date
 */
function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000); // Convert Convex timestamp to JS timestamp
  return date.toLocaleString();
}

/**
 * Truncate text to a maximum length with ellipsis
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Escape special markdown characters
 */
function escapeMarkdown(text: string): string {
  return text.replace(/([*_`~[\]()#+-=|{}!])/g, '\\$1');
}

/**
 * Convert a single persona trace to markdown
 */
export function convertTraceToMarkdown(trace: PersonaTrace, options: MarkdownOptions = {}): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const lines: string[] = [];

  // Header with trace type and confidence
  const confidence = opts.showConfidence ? ` ${formatConfidence(trace.confidence)}` : '';
  lines.push(`### ${trace.trace_type}${confidence}`);
  lines.push('');

  // Verbatim quote (highlighted)
  if (trace.verbatim_quote) {
    const quote = opts.maxQuoteLength 
      ? truncateText(trace.verbatim_quote, opts.maxQuoteLength)
      : trace.verbatim_quote;
    lines.push(`> *"${escapeMarkdown(quote)}"*`);
    lines.push('');
  }

  // Extracted insight
  lines.push(`**Insight:** ${escapeMarkdown(trace.extracted_insight)}`);
  lines.push('');

  // Context
  if (trace.context) {
    const context = opts.compactMode 
      ? truncateText(trace.context, 100)
      : trace.context;
    lines.push(`**Context:** ${escapeMarkdown(context)}`);
    lines.push('');
  }

  // Metadata (if enabled)
  if (opts.showMetadata) {
    if (trace.temporal_weight !== undefined) {
      lines.push(`**Temporal Weight:** ${trace.temporal_weight.toFixed(2)}`);
    }
    if (trace.preference_strength !== undefined) {
      lines.push(`**Preference Strength:** ${trace.preference_strength.toFixed(2)}`);
    }
    if (opts.showTimestamps && (trace.created_at || trace._creationTime)) {
      const timestamp = trace.created_at || trace._creationTime!;
      lines.push(`**Created:** ${formatTimestamp(timestamp)}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Convert a single crystallized insight to markdown
 */
export function convertInsightToMarkdown(insight: CrystallizedInsight, options: MarkdownOptions = {}): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const lines: string[] = [];

  // Header with insight type and confidence
  const confidence = opts.showConfidence ? ` ${formatConfidence(insight.confidence)}` : '';
  lines.push(`### ${insight.insight_type}${confidence}`);
  lines.push('');

  // Crystallized insight
  lines.push(`**Insight:** ${escapeMarkdown(insight.crystallized_insight)}`);
  lines.push('');

  // Contexts
  if (insight.contexts && insight.contexts.length > 0) {
    const contexts = insight.contexts.slice(0, 3).join(', '); // Show first 3 contexts
    lines.push(`**Contexts:** ${escapeMarkdown(contexts)}`);
    lines.push('');
  }

  // Metadata (if enabled)
  if (opts.showMetadata) {
    if (insight.temporal_stability !== undefined) {
      lines.push(`**Stability:** ${formatConfidence(insight.temporal_stability)}`);
    }
    if (insight.supporting_traces && insight.supporting_traces.length > 0) {
      lines.push(`**Supporting Traces:** ${insight.supporting_traces.length}`);
    }
    if (opts.showTimestamps && insight.last_observed) {
      lines.push(`**Last Observed:** ${formatTimestamp(insight.last_observed)}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Convert multiple traces to markdown with sections
 */
export function convertTracesToMarkdown(traces: PersonaTrace[], options: MarkdownOptions = {}): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  if (traces.length === 0) {
    return '## Persona Traces\n\n*No traces available*\n';
  }

  const lines: string[] = [];
  lines.push(`## Persona Traces (${traces.length})`);
  lines.push('');

  // Group traces by type for better organization
  const tracesByType: Record<string, PersonaTrace[]> = {};
  traces.forEach(trace => {
    if (!tracesByType[trace.trace_type]) {
      tracesByType[trace.trace_type] = [];
    }
    tracesByType[trace.trace_type].push(trace);
  });

  // Show overview of trace types
  const typeOverview = Object.entries(tracesByType)
    .map(([type, typeTraces]) => `- **${type}:** ${typeTraces.length}`)
    .join('\n');
  
  lines.push('### Overview');
  lines.push(typeOverview);
  lines.push('');

  // Show recent traces (limit to prevent overwhelming display)
  lines.push('### Recent Traces');
  lines.push('');
  
  const recentTraces = traces.slice(0, opts.compactMode ? 5 : 10);
  recentTraces.forEach((trace, index) => {
    if (index > 0) lines.push('---\n');
    lines.push(convertTraceToMarkdown(trace, opts));
  });

  return lines.join('\n');
}

/**
 * Convert multiple insights to markdown with sections
 */
export function convertInsightsToMarkdown(insights: CrystallizedInsight[], options: MarkdownOptions = {}): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  if (insights.length === 0) {
    return '## Crystallized Insights\n\n*No insights available*\n';
  }

  const lines: string[] = [];
  lines.push(`## Crystallized Insights (${insights.length})`);
  lines.push('');

  // Group insights by type
  const insightsByType: Record<string, CrystallizedInsight[]> = {};
  insights.forEach(insight => {
    if (!insightsByType[insight.insight_type]) {
      insightsByType[insight.insight_type] = [];
    }
    insightsByType[insight.insight_type].push(insight);
  });

  // Show overview of insight types
  const typeOverview = Object.entries(insightsByType)
    .map(([type, typeInsights]) => {
      const avgConfidence = typeInsights.reduce((sum, i) => sum + i.confidence, 0) / typeInsights.length;
      return `- **${type}:** ${typeInsights.length} (avg confidence: ${formatConfidence(avgConfidence)})`;
    })
    .join('\n');
  
  lines.push('### Overview');
  lines.push(typeOverview);
  lines.push('');

  // Show insights organized by type
  Object.entries(insightsByType).forEach(([type, typeInsights]) => {
    lines.push(`### ${type}`);
    lines.push('');
    
    typeInsights.forEach((insight, index) => {
      if (index > 0) lines.push('---\n');
      lines.push(convertInsightToMarkdown(insight, opts));
    });
  });

  return lines.join('\n');
}

/**
 * Convert a complete persona profile to markdown
 */
export function convertPersonaProfileToMarkdown(profile: {
  recent_traces: PersonaTrace[];
  crystallized_insights: CrystallizedInsight[];
  confidence_scores?: { overall: number; by_category?: Record<string, number> };
  profile_completeness?: number;
  summary?: {
    total_traces: number;
    total_insights: number;
    top_categories: string[];
    recent_activity: number;
  };
}, options: MarkdownOptions = {}): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const lines: string[] = [];

  // Profile overview
  lines.push('# Persona Profile');
  lines.push('');

  if (profile.summary) {
    lines.push('## Summary');
    lines.push(`- **Total Traces:** ${profile.summary.total_traces}`);
    lines.push(`- **Total Insights:** ${profile.summary.total_insights}`);
    if (profile.profile_completeness !== undefined) {
      lines.push(`- **Profile Completeness:** ${formatConfidence(profile.profile_completeness)}`);
    }
    if (profile.confidence_scores?.overall !== undefined) {
      lines.push(`- **Overall Confidence:** ${formatConfidence(profile.confidence_scores.overall)}`);
    }
    lines.push(`- **Recent Activity:** ${profile.summary.recent_activity} traces in last 7 days`);
    
    if (profile.summary.top_categories.length > 0) {
      lines.push(`- **Top Categories:** ${profile.summary.top_categories.slice(0, 3).join(', ')}`);
    }
    lines.push('');
  }

  // Crystallized insights first (most important)
  lines.push(convertInsightsToMarkdown(profile.crystallized_insights, opts));
  lines.push('\n');

  // Recent traces
  lines.push(convertTracesToMarkdown(profile.recent_traces, opts));

  return lines.join('\n');
}

/**
 * Copy text to clipboard (client-side only)
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}
