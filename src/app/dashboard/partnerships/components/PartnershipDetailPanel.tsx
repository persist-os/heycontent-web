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
  Star
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
    const messages = getEmailThread();
    
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

  const handleSendReply = (content: string) => {
    // TODO: Implement email sending via Gmail API
    console.log('Sending reply for partnership:', partnership?.id, content);
    
    // For now, just close the draft
    setIsDraftingReply(false);
    
    // Update partnership status to indicate reply sent
    if (partnership) {
      onUpdatePartnership(partnership.id, {
        lastActivity: new Date().getTime(),
        status: partnership.status === 'opportunity' ? 'inquiry' : partnership.status
      });
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
        `#${partnership.status}`
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
      <div className="flex items-center justify-center h-full text-center">
        <div className="space-y-4">
          <div className="p-4 rounded-full bg-muted">
            <Mail className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">Ready to dive into your next collaboration?</h3>
            <p className="text-sm text-muted-foreground">
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

  // Get email thread messages from gmailData
  const getEmailThread = () => {
    if (!gmailData || !gmailData.data) return [];
    
    const messages = gmailData.data.messages || [];
    return messages.map((message: any, index: number) => ({
      id: message.id || `msg-${index}`,
      from: message.from || gmailData.data.from || 'Unknown',
      subject: message.subject || gmailData.data.subject || 'No Subject',
      body: message.body || message.snippet || 'No content available',
      timestamp: message.timestamp || gmailData.createdAt || new Date().getTime(),
      isReply: index > 0
    })).sort((a: any, b: any) => a.timestamp - b.timestamp);
  };

  const renderEmailThread = () => {
    const messages = getEmailThread();
    
    if (messages.length === 0) {
      return (
        <div className="p-4 text-center text-muted-foreground">
          <p>No email content available</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {messages.map((message: any, index: number) => (
          <div key={message.id} className={`p-4 rounded-lg border ${
            message.isReply 
              ? 'bg-primary/5 border-primary/20' 
              : 'bg-muted border-border'
          }`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-foreground">
                    {message.from}
                  </span>
                  {message.isReply && (
                    <Badge variant="outline" className="text-xs">
                      Reply
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {new Date(message.timestamp).toISOString().replace('T', ' ').substring(0, 19)}
                </p>
              </div>
            </div>
            
            {message.subject !== (messages[0]?.subject || '') && (
              <p className="text-sm font-medium text-foreground mb-2">
                Re: {message.subject}
              </p>
            )}
            
            <div className="prose prose-sm max-w-none text-foreground">
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {message.body}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground">{partnership.brandName}</h2>
            <p className="text-sm text-muted-foreground">{partnership.subject}</p>
            {/* Partnership Controls */}
            <div className="mt-4">
              <PartnershipControls
                partnership={partnership}
                onUpdateStatus={handleStatusChange}
                onUpdateCategory={handleCategoryChange}
                onDelete={handleDelete}
                statusLoading={statusLoading}
                categoryLoading={categoryLoading}
                deleteLoading={deleteLoading}
                categoryError={categoryError}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Email Thread Summary */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-foreground flex items-center">
              <Mail className="w-4 h-4 mr-2" />
              Thread Summary
            </h3>
            <Button variant="outline" className="w-10 h-10">
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Messages:</span>
              <span className="text-foreground flex items-center">
                <MessageSquare className="w-3 h-3 mr-1" />
                {partnership.messageCount}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Last Activity:</span>
              <span className="text-foreground flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {formatTimeAgo(partnership.lastActivity)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Est. Value:</span>
              <span className="text-foreground flex items-center font-medium">
                <DollarSign className="w-3 h-3 mr-1" />
                {formatValue(partnership.estimatedValue)}
                            </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">From:</span>
              <span className="text-foreground truncate">{partnership.from || 'Unknown'}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Email Thread Conversation */}
      <Card className="p-4">
        <div className="space-y-4">
          <h3 className="font-medium text-foreground flex items-center">
            <MessageSquare className="w-4 h-4 mr-2" />
            Conversation Thread
          </h3>
          {renderEmailThread()}
        </div>
      </Card>

      {/* Associated Smart Notes */}
      <Card className="p-4">
        <div className="space-y-4">
          <h3 className="font-medium text-foreground flex items-center">
            <FileText className="w-4 h-4 mr-2" />
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
                      {/* Type as plain white text, no Badge */}
                      {note.type && (
                        <span className="text-xs font-medium text-foreground">
                          {note.type.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    {note.content && (
                      <p className="text-xs text-muted-foreground mb-1">
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
              <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Perfect canvas for your next masterpiece</p>
              <p className="text-xs text-muted-foreground mt-1">
                Create notes about this partnership and watch your collaboration strategy come to life right here
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Draft Reply Section */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-foreground flex items-center">
              <Edit3 className="w-4 h-4 mr-2" />
              Draft Reply
            </h3>
            {!isDraftingReply && (
              <Button onClick={handleStartDraft}>
                Start Draft
              </Button>
            )}
          </div>

          {!isDraftingReply && (
            <p className="text-sm text-muted-foreground">
              Ready to craft the perfect response? Start drafting and our AI will help you create compelling partnership replies that get results
            </p>
          )}
        </div>
      </Card>

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