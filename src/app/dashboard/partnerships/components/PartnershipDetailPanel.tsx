'use client'

// React imports
import React, { useState, useMemo, useCallback } from 'react';

// UI Component imports
import { Card } from '@/components/ui/card';

// Type imports
import { Partnership } from '../types';

// Hook imports
import { useNotes } from '@/app/context/notes-context';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';

// Utility imports
import { getPartnershipColors } from '../utils/emailCategorization';
import { getCurrentUserId } from '@/app/lib/api-helpers';
import { usePartnershipOperations } from '../hooks/usePartnershipOperations';

// Convex imports
import { api } from '@/convex/_generated/api';

// Component imports
import { ConversationThreads } from './ConversationThreads';
import { PartnershipControlBar } from './PartnershipControlBar';
import { PartnershipHeader } from './PartnershipHeader';
import { AssociatedNotes } from './AssociatedNotes';
import { PartnershipEmptyState } from './PartnershipEmptyState';

// Constants
const HOURS_IN_MS = 1000 * 60 * 60;
const DAYS_IN_MS = HOURS_IN_MS * 24;

// Map partnership category to theme color
const getCategoryThemeColor = (category?: Partnership['category']): string => {
  switch (category) {
    case 'media': return 'pink';
    case 'business': return 'teal'; 
    case 'community': return 'green';
    case 'partnership': return 'purple';
    default: return 'yellow'; // default for uncategorized/none
  }
};

// Types
interface GmailMessage {
  readonly id?: string;
  readonly from?: string;
  readonly email?: string;
  readonly subject?: string;
  readonly body?: string;
  readonly snippet?: string;
  readonly timestamp?: number;
}

interface GmailData {
  readonly data?: {
    readonly messages?: readonly GmailMessage[];
    readonly from?: string;
    readonly subject?: string;
  };
  readonly createdAt?: number;
}

interface EmailMessage {
  readonly id: string;
  readonly from: string;
  readonly email: string;
  readonly subject: string;
  readonly body: string;
  readonly timestamp: number;
  readonly isReply: boolean;
  readonly isFromUser: boolean;
}

interface EmailThreadData {
  readonly threadId?: string;
  readonly messages?: Array<{
    readonly from: string;
    readonly body: string;
    readonly timestamp: number;
  }>;
  readonly subject?: string;
  readonly brandName?: string;
  readonly recipientEmail?: string;
}

interface PartnershipSummary {
  readonly messageCount: number;
  readonly lastActivity: number;
  readonly estimatedValue: number;
  readonly from: string;
  readonly subject: string;
  readonly brandName: string;
}

interface PartnershipDetailPanelProps {
  readonly partnership: Partnership | null;
  readonly onUpdatePartnership: (partnershipId: string, updates: Partial<Partnership>) => void;
  readonly onPartnershipDeleted?: () => void;
  readonly gmailData?: GmailData;
  readonly userEmail?: string | null;
}

// Custom Hooks
const usePartnershipData = (partnership: Partnership | null, userId: string | undefined) => {
  const gmailAccounts = useQuery(
    api.gmailQueries.getGmailAccounts,
    userId ? { userId } : "skip"
  );
  
  const gmailAccountId = gmailAccounts && gmailAccounts.length > 0 ? gmailAccounts[0].email : undefined;
  
  return { gmailAccountId };
};

const useNotesIntegration = (partnership: Partnership | null) => {
  const { notes, setActiveNoteId } = useNotes();
  const router = useRouter();
  
  const associatedNotes = useMemo(() => {
    if (!partnership || !partnership.smartNoteIds || partnership.smartNoteIds.length === 0) {
      return [];
    }
    
    return notes.filter(note => 
      partnership.smartNoteIds.includes(String(note._id))
    );
  }, [notes, partnership?.smartNoteIds]);

  const handleViewNote = useCallback((noteId: string) => {
    setActiveNoteId(noteId);
    router.push(`/dashboard/notes?noteId=${noteId}`);
  }, [setActiveNoteId, router]);

  return { associatedNotes, handleViewNote };
};

// Utility Functions (non-hook versions)
const formatTimeAgo = (timestamp: number): string => {
  const now = typeof window !== 'undefined' ? Date.now() : timestamp;
  const diff = now - timestamp;
  const days = Math.floor(diff / DAYS_IN_MS);
  const hours = Math.floor(diff / HOURS_IN_MS);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return 'Just now';
};

const truncateText = (text: string, maxLength: number = 100): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

const formatValue = (value: number): string => {
  if (value === 0) return 'Not specified';
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
  return `$${value}`;
};

const getStatusColor = (status: Partnership['status']): string => {
  const colors = getPartnershipColors();
  switch (status) {
    case 'opportunity': return `bg-primary/10 ${colors.status.opportunity}`;
    case 'inquiry': return `bg-blue-50 dark:bg-blue-950/20 ${colors.status.inquiry}`;
    case 'negotiating': return `bg-amber-50 dark:bg-amber-950/20 ${colors.status.negotiating}`;
    case 'active': return `bg-green-50 dark:bg-green-950/20 ${colors.status.active}`;
    case 'completed': return 'bg-muted text-muted-foreground';
    default: return 'bg-muted text-muted-foreground';
  }
};

export function PartnershipDetailPanel({ 
  partnership, 
  onUpdatePartnership,
  onPartnershipDeleted,
  gmailData,
  userEmail
}: PartnershipDetailPanelProps) {
  const [selectedMessageId, setSelectedMessageId] = useState<string | undefined>();
  
  // Basic data gathering
  const userId = getCurrentUserId();
  
  // Custom hooks
  const { gmailAccountId } = usePartnershipData(partnership, userId);
  const { associatedNotes, handleViewNote } = useNotesIntegration(partnership);

  // Memoized email thread processing
  const emailMessages = useMemo((): EmailMessage[] => {
    if (!gmailData?.data) {
      // Fallback to partnership data if no gmailData
      if (partnership) {
        return [{
          id: partnership.id,
          from: partnership.from || 'Unknown',
          email: partnership.from || 'unknown@example.com',
          subject: partnership.subject || 'No Subject',
          body: partnership.snippet || 'No content available',
          timestamp: partnership.lastActivity || Date.now(),
          isReply: false,
          isFromUser: false
        }];
      }
      return [];
    }
    
    const messages = gmailData.data.messages || [];
    return messages.map((message, index) => ({
      id: message.id || `msg-${index}`,
      from: message.from || gmailData.data?.from || 'Unknown',
      email: message.email || gmailData.data?.from || 'unknown@example.com',
      subject: message.subject || gmailData.data?.subject || 'No Subject',
      body: message.body || message.snippet || partnership?.snippet || 'No content available',
      timestamp: message.timestamp || gmailData.createdAt || Date.now(),
      isReply: index > 0,
      isFromUser: message.from === userEmail || message.email === userEmail
    })).sort((a, b) => a.timestamp - b.timestamp);
  }, [gmailData, partnership, userEmail]);

  // Prepare email thread data for AI context
  const emailThreadData = useMemo((): EmailThreadData | undefined => {
    if (!partnership) {
      return undefined;
    }
    
    return {
      threadId: partnership.emailThreadId,
        messages: [{
          from: partnership.from || 'Unknown',
          body: partnership.snippet || 'No content available',
          timestamp: partnership.lastActivity || Date.now()
        }],
        subject: partnership.subject || 'No Subject',
        brandName: partnership.brandName || 'Unknown Brand',
        recipientEmail: partnership.from || 'unknown@example.com'
      };
  }, [partnership?.id, partnership?.emailThreadId, partnership?.subject, partnership?.brandName, partnership?.from, partnership?.snippet, partnership?.lastActivity]);





  const updateNote = useMutation(api.notes.updateNote);
  
  const handleSendReply = useCallback(async (content: string) => {
    if (!partnership || !content.trim() || !userId) return;

    try {
      const title = `Email Reply: ${partnership.brandName} - ${partnership.subject}`;
      const brandTag = partnership.brandName.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      const updatedTags = [
        '#email-reply',
        '#partnership',
        `#${brandTag}`,
        `#${partnership.category || 'uncategorized'}`,
        `#${partnership.status}`,
        '#sent'
      ];
      
      const sentContent = `${content}\n\n---\n✅ **Email sent successfully** on ${new Date().toLocaleString()}`;
      
      await updateNote({
        userId,
        updates: {
          title,
          content: sentContent,
          type: 'email_draft' as const,
          tags: updatedTags,
          platform: 'partnerships'
        }
      });

      onUpdatePartnership(partnership.id, {
        lastActivity: Date.now(),
        status: partnership.status === 'opportunity' ? 'inquiry' : partnership.status
      });
      
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  }, [partnership, userId, updateNote, onUpdatePartnership]);

  const handleSaveDraft = useCallback(async (content: string) => {
    if (!partnership || !content.trim() || !userId) return;

    try {
      const title = `Email Draft: ${partnership.brandName} - ${partnership.subject}`;
      const brandTag = partnership.brandName.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      const tags = [
        '#email-draft',
        '#partnership',
        `#${brandTag}`,
        `#${partnership.category || 'uncategorized'}`,
        `#${partnership.status}`,
        '#draft'
      ];

      await updateNote({
        userId,
        updates: {
          title,
          content,
          type: 'email_draft' as const,
          tags,
          platform: 'partnerships'
        }
      });
      
    } catch (error) {
      console.error('Failed to save email draft:', error);
    }
  }, [partnership, userId, updateNote]);

  // Memoized message selection handler
  const handleMessageSelect = useCallback((messageId: string) => {
    setSelectedMessageId(messageId);
  }, []);
  
  // Partnership operations hook
  const {
    handleDeletePartnership,
    handleUpdateStatus,
    handleUpdateCategory,
    deleteLoading
  } = usePartnershipOperations();

  // Partnership operation handlers
  const handleStatusChange = useCallback(async (newStatus: Partnership['status']) => {
    if (!partnership) return;
    
    const originalStatus = partnership.status;
    
    // Optimistically update UI first
    onUpdatePartnership(partnership.id, { status: newStatus, lastActivity: Date.now() });
    
    try {
      await handleUpdateStatus(partnership, newStatus, (updates) => {
        onUpdatePartnership(partnership.id, updates);
      });
    } catch (error) {
      console.error('Failed to update status, reverting:', error);
      onUpdatePartnership(partnership.id, { status: originalStatus });
    }
  }, [partnership, onUpdatePartnership, handleUpdateStatus]);

  const handleCategoryChange = useCallback(async (newCategory: Partnership['category']) => {
    if (!partnership) return;
    
    const originalCategory = partnership.category;
    
    // Optimistically update UI first
    onUpdatePartnership(partnership.id, { category: newCategory });
    
    try {
      await handleUpdateCategory(partnership, newCategory, (updates) => {
        onUpdatePartnership(partnership.id, updates);
      });
    } catch (error) {
      console.error('Failed to update category, reverting:', error);
      onUpdatePartnership(partnership.id, { category: originalCategory });
    }
  }, [partnership, onUpdatePartnership, handleUpdateCategory]);

  const handleDelete = useCallback(async () => {
    if (!partnership) return;
    
    try {
      await handleDeletePartnership(partnership, userEmail, () => {
        onPartnershipDeleted?.();
      });
    } catch (error) {
      console.error('Failed to delete partnership:', error);
    }
  }, [partnership, userEmail, handleDeletePartnership, onPartnershipDeleted]);

  // Memoized partnership summary for ConversationThreads (must be before early return)
  const partnershipSummary = useMemo((): PartnershipSummary | undefined => {
    if (!partnership) return undefined;
    
    return {
      messageCount: partnership.messageCount || 0,
      lastActivity: partnership.lastActivity || Date.now(),
      estimatedValue: partnership.estimatedValue || 0,
      from: partnership.from || 'Unknown',
      subject: partnership.subject || 'No Subject',
      brandName: partnership.brandName || 'Unknown Brand'
    };
  }, [partnership]);

  if (!partnership) {
    return <PartnershipEmptyState />;
  }

  const themeColor = getCategoryThemeColor(partnership.category);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 space-y-4">
        {/* Partnership Controls and Header */}
        <div className="space-y-4">
          <PartnershipControlBar
            partnership={partnership}
            onCategoryChange={handleCategoryChange}
            onStatusChange={handleStatusChange}
            themeColor={themeColor}
          />

          <PartnershipHeader
            partnership={partnership}
            onDelete={handleDelete}
            deleteLoading={deleteLoading}
            themeColor={themeColor}
          />
          </div>




      </div>

                      {/* Conversation Threads - New Design */}
        <div className="mb-4">
          <Card className="rounded-xl shadow-none border-0">
            <div className="p-4">
            <ConversationThreads
              messages={emailMessages}
              threadId={partnership?.emailThreadId || ''}
              userId={userId || ''}
              userEmail={userEmail}
              selectedMessageId={selectedMessageId}
              partnership={partnershipSummary}
              emailThreadData={emailThreadData}
              onMessageSelect={handleMessageSelect}
              onStartDraft={undefined}
              themeColor={themeColor}
            />

          </div>
        </Card>
      </div>

              {/* Associated Smart Notes */}
      <AssociatedNotes
        notes={associatedNotes}
        onViewNote={handleViewNote}
      />


    </div>
  );
} 