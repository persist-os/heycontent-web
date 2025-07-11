import { Partnership } from '../types';
import { extractDealValue } from './dealValueExtraction';

// Category configuration
export const categoryConfig = {
  partnership: {
    title: "Partnership Opportunities",
    description: "Brand collaborations, sponsorships, and affiliate opportunities",
    icon: "",
    color: "text-blue-600"
  },
  media: {
    title: "Media Inquiries", 
    description: "Press requests, interviews, and media mentions",
    icon: "",
    color: "text-purple-600"
  },
  business: {
    title: "Business Opportunities",
    description: "Speaking, consulting, and business development",
    icon: "", 
    color: "text-green-600"
  },
  community: {
    title: "Community Connections",
    description: "Fan engagement, feedback, and creator connections",
    icon: "",
    color: "text-orange-600"
  },
  uncategorized: {
    title: "Uncategorized",
    description: "Emails that need a type. Set the opportunity type to organize them.",
    icon: "",
    color: "text-gray-500"
  }
};

// Helper function to determine if user needs to respond
export const needsResponse = (item: any, userEmail: string): boolean => {
  if (!userEmail) return false;
  
  const messages = item.content?.data?.messages || [];
  if (messages.length === 0) return false;
  
  // Sort messages by timestamp to get the chronologically last message
  const sortedMessages = [...messages].sort((a, b) => {
    const aTime = a.timestamp || a.date || 0;
    const bTime = b.timestamp || b.date || 0;
    return aTime - bTime;
  });
  
  const lastMessage = sortedMessages[sortedMessages.length - 1];
  const lastSender = lastMessage?.from || '';
  
  // User needs to respond if the last message was NOT from them
  const userSentLast = lastSender.toLowerCase().includes(userEmail.toLowerCase());
  return !userSentLast;
};

// Convert Gmail items to Partnership objects
export const processGmailItemsToPartnerships = (gmailItems: any[]): Partnership[] => {
  if (!gmailItems || gmailItems.length === 0) return [];
  
  console.log('[PARTNERSHIP DEBUG] Processing Gmail items to partnerships. Total items:', gmailItems.length);
  
  return gmailItems.map((item, index) => {
    const messageCount = item.content?.data?.messageCount || item.content?.data?.messages?.length || 1;
    const estimatedValue = extractDealValue(item);
    
    // Determine status based on message count and actual deal value
    let status: Partnership['status'] = 'opportunity';
    
    if (messageCount > 4) {
      status = 'negotiating';
    } else if (messageCount > 2) {
      status = 'inquiry';
    } else if (estimatedValue > 10000 || messageCount > 6) {
      status = 'active';
    }
    
    // Extract brand name more intelligently
    const fromEmail = item.content?.data?.from || '';
    const fromDomain = fromEmail.split('@')[1] || '';
    const brandName = fromDomain.split('.')[0]
      .replace(/[^a-zA-Z0-9]/g, ' ')
      .replace(/\b(com|net|org|io|co|inc|llc)\b/gi, '')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') || 'Unknown Brand';
    
    // Extract category with debug logging
    const extractedCategory = item.convexData?.category || item.category || item.content?.data?.category || undefined;
    
    // Debug logging for first few items
    if (index < 3) {
      console.log(`[PARTNERSHIP DEBUG] Item ${index}:`, {
        subject: item.content?.data?.subject,
        convexCategory: item.convexData?.category,
        fallbackCategory: item.category,
        dataCategory: item.content?.data?.category,
        finalCategory: extractedCategory,
        hasConvexData: !!item.convexData,
        brandName
      });
    }
    
    return {
      id: item.id,
      emailThreadId: item.content?.data?.threadId || item.id,
      brandName,
      subject: item.content?.data?.subject || 'No Subject',
      status,
      estimatedValue,
      lastActivity: new Date(item.publishedAt).getTime(),
      smartNoteIds: [],
      messageCount,
      snippet: item.content?.data?.snippet || '',
      from: item.content?.data?.from || 'Unknown',
      createdAt: new Date(item.publishedAt).getTime(),
      updatedAt: new Date(item.publishedAt).getTime(),
      category: extractedCategory,
    };
  });
};

// Group emails by category
export const groupEmailsByCategory = (emails: any[]) => {
  const grouped = {
    partnership: [],
    media: [],
    business: [],
    community: [],
    uncategorized: [],
  };
  
  // Debug logging to verify categories are being extracted correctly
  console.log('[CATEGORY DEBUG] Grouping emails by category. Total emails:', emails.length);
  
  emails.forEach((email, index) => {
    const category = email.convexData?.category || email.category || email.data?.category;
    
    // Debug logging for first few emails
    if (index < 3) {
      console.log(`[CATEGORY DEBUG] Email ${index}:`, {
        convexCategory: email.convexData?.category,
        fallbackCategory: email.category,
        dataCategory: email.data?.category,
        finalCategory: category,
        hasConvexData: !!email.convexData,
        convexDataKeys: email.convexData ? Object.keys(email.convexData) : 'none'
      });
    }
    
    if (!category || category === 'none' || !grouped[category]) {
      grouped.uncategorized.push(email);
    } else if (grouped[category]) {
      grouped[category as keyof typeof grouped].push(email);
    }
  });
  
  // Debug logging of final grouping
  const categoryCounts = Object.entries(grouped).map(([cat, emails]) => `${cat}: ${emails.length}`).join(', ');
  console.log('[CATEGORY DEBUG] Final grouping:', categoryCounts);
  
  return grouped;
};

// Calculate partnership metrics
export const calculatePartnershipMetrics = (partnerships: Partnership[], gmailItems: any[], userEmail: string | null) => {
  return {
    activePartnerships: partnerships.filter(p => 
      p.messageCount >= 4 || p.estimatedValue > 1000
    ).length,
    pendingResponses: partnerships.filter(p => {
      const gmailItem = gmailItems.find(item => item.id === p.id);
      return gmailItem && userEmail ? needsResponse(gmailItem, userEmail) : false;
    }).length,
    pipelineValue: partnerships.reduce((sum, p) => sum + p.estimatedValue, 0)
  };
};

// Filter partnerships based on type and search query
export const filterPartnerships = (
  partnerships: Partnership[],
  filterType: 'all' | 'active' | 'needs_response' | 'deal_value',
  searchQuery: string,
  gmailItems: any[],
  userEmail: string | null
) => {
  let filtered = partnerships;
  
  // Apply category filter
  switch (filterType) {
    case 'active':
      filtered = partnerships.filter(p => 
        p.messageCount >= 4 || p.estimatedValue > 1000
      );
      break;
    case 'needs_response':
      filtered = partnerships.filter(p => {
        const gmailItem = gmailItems.find(item => item.id === p.id);
        return gmailItem && userEmail ? needsResponse(gmailItem, userEmail) : false;
      });
      break;
    case 'deal_value':
      filtered = partnerships.filter(p => p.estimatedValue > 0);
      break;
    case 'all':
    default:
      filtered = partnerships;
      break;
  }
  
  // Apply search filter on top of category filter
  if (searchQuery.trim()) {
    filtered = filtered.filter(p => 
      p.brandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.subject.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }
  
  return filtered;
}; 