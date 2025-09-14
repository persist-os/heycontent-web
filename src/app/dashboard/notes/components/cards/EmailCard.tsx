import React from 'react';
import { Mail, Send, Edit3, Clock, User, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import { Note } from '../../types';
import { BaseCard } from './BaseCard';
import { cn } from '@/lib/utils';
import { useDraggable } from '@dnd-kit/core';

interface EmailCardProps {
  note: Note;
  availableNotes?: Array<{ _id: string; title: string; type?: string }>;
  onEdit?: (note: Note) => void;
  onDelete?: (noteId: string) => void;
  onToggleImportant?: (noteId: string) => void;
  onUpdate?: (noteId: string, updates: any) => void;
  onShare?: (noteId: string) => void;
  isDraggable?: boolean;
  isOverlay?: boolean;
}

export function EmailCard({
  note,
  availableNotes = [],
  onEdit,
  onDelete,
  onToggleImportant,
  onUpdate,
  onShare,
  isDraggable = false,
  isOverlay = false
}: EmailCardProps) {
  // Drag and drop setup
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: String(note._id),
    data: {
      type: 'note',
      note: note,
    },
    disabled: !isDraggable || isOverlay,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  // Extract email-specific information from note content or tags
  const extractEmailInfo = () => {
    const content = note.content || '';
    const tags = note.tags || [];
    
    // Try to extract email subject from title or content
    const subject = note.title?.replace(/^Email Draft:\s*/, '') || 'No Subject';
    
    // Try to extract brand/recipient from tags or content
    const brandTag = tags.find(tag => tag.startsWith('#') && !['#email-draft', '#partnership', '#draft', '#sent', '#scheduled', '#failed'].includes(tag));
    const brand = brandTag?.replace('#', '').replace(/-/g, ' ') || 'Unknown Recipient';
    
    // Try to extract partnership status from tags
    const partnershipStatusTag = tags.find(tag => ['#opportunity', '#inquiry', '#negotiating', '#active', '#completed'].includes(tag));
    const partnershipStatus = partnershipStatusTag?.replace('#', '') || 'opportunity';
    
    // Try to extract email status from tags or content
    const emailStatusTag = tags.find(tag => ['#draft', '#sent', '#scheduled', '#failed'].includes(tag));
    let emailStatus = emailStatusTag?.replace('#', '') || 'draft';
    
    // Also check if content contains send status indicators
    if (!emailStatusTag) {
      if (content.includes('✅ Sent') || content.includes('Email sent successfully')) {
        emailStatus = 'sent';
      } else if (content.includes('⏰ Scheduled') || content.includes('Scheduled to send')) {
        emailStatus = 'scheduled';
      } else if (content.includes('❌ Failed') || content.includes('Failed to send')) {
        emailStatus = 'failed';
      }
    }
    
    return { subject, brand, partnershipStatus, emailStatus };
  };

  const { subject, brand, partnershipStatus, emailStatus } = extractEmailInfo();

  const getPartnershipStatusColor = (status: string) => {
    switch (status) {
      case 'opportunity': return 'text-primary';
      case 'inquiry': return 'text-blue-600';
      case 'negotiating': return 'text-amber-600';
      case 'active': return 'text-green-600';
      case 'completed': return 'text-gray-600';
      default: return 'text-muted-foreground';
    }
  };

  const getPartnershipStatusIcon = (status: string) => {
    switch (status) {
      case 'opportunity': return <Mail className="w-3 h-3" />;
      case 'inquiry': return <Send className="w-3 h-3" />;
      case 'negotiating': return <Edit3 className="w-3 h-3" />;
      case 'active': return <Clock className="w-3 h-3" />;
      case 'completed': return <User className="w-3 h-3" />;
      default: return <Edit3 className="w-3 h-3" />;
    }
  };

  const getEmailStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'text-green-600';
      case 'scheduled': return 'text-blue-600';
      case 'failed': return 'text-red-600';
      case 'draft': return 'text-amber-600';
      default: return 'text-muted-foreground';
    }
  };

  const getEmailStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircle className="w-3 h-3" />;
      case 'scheduled': return <Calendar className="w-3 h-3" />;
      case 'failed': return <AlertCircle className="w-3 h-3" />;
      case 'draft': return <Edit3 className="w-3 h-3" />;
      default: return <Edit3 className="w-3 h-3" />;
    }
  };

  const getEmailStatusLabel = (status: string) => {
    switch (status) {
      case 'sent': return 'Sent';
      case 'scheduled': return 'Scheduled';
      case 'failed': return 'Failed';
      case 'draft': return 'Draft';
      default: return 'Draft';
    }
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (!content) return '';
    // Remove markdown formatting and extract text
    const textContent = content.replace(/\*\*(.*?)\*\*/g, '$1')
                             .replace(/\*(.*?)\*/g, '$1')
                             .replace(/#{1,6}\s/g, '')
                             .replace(/\n/g, ' ')
                             .trim();
    
    if (textContent.length <= maxLength) return textContent;
    return textContent.substring(0, maxLength).trim() + '...';
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <BaseCard
        note={note}
        className={cn(
          "email-card",
          isDragging && "opacity-50 scale-95"
        )}
        hoverBgClass="hover:bg-orange-50/50 dark:hover:bg-orange-950/20"
        onEdit={onEdit}
        onDelete={onDelete}
        onToggleImportant={onToggleImportant}
        onShare={onShare}
        isDragging={isDragging}
        isOverlay={isOverlay}
      >
        {/* Email Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="flex items-center justify-center w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-full flex-shrink-0">
              <Mail className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                  Email Draft
                </span>
                                 <div className={cn("flex items-center gap-1 text-xs", getPartnershipStatusColor(partnershipStatus))}>
                   {getPartnershipStatusIcon(partnershipStatus)}
                   <span className="capitalize">{partnershipStatus}</span>
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* Email Subject */}
        <div className="mb-3">
          <h3 className="font-medium text-foreground text-sm line-clamp-2 mb-1">
            {subject}
          </h3>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <User className="w-3 h-3" />
            To: {brand}
          </p>
        </div>

        {/* Email Content Preview */}
        {note.content && (
          <div className="mb-3">
            <p className="text-sm text-muted-foreground line-clamp-3">
              {truncateContent(note.content)}
            </p>
          </div>
        )}

                 {/* Email Stats */}
         <div className="flex items-center justify-between text-xs mt-3 pt-3 border-t border-border">
           <span className={cn("flex items-center gap-1", getEmailStatusColor(emailStatus))}>
             {getEmailStatusIcon(emailStatus)}
             {getEmailStatusLabel(emailStatus)}
           </span>
           <span className="flex items-center gap-1 text-muted-foreground">
             <Clock className="w-3 h-3" />
             {new Date(note.updatedAt || note._creationTime).toLocaleDateString([], {
               month: 'short',
               day: 'numeric'
             })}
           </span>
         </div>
      </BaseCard>
    </div>
  );
} 