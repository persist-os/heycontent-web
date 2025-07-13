/**
 * Clean impact string by removing "Impact:" prefix if present
 */
export function cleanImpactString(impact: string): string {
  if (!impact) return '';
  return impact.replace(/^Impact:\s*/i, '').trim();
}

/**
 * Format impact string with "Impact:" prefix for display
 */
export function formatImpactString(impact: string): string {
  if (!impact) return '';
  const cleaned = cleanImpactString(impact);
  return `Impact: ${cleaned}`;
}

/**
 * Normalize impact string - clean it and ensure consistent format
 */
export function normalizeImpactString(impact: string): string {
  return cleanImpactString(impact);
} 