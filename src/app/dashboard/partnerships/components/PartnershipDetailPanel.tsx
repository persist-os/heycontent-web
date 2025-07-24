'use client'

import React, { useState, useRef, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  Edit3, 
  Clock, 
  User, 
  ExternalLink,
  FileText,
  MessageSquare,
  Calendar,
  DollarSign,
  Tag,
  Star,
  Trash2,
  ChevronDown,
  Maximize2
} from 'lucide-react';
import { Partnership } from '../types';
import { MarkdownNotepad } from '../../chat/components/notepad/MarkdownNotepad';
import { useNotes } from '@/app/context/notes-context';
import { useRouter } from 'next/navigation';
import { categoryConfig, getPartnershipColors } from '../utils/emailCategorization';
import { api } from '@/convex/_generated/api';
import { useMutation, useQuery } from 'convex/react';
import { getCurrentUserId } from '@/app/lib/api-helpers';
import { PartnershipControls } from './PartnershipControls';
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

interface PartnershipDetailPanelProps {
  partnership: Partnership | null;
  onUpdatePartnership: (partnershipId: string, updates: Partial<Partnership>) => void;
  onCategoryChanged?: () => void;
  onPartnershipDeleted?: () => void;
  gmailData?: any; // Full Gmail thread data for displaying email content
  userEmail?: string | null;
}

export function PartnershipDetailPanel({ 
  partnership, 
  onUpdatePartnership,
  onCategoryChanged,
  onPartnershipDeleted,
  gmailData,
  userEmail
}: PartnershipDetailPanelProps) {
  const [isDraftingReply, setIsDraftingReply] = useState(false);
  const [notepadWidth, setNotepadWidth] = useState(400);
  const [selectedMessageId, setSelectedMessageId] = useState<string | undefined>();
  const notepadRef = useRef<any>(null);
  const router = useRouter();
  
  // Get notes from context
  const { notes, setActiveNoteId } = useNotes();
  
  // Filter notes based on partnership's smartNoteIds
  const associatedNotes = useMemo(() => {
    if (!partnership || !partnership.smartNoteIds || partnership.smartNoteIds.length === 0) {
      return [];
    }
    
    return notes.filter(note => 
      partnership.smartNoteIds.includes(String(note._id))
    );
  }, [notes, partnership?.smartNoteIds]);

  // Format full email thread for MarkdownNotepad
  const getEmailContext = () => {
    if (!partnership) return '';
    
    // Get the full conversation thread
    const messages = getEmailThreadForConversation();
    
    let context = `**Email Thread Context:**
Brand: ${partnership.brandName}
Subject: ${partnership.subject}
From: ${partnership.from || 'Unknown'}
Messages: ${partnership.messageCount}
Status: ${partnership.status}

---

**Full Conversation Thread:**

`;

    // Add all messages from the thread
    if (messages.length > 0) {
      messages.forEach((message: any, index: number) => {
        context += `**Message ${index + 1}** - ${message.from}
*${new Date(message.timestamp).toISOString().replace('T', ' ').substring(0, 19)}*

${message.body}

---

`;
      });
    } else {
      context += `${partnership.snippet || 'No conversation content available'}

---

`;
    }

    context += `**Reply Draft:**
`;

    return context;
  };

  const handleStartDraft = () => {
    setIsDraftingReply(true);
  };

  const handleCloseDraft = () => {
    // Check if there's unsaved content
    if (notepadRef.current?.hasUnsavedContent?.()) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to close?');
      if (!confirmed) return;
    }
    setIsDraftingReply(false);
  };

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
      
      // Close the draft
      setIsDraftingReply(false);
      
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
    statusLoading,
    deleteLoading,
    categoryLoading,
    categoryError
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

  // Get email thread messages from gmailData for ConversationThreads
  const getEmailThreadForConversation = () => {
    if (!gmailData || !gmailData.data) return [];
    
    const messages = gmailData.data.messages || [];
    return messages.map((message: any, index: number) => ({
      id: message.id || `msg-${index}`,
      from: message.from || gmailData.data.from || 'Unknown',
      email: message.email || gmailData.data.from || 'unknown@example.com',
      subject: message.subject || gmailData.data.subject || 'No Subject',
      body: message.body || message.snippet || 'No content available',
      timestamp: message.timestamp || gmailData.createdAt || new Date().getTime(),
      isReply: index > 0,
      isFromUser: message.from === userEmail || message.email === userEmail
    })).sort((a: any, b: any) => a.timestamp - b.timestamp);
  };

  const handleMessageSelect = (messageId: string) => {
    setSelectedMessageId(messageId);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 md:p-4 space-y-4 md:space-y-6">
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
                    <ChevronDown className="w-3 h-3 ml-1" />
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
                    <ChevronDown className="w-3 h-3 ml-1" />
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

            {/* Expand Icon */}
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
              <Maximize2 className="w-4 h-4" />
            </Button>
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
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                  <Star className="w-4 h-4" />
                </Button>
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

        {/* Email Thread Summary */}
        <Card className="p-2 md:p-3 rounded-xl">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-foreground text-sm md:text-base">
              Summary
            </h3>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <ExternalLink className="w-3 h-3" />
            </Button>
          </div>
          
          <div className="flex items-center gap-4 text-sm mt-2">
            <div className="flex items-center">
              <MessageSquare className="w-4 h-4 mr-1 text-muted-foreground" />
              <span className="text-foreground">Messages: {partnership.messageCount}</span>
            </div>
            
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1 text-muted-foreground" />
              <span className="text-foreground">Last Activity: {formatTimeAgo(partnership.lastActivity)}</span>
            </div>
            
            <div className="flex items-center">
              <DollarSign className="w-4 h-4 mr-1 text-muted-foreground" />
              <span className="text-foreground font-medium">Estimated Value: {formatValue(partnership.estimatedValue)}</span>
            </div>
          </div>
        </Card>


      </div>

      {/* Conversation Threads - New Design */}
      <div className="mx-3 md:mx-4 mb-3 md:mb-4">
        <Card className="rounded-xl">
          <div className="p-3 md:p-4">
            <ConversationThreads
              messages={getEmailThreadForConversation()}
              userEmail={userEmail}
              onMessageSelect={handleMessageSelect}
              selectedMessageId={selectedMessageId}
              onStartDraft={handleStartDraft}
            />
          </div>
        </Card>
      </div>

      {/* Associated Smart Notes */}
      <div className="p-3 md:p-4 pt-0">
        <Card className="p-3 md:p-4">
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

      {/* MarkdownNotepad for Email Drafting */}
      <MarkdownNotepad
        ref={notepadRef}
        isOpen={isDraftingReply}
        onClose={handleCloseDraft}
        onSendToChat={handleSendReply}
        quotedContent={isDraftingReply ? getEmailContext() : undefined}
        onClearQuoted={() => {}} // Context is pre-loaded, not quoted
        width={notepadWidth}
        onWidthChange={setNotepadWidth}
        style={{ 
          position: 'fixed',
          top: 0,
          right: 0,
          zIndex: 50
        }}
        availableNotes={[]} // TODO: Load related partnership notes
        onLinkNote={(noteId) => {
          // TODO: Handle note linking for partnership context
          console.log('Linking note:', noteId);
        }}
      />
    </div>
  );
} 