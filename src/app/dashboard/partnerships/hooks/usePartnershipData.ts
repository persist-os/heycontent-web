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
  searchQuery: string,
  filterType: 'all' | 'active' | 'needs_response' | 'deal_value'
) => {
  // Process Gmail items into partnerships
  const partnerships = useMemo(() => {
    const processedPartnerships = processGmailItemsToPartnerships(gmailItems);
    return processedPartnerships;
  }, [gmailItems]);

  // Calculate metrics
  const partnershipMetrics = useMemo(() => {
    return calculatePartnershipMetrics(partnerships, gmailItems, userEmail);
  }, [partnerships, gmailItems, userEmail]);

  // Filter partnerships based on metrics and search
  const filteredPartnerships = useMemo(() => {
    return filterPartnerships(partnerships, filterType, searchQuery, gmailItems, userEmail);
  }, [partnerships, filterType, searchQuery, gmailItems, userEmail]);

  // Group ALL emails by category (for when no filter is applied)
  const groupedEmails = useMemo(() => {
    return groupEmailsByCategory(gmailItems || []);
  }, [gmailItems]);

  // Create filtered grouped emails that respects both category grouping AND metric filtering
  const filteredGroupedEmails = useMemo(() => {
    // If no filter is applied, return all grouped emails
    if (filterType === 'all' && !searchQuery.trim()) {
      return groupedEmails;
    }

    // Get the IDs of filtered partnerships
    const filteredPartnershipIds = new Set(filteredPartnerships.map(p => p.id));
    
    // Filter each category's emails based on the filtered partnerships
    const filtered = Object.entries(groupedEmails).reduce((acc, [category, emails]) => {
      acc[category] = emails.filter(email => filteredPartnershipIds.has(email.id));
      return acc;
    }, {} as Record<string, any[]>);
    
    return filtered;
  }, [groupedEmails, filteredPartnerships, filterType, searchQuery]);

  return {
    partnerships,
    partnershipMetrics,
    filteredPartnerships,
    groupedEmails: filteredGroupedEmails, // Return the filtered version
  };
}; 