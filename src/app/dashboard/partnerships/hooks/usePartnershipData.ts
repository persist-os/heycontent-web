import { useState, useMemo } from 'react';
import { Partnership } from '../types';
import { 
  processGmailItemsToPartnerships, 
  calculatePartnershipMetrics, 
  filterPartnerships, 
  groupEmailsByCategory 
} from '../utils/emailCategorization';

export const usePartnershipData = (
  gmailItems: any[],
  userEmail: string | null,
  searchQuery: string
) => {
  // Process Gmail items into partnerships
  const partnerships = useMemo(() => {
    console.log('🔄 [PARTNERSHIP DATA] Processing Gmail items to partnerships. Item count:', gmailItems.length);
    const processedPartnerships = processGmailItemsToPartnerships(gmailItems);
    console.log('🔄 [PARTNERSHIP DATA] Processed partnerships:', processedPartnerships.length);
    return processedPartnerships;
  }, [gmailItems]);

  // Calculate metrics
  const partnershipMetrics = useMemo(() => {
    return calculatePartnershipMetrics(partnerships, gmailItems, userEmail);
  }, [partnerships, gmailItems, userEmail]);

  // Group emails by category
  const groupedEmails = useMemo(() => {
    return groupEmailsByCategory(gmailItems || []);
  }, [gmailItems]);

  // Apply search filtering to grouped emails if search query exists
  const filteredGroupedEmails = useMemo(() => {
    if (!searchQuery.trim()) {
      return groupedEmails;
    }

    // Filter each category's emails based on search query
    const filtered = Object.entries(groupedEmails).reduce((acc, [category, emails]) => {
      acc[category] = emails.filter(email => {
        const partnership = partnerships.find(p => p.id === email.id);
        if (!partnership) return false;
        
        return (
          partnership.brandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          partnership.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
          partnership.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
          partnership.snippet.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
      return acc;
    }, {} as Record<string, any[]>);
    
    return filtered;
  }, [groupedEmails, partnerships, searchQuery]);

  return {
    partnerships,
    partnershipMetrics,
    groupedEmails: filteredGroupedEmails, // Return the filtered version
  };
}; 