/**
 * Hash utility for Convex runtime
 * Uses a simple hash function compatible with Convex's JavaScript environment
 */

/**
 * Generate a simple but effective hash from a string
 * This is a FNV-1a hash implementation (fast, good distribution)
 */
export function hashString(str: string): string {
  let hash = 2166136261; // FNV offset basis
  
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619); // FNV prime
  }
  
  // Convert to positive number and then to hex string
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Generate a hash for translation cache lookup
 * Combines source text with a simple hash algorithm
 */
export function hashTranslationKey(sourceText: string): string {
  // For longer texts, sample from beginning, middle, and end for performance
  let textToHash = sourceText;
  
  if (sourceText.length > 1000) {
    const start = sourceText.substring(0, 300);
    const middle = sourceText.substring(Math.floor(sourceText.length / 2) - 150, Math.floor(sourceText.length / 2) + 150);
    const end = sourceText.substring(sourceText.length - 300);
    textToHash = start + middle + end;
  }
  
  return hashString(textToHash);
}

