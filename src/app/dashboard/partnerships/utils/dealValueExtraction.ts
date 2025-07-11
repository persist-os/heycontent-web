// Deal value extraction utility functions
export const extractDealValue = (item: any): number => {
  // Check if there's an actual deal value from metrics first
  const existingDealValue = item.metrics?.dealValue;
  if (existingDealValue && existingDealValue > 0) {
    return existingDealValue;
  }
  
  // Get all email content to search for dollar amounts
  const subject = item.content?.data?.subject || '';
  const messages = item.content?.data?.messages || [];
  
  let allContent = subject;
  messages.forEach((message: any) => {
    if (message.body) allContent += ' ' + message.body;
  });
  
  if (!allContent.trim()) return 0;
  
  // Only extract CONFIRMED deal values, not rate negotiations
  const confirmedDealPatterns = [
    // Explicit confirmed deals with context
    /(?:agreed|confirmed|approved|accepted|final|total|deal)\s+(?:amount|value|budget|payment|compensation|deal)?\s*:?\s*\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
    
    // "We'll pay you $X" or "You'll receive $X"
    /(?:we'll pay|you'll receive|we're paying|payment of|compensation of)\s+\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
    
    // "Total budget: $X" or "Campaign budget: $X"
    /(?:total|campaign|project|partnership)\s+budget\s*:?\s*\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
    
    // K notation with confirmed context
    /(?:agreed|confirmed|approved|accepted|final|total|deal)\s+(?:amount|value|budget)?\s*:?\s*\$?(\d+(?:\.\d+)?)[kK]/gi,
    
    // "Deal worth $X" or "Partnership valued at $X"
    /(?:deal worth|partnership valued|valued at|worth)\s+\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi
  ];
  
  // Check if email contains rate negotiation keywords (skip extraction)
  const isNegotiation = /(?:rate|rates|pricing|quote|proposal|my rates|your rates|rate card|media kit)\s/gi.test(allContent);
  
  if (isNegotiation) {
    console.log('🔄 [RATE NEGOTIATION DETECTED]', {
      emailId: item.id,
      subject: subject.substring(0, 50) + '...',
      reason: 'Email contains rate negotiation keywords - no deal value extracted'
    });
    return 0;
  }
  
  let maxValue = 0;
  
  for (const pattern of confirmedDealPatterns) {
    let match;
    while ((match = pattern.exec(allContent)) !== null) {
      let value = 0;
      const numStr = match[1];
      const fullMatch = match[0];
      
      // Skip if this specific match looks like a false positive
      if (isLikelyFalsePositive(fullMatch, numStr)) {
        continue;
      }
      
      if (pattern.source.includes('[kK]')) {
        // Handle k notation (thousands)
        value = parseFloat(numStr) * 1000;
      } else {
        // Handle regular dollar amounts, remove commas
        value = parseInt(numStr.replace(/,/g, ''));
      }
      
      // Only consider realistic partnership values ($100 - $10M)
      if (value >= 100 && value <= 10000000 && value > maxValue) {
        maxValue = value;
      }
    }
    // Reset regex for next iteration
    pattern.lastIndex = 0;
  }
  
  // Debug logging for deal value extraction
  if (maxValue > 0) {
    console.log('💰 [DEAL VALUE EXTRACTED]', {
      emailId: item.id,
      subject: subject.substring(0, 50) + '...',
      extractedValue: maxValue,
      contentSample: allContent.substring(0, 200) + '...'
    });
  } else {
    // Log when no value is found to help debug
    const partnershipTerms = ['partnership', 'collaboration', 'sponsor', 'deal', 'campaign'];
    const hasPartnershipTerms = partnershipTerms.some(term => allContent.toLowerCase().includes(term));
    
    if (hasPartnershipTerms) {
      console.log('🔍 [NO VALUE FOUND]', {
        emailId: item.id,
        subject: subject.substring(0, 50) + '...',
        reason: 'Partnership email detected but no monetary value extracted',
        contentSample: allContent.substring(0, 200) + '...'
      });
    }
  }
  
  return maxValue;
};

// Helper function to detect false positives in confirmed deals
const isLikelyFalsePositive = (fullMatch: string, numStr: string): boolean => {
  const lowerMatch = fullMatch.toLowerCase();
  const num = parseInt(numStr.replace(/,/g, ''));
  
  // Skip years (even in deal context)
  if (num >= 2020 && num <= 2030) return true;
  
  // Skip unrealistic deal amounts (too small or too large)
  if (num < 100 || num > 10000000) return true;
  
  // Since we're only looking at confirmed deal patterns, fewer false positives
  // But still check for obvious non-monetary context
  if (lowerMatch.includes('view') || lowerMatch.includes('follower') || 
      lowerMatch.includes('subscriber') || lowerMatch.includes('message')) {
    return true;
  }
  
  return false;
}; 