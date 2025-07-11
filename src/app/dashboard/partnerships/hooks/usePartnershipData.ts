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

  // Filter partnerships
  const filteredPartnerships = useMemo(() => {
    return filterPartnerships(partnerships, filterType, searchQuery, gmailItems, userEmail);
  }, [partnerships, filterType, searchQuery, gmailItems, userEmail]);

  // Group emails by category
  const groupedEmails = useMemo(() => {
    return groupEmailsByCategory(gmailItems || []);
  }, [gmailItems]);

  return {
    partnerships,
    partnershipMetrics,
    filteredPartnerships,
    groupedEmails
  };
}; 