/**
 * Markdown Processing Utilities
 * 
 * This module handles preprocessing of markdown content that comes from the backend
 * analysis APIs, particularly converting ~~~ delimiters to proper markdown formatting.
 */

/**
 * Process markdown content from backend analysis APIs
 * Converts ~~~ delimiters to proper markdown line breaks and formatting
 */
export function processAnalysisMarkdown(content: string): string {
  if (!content || typeof content !== 'string') {
    return content;
  }

  return content
    // Convert ~~~ delimiters to proper markdown line breaks
    .replace(/~~~+/g, '\n\n')
    // Clean up any double line breaks that might have been created
    .replace(/\n\n\n+/g, '\n\n')
    // Ensure proper spacing around headers
    .replace(/(\n##[^\n]*\n)/g, '\n\n$1\n')
    // Clean up any leading/trailing whitespace
    .trim();
}

/**
 * Check if content contains ~~~ delimiters that need processing
 */
export function needsMarkdownProcessing(content: string): boolean {
  return content && typeof content === 'string' && content.includes('~~~');
}

/**
 * Process content conditionally - only if it contains ~~~ delimiters
 */
export function processContentIfNeeded(content: string): string {
  if (needsMarkdownProcessing(content)) {
    return processAnalysisMarkdown(content);
  }
  return content;
} 