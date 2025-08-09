/**
 * Email parsing utilities for cleaning and processing Gmail thread messages
 * Handles reply chain deduplication and content extraction
 */

interface ParsedEmail {
  cleanContent: string;
  originalContent: string;
  hasQuotedContent: boolean;
  quotedPortion?: string;
}

/**
 * Common patterns that indicate quoted/forwarded content in emails
 */
const QUOTE_PATTERNS = [
  // Gmail-style quotes - more comprehensive patterns
  /^On .+ wrote:$/m,
  /^On .+ <.+> wrote:$/m,
  /^On .+, .+ <.+> wrote:$/m,
  /^On .+\n.*wrote:$/m,  // Multi-line Gmail quotes
  /^On .+<.+>\nwrote:$/m, // Email on separate line from "wrote:"
  
  // Outlook-style quotes
  /^From: .+$/m,
  /^Sent: .+$/m,
  /^To: .+$/m,
  /^Subject: .+$/m,
  
  // Generic quote indicators
  /^> /m,
  /^>> /m,
  /^>>> /m,
  
  // Forward indicators
  /^-+ ?Forwarded message ?-+$/mi,
  /^-+ ?Original message ?-+$/mi,
  
  // Reply separators
  /^_{5,}$/m,
  /^-{5,}$/m,
  /^={5,}$/m,
];

/**
 * Extract the new content from an email by removing quoted/previous content
 */
export function extractNewEmailContent(content: string): ParsedEmail {
  if (!content || typeof content !== 'string') {
    return {
      cleanContent: '',
      originalContent: content || '',
      hasQuotedContent: false,
    };
  }

  const originalContent = content.trim();
  let cleanContent = originalContent;
  let hasQuotedContent = false;
  let quotedPortion: string | undefined;

  // First, try to find Gmail-style quote patterns using a simpler line-by-line approach
  // This is more reliable than complex regex patterns
  const lines = cleanContent.split('\n');
  let cutoffIndex = -1;
  
  // Look for lines that start with "On " and contain an email address
  // This indicates the start of quoted content
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('On ') && (line.includes('@') || line.includes('wrote:'))) {
      cutoffIndex = i;
      break;
    }
    // Also check if the next line contains "wrote:" (for multi-line Gmail quotes)
    if (line.startsWith('On ') && i + 1 < lines.length && lines[i + 1].trim() === 'wrote:') {
      cutoffIndex = i;
      break;
    }
  }
  
  let foundGmailQuote = false;
  if (cutoffIndex >= 0) {
    const cleanLines = lines.slice(0, cutoffIndex);
    const quotedLines = lines.slice(cutoffIndex);
    
    cleanContent = cleanLines.join('\n').trim();
    quotedPortion = quotedLines.join('\n').trim();
    hasQuotedContent = true;
    foundGmailQuote = true;
  }
  
  if (!foundGmailQuote) {
    // Try to find other quote patterns
    for (const pattern of QUOTE_PATTERNS) {
      const match = cleanContent.match(pattern);
      if (match) {
        const quoteStartIndex = match.index!;
        const beforeQuote = cleanContent.substring(0, quoteStartIndex).trim();
        const afterQuote = cleanContent.substring(quoteStartIndex).trim();
        
        if (beforeQuote.length > 0) {
          cleanContent = beforeQuote;
          quotedPortion = afterQuote;
          hasQuotedContent = true;
          break;
        }
      }
    }
  }

  // Additional cleanup: remove excessive whitespace and empty lines
  cleanContent = cleanContent
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n')
    .trim();

  return {
    cleanContent,
    originalContent,
    hasQuotedContent,
    quotedPortion,
  };
}

/**
 * Check if content from one email appears to be quoted in another email
 */
export function isContentQuoted(newContent: string, previousContent: string): boolean {
  if (!newContent || !previousContent) return false;
  
  // Normalize both contents for comparison
  const normalizeContent = (content: string) => 
    content.toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '')
      .trim();
  
  const normalizedNew = normalizeContent(newContent);
  const normalizedPrevious = normalizeContent(previousContent);
  
  // Check if previous content appears in the new content
  // We use a threshold to account for minor formatting differences
  if (normalizedPrevious.length < 10) return false; // Too short to be meaningful
  
  return normalizedNew.includes(normalizedPrevious);
}

/**
 * Process a thread of emails to remove redundant quoted content
 */
export function deduplicateEmailThread(messages: Array<{
  id: string;
  body: string;
  timestamp: number;
  [key: string]: any;
}>): Array<{
  id: string;
  body: string;
  cleanBody: string;
  timestamp: number;
  hasQuotedContent: boolean;
  [key: string]: any;
}> {
  if (!messages || messages.length === 0) return [];
  
  // Sort messages by timestamp to process chronologically
  const sortedMessages = [...messages].sort((a, b) => a.timestamp - b.timestamp);
  const processedMessages = [];
  const seenContent = new Set<string>();
  
  for (const message of sortedMessages) {
    const parsed = extractNewEmailContent(message.body);
    let finalCleanContent = parsed.cleanContent;
    
    // Check if this content has already been seen in previous messages
    const contentSignature = finalCleanContent.toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '')
      .trim();
    
    // If we've seen very similar content before, it might be a duplicate
    let isDuplicate = false;
    for (const seenSig of seenContent) {
      if (contentSignature.length > 20 && seenSig.includes(contentSignature)) {
        isDuplicate = true;
        break;
      }
    }
    
    // If not a duplicate, add to seen content
    if (!isDuplicate && contentSignature.length > 10) {
      seenContent.add(contentSignature);
    }
    
    processedMessages.push({
      ...message,
      cleanBody: finalCleanContent,
      hasQuotedContent: parsed.hasQuotedContent,
    });
  }
  
  return processedMessages;
}

/**
 * Clean email subject line by removing "Re:" and "Fwd:" prefixes
 */
export function cleanEmailSubject(subject: string): string {
  if (!subject) return '';
  
  return subject
    .replace(/^(Re:\s*)+/gi, '')
    .replace(/^(Fwd:\s*)+/gi, '')
    .replace(/^(Fw:\s*)+/gi, '')
    .trim();
}

/**
 * Extract sender name from email address string
 * Handles formats like "John Doe <john@example.com>" or "john@example.com"
 */
export function extractSenderName(fromString: string): string {
  if (!fromString) return 'Unknown';
  
  // Check for "Name <email>" format
  const nameMatch = fromString.match(/^(.+?)\s*<.+>$/);
  if (nameMatch) {
    return nameMatch[1].trim().replace(/^["']|["']$/g, ''); // Remove quotes if present
  }
  
  // If just email, extract name part before @
  const emailMatch = fromString.match(/^([^@]+)@/);
  if (emailMatch) {
    return emailMatch[1]
      .replace(/[._-]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
  
  return fromString;
}

/**
 * Extract email address from email string
 * Handles formats like "John Doe <john@example.com>" or "john@example.com"
 */
export function extractEmailAddress(fromString: string): string {
  if (!fromString) return '';
  
  // Check for "Name <email>" format
  const emailMatch = fromString.match(/<(.+?)>/);
  if (emailMatch) {
    return emailMatch[1].trim();
  }
  
  // If it's already just an email
  if (fromString.includes('@')) {
    return fromString.trim();
  }
  
  return fromString;
}
