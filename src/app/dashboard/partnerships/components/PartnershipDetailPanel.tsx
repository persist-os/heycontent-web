'use client'

import React, { useState, useRef, useMemo, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  Clock, 
  FileText,
  MessageSquare,
  DollarSign,
  Tag,
  Trash2,
  Brain,
  Zap
} from 'lucide-react';
import { Partnership } from '../types';

import { useNotes } from '@/app/context/notes-context';
import { useRouter } from 'next/navigation';
import { getPartnershipColors } from '../utils/emailCategorization';
import { api } from '@/convex/_generated/api';
import { useMutation, useQuery } from 'convex/react';
import { getCurrentUserId, fetchWithApiKey } from '@/app/lib/api-helpers';
import { usePartnershipOperations } from '../hooks/usePartnershipOperations';
import { ConversationThreads } from './ConversationThreads';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getApiKey } from '@/app/lib/api-helpers';

interface PartnershipDetailPanelProps {
  partnership: Partnership | null;
  onUpdatePartnership: (partnershipId: string, updates: Partial<Partnership>) => void;
  onPartnershipDeleted?: () => void;
  gmailData?: any; // Full Gmail thread data for displaying email content
  userEmail?: string | null;
}

export function PartnershipDetailPanel({ 
  partnership, 
  onUpdatePartnership,
  onPartnershipDeleted,
  gmailData,
  userEmail
}: PartnershipDetailPanelProps) {
  const [selectedMessageId, setSelectedMessageId] = useState<string | undefined>();
  const router = useRouter();
  

  
  // Get notes from context
  const { notes, setActiveNoteId } = useNotes();
  
  // Basic data gathering
  const userId = getCurrentUserId();
  
  // Get Gmail account for passing to ConversationThreads
  const gmailAccounts = useQuery(
    api.gmailQueries.getGmailAccounts,
    userId ? { userId } : "skip"
  );
  const gmailAccountId = gmailAccounts && gmailAccounts.length > 0 ? gmailAccounts[0].email : undefined;

  // Filter notes based on partnership's smartNoteIds
  const associatedNotes = useMemo(() => {
    if (!partnership || !partnership.smartNoteIds || partnership.smartNoteIds.length === 0) {
      return [];
    }
    
    return notes.filter(note => 
      partnership.smartNoteIds.includes(String(note._id))
    );
  }, [notes, partnership?.smartNoteIds]);

  // Get email thread messages from gmailData for ConversationThreads
  const getEmailThreadForConversation = useCallback(() => {
    console.log('🔍 [DEBUG] Getting email thread data:', {
      hasGmailData: !!gmailData,
      gmailDataKeys: gmailData ? Object.keys(gmailData) : [],
      partnershipSnippet: partnership?.snippet?.substring(0, 100) + '...',
      partnershipSubject: partnership?.subject,
      partnershipFrom: partnership?.from
    });

    if (!gmailData || !gmailData.data) {
      // Fallback to partnership data if no gmailData
      if (partnership) {
        return [{
          id: partnership.id,
          from: partnership.from || 'Unknown',
          email: partnership.from || 'unknown@example.com',
          subject: partnership.subject || 'No Subject',
          body: partnership.snippet || 'No content available',
          timestamp: partnership.lastActivity || new Date().getTime(),
          isReply: false,
          isFromUser: false
        }];
      }
      return [];
    }
    
    const messages = gmailData.data.messages || [];
    console.log('📧 [DEBUG] Gmail messages found:', {
      messageCount: messages.length,
      firstMessageKeys: messages[0] ? Object.keys(messages[0]) : [],
      firstMessageBody: messages[0]?.body?.substring(0, 100) + '...' || 'No body'
    });

    return messages.map((message: any, index: number) => ({
      id: message.id || `msg-${index}`,
      from: message.from || gmailData.data.from || 'Unknown',
      email: message.email || gmailData.data.from || 'unknown@example.com',
      subject: message.subject || gmailData.data.subject || 'No Subject',
      body: message.body || message.snippet || partnership?.snippet || 'No content available',
      timestamp: message.timestamp || gmailData.createdAt || new Date().getTime(),
      isReply: index > 0,
      isFromUser: message.from === userEmail || message.email === userEmail
    })).sort((a: any, b: any) => a.timestamp - b.timestamp);
  }, [gmailData, partnership, userEmail]);

  // Prepare email thread data for AI context
  const emailThreadData = useMemo(() => {
    console.log('🔄 [DEBUG] emailThreadData useMemo running:', {
      hasPartnership: !!partnership,
      partnershipId: partnership?.id,
      partnershipSubject: partnership?.subject,
      partnershipBrand: partnership?.brandName,
      partnershipFrom: partnership?.from
    });

    if (!partnership) {
      console.log('❌ [DEBUG] No partnership data for emailThreadData');
      return undefined;
    }
    
    try {
      // Use the partnership data directly since we have the email content
      const threadData = {
        messages: [{
          from: partnership.from || 'Unknown',
          body: partnership.snippet || 'No content available',
          timestamp: partnership.lastActivity || Date.now()
        }],
        subject: partnership.subject || 'No Subject',
        brandName: partnership.brandName || 'Unknown Brand',
        recipientEmail: partnership.from || 'unknown@example.com'
      };

      console.log('✅ [DEBUG] Email thread data for AI prepared successfully:', {
        messageCount: threadData.messages.length,
        hasRealContent: threadData.messages.some(m => m.body && m.body !== 'No content available'),
        firstMessageBody: threadData.messages[0]?.body?.substring(0, 150) + '...',
        subject: threadData.subject,
        brandName: threadData.brandName,
        recipientEmail: threadData.recipientEmail
      });

      return threadData;
    } catch (error) {
      console.error('❌ [DEBUG] Error preparing email thread data:', error);
      return undefined;
    }
  }, [partnership?.id, partnership?.subject, partnership?.brandName, partnership?.from, partnership?.snippet, partnership?.lastActivity]);





  const handleSendReply = async (content: string) => {
    if (!partnership || !content.trim()) return;
    
    const userId = getCurrentUserId();
    if (!userId) {
      console.error('User not authenticated, cannot send email');
      return;
    }

    try {
      console.log('Sending reply for partnership:', partnership.id, content);
      
      // TODO: Implement actual email sending via Gmail API
      // For now, simulate sending and update the note as "sent"
      
      // Find existing draft note and update it as sent
      const title = `Email Reply: ${partnership.brandName} - ${partnership.subject}`;
      const brandTag = partnership.brandName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      
      // Update tags to include sent status
      const updatedTags = [
        '#email-reply',
        '#partnership',
        `#${brandTag}`,
        `#${partnership.category || 'uncategorized'}`,
        `#${partnership.status}`,
        '#sent' // Mark as sent instead of draft
      ];
      
      // Add sent timestamp to content
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

      console.log('✅ Email marked as sent and saved');
      
      // Reply sent (draft handling now in ConversationThreads)
      
      // Update partnership status to indicate reply sent
      onUpdatePartnership(partnership.id, {
        lastActivity: new Date().getTime(),
        status: partnership.status === 'opportunity' ? 'inquiry' : partnership.status
      });
      
    } catch (error) {
      console.error('❌ Failed to send email:', error);
    }
  };

  const handleSaveDraft = async (content: string) => {
    if (!partnership || !content.trim()) return;
    
    const userId = getCurrentUserId();
    if (!userId) {
      console.error('User not authenticated, cannot save email draft');
      return;
    }

    try {
      console.log('Auto-saving email draft for partnership:', partnership.id);
      
      // Generate appropriate title
      const title = `Email Draft: ${partnership.brandName} - ${partnership.subject}`;
      
      // Generate tags for partnership context
      const brandTag = partnership.brandName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      const tags = [
        '#email-draft',
        '#partnership',
        `#${brandTag}`,
        `#${partnership.category || 'uncategorized'}`,
        `#${partnership.status}`,
        '#draft' // Explicitly mark as draft
      ];

      // Save as smart note with email_draft type
      const newNote = await updateNote({
        userId,
        updates: {
          title,
          content,
          type: 'email_draft' as const,
          tags,
          platform: 'partnerships'
        }
      });

      console.log('✅ Email draft saved successfully as smart note:', newNote?._id);
      
      // TODO: Associate the note with the partnership by updating partnership.smartNoteIds
      // This would require a partnership update mutation that we could implement later
      
    } catch (error) {
      console.error('❌ Failed to save email draft:', error);
    }
  };

  const handleViewNote = (noteId: string) => {
    // Set the active note and navigate to notes page
    setActiveNoteId(noteId);
    router.push(`/dashboard/notes?noteId=${noteId}`);
  };

  const formatTimeAgo = (timestamp: number) => {
    // Use a fixed reference time to avoid hydration mismatches
    const now = typeof window !== 'undefined' ? Date.now() : timestamp;
    const diff = now - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  const updateNote = useMutation(api.notes.updateNote);
  
  // Partnership operations hook
  const {
    handleDeletePartnership,
    handleUpdateStatus,
    handleUpdateCategory,
    deleteLoading
  } = usePartnershipOperations();

  // Partnership operation handlers
  const handleStatusChange = async (newStatus: Partnership['status']) => {
    if (!partnership) return;
    
    const originalStatus = partnership.status;
    
    console.log('🔄 [STATUS UPDATE] Attempting to update status:', {
      partnershipId: partnership.id,
      threadId: partnership.emailThreadId,
      oldStatus: originalStatus,
      newStatus
    });
    
    // IMMEDIATELY update the UI first
    onUpdatePartnership(partnership.id, { status: newStatus, lastActivity: Date.now() });
    
    try {
      // Then update the backend
      await handleUpdateStatus(partnership, newStatus, (updates) => {
        console.log('✅ [STATUS UPDATE] Backend update successful:', updates);
        // Ensure UI stays in sync
        onUpdatePartnership(partnership.id, updates);
      });
    } catch (error) {
      console.error('❌ [STATUS UPDATE] Failed to update status, reverting:', error);
      // Revert the UI change on error
      onUpdatePartnership(partnership.id, { status: originalStatus });
    }
  };

  const handleCategoryChange = async (newCategory: Partnership['category']) => {
    if (!partnership) return;
    
    const originalCategory = partnership.category;
    
    console.log('🏷️ [CATEGORY UPDATE] Attempting to update category:', {
      partnershipId: partnership.id,
      threadId: partnership.emailThreadId,
      oldCategory: originalCategory,
      newCategory
    });
    
    // IMMEDIATELY update the UI first
    onUpdatePartnership(partnership.id, { category: newCategory });
    
    try {
      // Then update the backend
      await handleUpdateCategory(partnership, newCategory, (updates) => {
        console.log('✅ [CATEGORY UPDATE] Backend update successful:', updates);
        // Ensure UI stays in sync
        onUpdatePartnership(partnership.id, updates);
      });
    } catch (error) {
      console.error('❌ [CATEGORY UPDATE] Failed to update category, reverting:', error);
      // Revert the UI change on error
      onUpdatePartnership(partnership.id, { category: originalCategory });
    }
  };

  const handleDelete = async () => {
    if (!partnership) return;
    
    try {
      await handleDeletePartnership(partnership, userEmail, () => {
        if (onPartnershipDeleted) onPartnershipDeleted();
      });
    } catch (error) {
      console.error('Failed to delete partnership:', error);
    }
  };



  if (!partnership) {
    return (
      <div className="flex items-center justify-center h-full min-h-[600px] text-center px-8">
        <div className="space-y-6 max-w-md">
          <div className="mx-auto w-48 h-48 rounded-2xl bg-muted/50 flex items-center justify-center relative">
            {/* Composite icon: Mail with chat bubble overlay */}
            <div className="relative">
              <Mail className="w-40 h-40 text-muted-foreground" />
              <MessageSquare className="w-20 h-20 text-muted-foreground absolute -bottom-2 -left-2 fill-background" />
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-xl font-semibold text-foreground">Ready to dive into your next collaboration?</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Pick a partnership from the left to explore the conversation, draft replies, and turn opportunities into collaborations
            </p>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: Partnership['status']) => {
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

  const formatValue = (value: number) => {
    if (value === 0) return 'Not specified';
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value}`;
  };

  const handleMessageSelect = (messageId: string) => {
    setSelectedMessageId(messageId);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 space-y-4">
        {/* New Header Design - Matching Image */}
        <div className="space-y-4">
          {/* Top Control Bar */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              {/* Type Selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Type:</span>
                <Select value={partnership.category || 'partnership'} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="w-32 h-8 bg-primary/10 border-primary/30 text-foreground hover:bg-primary/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="partnership">Partnership</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="community">Community</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status Selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Select value={partnership.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-32 h-8 bg-primary/10 border-primary/30 text-foreground hover:bg-primary/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="opportunity">Opportunity</SelectItem>
                    <SelectItem value="inquiry">Inquiry</SelectItem>
                    <SelectItem value="negotiating">Negotiating</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Auto-track Checkbox */}
              <div className="flex items-center gap-2">
                <Checkbox id="auto-track" className="border-primary/30" />
                <label htmlFor="auto-track" className="text-sm text-muted-foreground">
                  Auto-track this partnership status
                </label>
              </div>


            </div>
          </div>



          {/* Partnership Details Section */}
          <div className="space-y-3">
            {/* Title and Action Icons */}
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl md:text-2xl font-bold text-foreground">
                  Partnership Opportunity with {partnership.brandName}
                </h2>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  onClick={handleDelete}
                  disabled={deleteLoading}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Company Info */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-xs font-bold">
                {partnership.brandName.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 4)}
              </div>
              <div className="text-sm text-muted-foreground">
                From: {partnership.brandName}
              </div>
            </div>
          </div>
        </div>




      </div>

                      {/* Conversation Threads - New Design */}
        <div className="mb-4">
          <Card className="rounded-xl shadow-none border-0">
            <div className="p-4">
            <ConversationThreads
              messages={getEmailThreadForConversation()}
              userEmail={userEmail}
              onMessageSelect={handleMessageSelect}
              selectedMessageId={selectedMessageId}
              onStartDraft={undefined}
              threadId={partnership?.emailThreadId}
              userId={userId}
              gmailAccountId={gmailAccountId}
              partnership={partnership ? {
                messageCount: partnership.messageCount,
                lastActivity: partnership.lastActivity,
                estimatedValue: partnership.estimatedValue,
                from: partnership.from,
                subject: partnership.subject,
                brandName: partnership.brandName
              } : undefined}
              emailThreadData={emailThreadData}
            />

          </div>
        </Card>
      </div>

              {/* Associated Smart Notes */}
        <div className="pt-0">
          <Card className="p-4 shadow-none border-0">
          <div className="space-y-3 md:space-y-4">
            <h3 className="font-medium text-foreground flex items-center text-sm md:text-base">
              <FileText className="w-4 h-4 mr-2 flex-shrink-0" />
              Associated Notes ({associatedNotes.length})
            </h3>
            
            {associatedNotes.length > 0 ? (
              <div className="space-y-2">
                {associatedNotes.slice(0, 3).map((note) => (
                  <div key={String(note._id)} className="flex items-start justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {note.title || 'Untitled Note'}
                        </p>
                        {note.type && (
                          <span className="text-xs font-medium text-muted-foreground">
                            {note.type.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                      {note.content && (
                        <p className="text-xs text-muted-foreground mb-1 line-clamp-2">
                          {truncateText(note.content, 80)}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{formatTimeAgo(note.updatedAt || note._creationTime)}</span>
                        {note.tags && note.tags.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            <span>{note.tags.slice(0, 2).join(', ')}</span>
                            {note.tags.length > 2 && <span>+{note.tags.length - 2}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewNote(String(note._id))}
                      className="ml-3 shrink-0"
                    >
                      View
                    </Button>
                  </div>
                ))}
                {associatedNotes.length > 3 && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      +{associatedNotes.length - 3} more notes
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <FileText className="w-6 h-6 md:w-8 md:h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Perfect canvas for your next masterpiece</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Create notes about this partnership and watch your collaboration strategy come to life right here
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>


    </div>
  );
} 