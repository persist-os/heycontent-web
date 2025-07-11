"use client";

import React, { useCallback, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/app/context/auth-context';
import { 
  Mail, 
  Calendar,
  User,
  MessageCircle,
  ExternalLink,
  FileText,
  Clock,
  MoreVertical,
  Heart
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MarkdownRenderer } from '@/app/dashboard/chat/markdown-renderer';

interface GmailOverlayProps {
  threadId: string;
  onClose: () => void;
  showAnalysis?: boolean;
  // Optional pre-fetched data to avoid Convex query
  preFetchedData?: any;
  hideDiscussButton?: boolean;
}

// Skeleton loading component
const GmailSkeletonLoader = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
    <div className="bg-background rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
      {/* Header Skeleton */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex items-center gap-3">
              <Mail className="w-8 h-8 text-red-500" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-80" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-24" />
                  <span>•</span>
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in Gmail
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Thread Info Skeleton */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Thread Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">From:</span>
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MessageCircle className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Messages:</span>
                  <Skeleton className="h-4 w-8" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Created:</span>
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Latest:</span>
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Messages Skeleton */}
        <div className="space-y-4 mb-8">
          {[1, 2].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" disabled>
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-4 w-3/5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Error component with human-friendly messaging
const ErrorState = ({ onClose, error }: { onClose: () => void; error?: string }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4 text-center">
      <div className="flex justify-center mb-4">
        <Heart className="w-12 h-12 text-pink-500" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Your inbox is taking a quick breather!</h3>
      <p className="text-muted-foreground mb-4">
        {error === "Invalid thread data received" 
          ? "We couldn't find that specific email thread, but that's totally okay! Sometimes the best opportunities are still on their way to your inbox."
          : error === "Thread contains no valid data" 
          ? "This thread seems to be playing hide and seek with us. No worries—keep creating amazing content, and your email opportunities will find you!"
          : "Even the most organized inboxes have their mysterious moments. Thanks for your patience while we sort things out!"
        }
      </p>
      <p className="text-sm text-muted-foreground mb-6">
        💡 <strong>Creator tip:</strong> While you're here, why not brainstorm your next collaboration idea? The best partnerships often start with a simple "hello" email!
      </p>
      <Button onClick={onClose} className="w-full">
        Keep Creating! ✨
      </Button>
    </div>
  </div>
);

export const GmailOverlay: React.FC<GmailOverlayProps> = ({
  threadId,
  onClose,
  showAnalysis = true,
  preFetchedData,
  hideDiscussButton = false
}) => {
  const { firebaseUser } = useAuth();
  const userId = firebaseUser?.uid;
  const [refreshKey, setRefreshKey] = useState(0);

  // Always call the hook, but only use the result if no pre-fetched data
  const queryResult = useQuery(api.gmailQueries.getGmailThreadForLinking, {
    threadId,
    userId: userId || ''
  });
  
  // Use pre-fetched data if available, otherwise use query result
  const thread = preFetchedData || queryResult;

  // Callback to handle analysis generation - this will trigger a refetch
  const handleAnalysisGenerated = useCallback(() => {
    // Force a re-render by updating the key
    setTimeout(() => {
      setRefreshKey(prev => prev + 1);
      console.log('Analysis generated, triggering component refresh');
    }, 2000);
  }, []);

  // Handle loading state with skeleton
  if (!thread) {
    return <GmailSkeletonLoader onClose={onClose} />;
  }

  // Handle error state - check if thread data is invalid
  if (!thread.threadId && !thread.data) {
    return <ErrorState onClose={onClose} error="Invalid thread data received" />;
  }

  // Extract and validate core data with proper null safety
  const threadData = thread.data || thread;
  
  // Core properties with single null checks
  const subject = threadData.subject || 'No Subject';
  const fromField = threadData.from || 'Unknown Sender';
  const category = thread.category || 'none';
  const messageCount = threadData.message_count || 1;
  const createdAt = thread.createdAt || threadData.timestamp || Date.now();
  const messages = threadData.messages || [];

  // Validate required data exists
  if (!subject && !fromField && messageCount === 0) {
    return <ErrorState onClose={onClose} error="Thread contains no valid data" />;
  }

  // Helper functions
  const formatDate = (timestamp: number | string | null | undefined): string => {
    if (!timestamp) return 'Unknown Date';
    
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (email: string | null | undefined): string => {
    if (!email || typeof email !== 'string') return '?';
    
    const name = email.split('<')[0].trim() || email.split('@')[0];
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const extractEmail = (emailString: string | null | undefined): string => {
    if (!emailString || typeof emailString !== 'string') return 'unknown@email.com';
    
    const match = emailString.match(/<(.+)>/);
    return match ? match[1] : emailString;
  };

  const extractName = (emailString: string | null | undefined): string => {
    if (!emailString || typeof emailString !== 'string') return 'Unknown';
    
    const match = emailString.split('<')[0].trim();
    return match || emailString.split('@')[0];
  };

  // Get most recent message date with proper null safety
  const getMostRecentDate = (): number => {
    if (messages.length > 0) {
      const validDates = messages
        .map((msg: any) => {
          const msgDate = msg?.date || createdAt;
          const date = new Date(msgDate);
          return isNaN(date.getTime()) ? null : date.getTime();
        })
        .filter((date): date is number => date !== null);
      
      return validDates.length > 0 ? Math.max(...validDates) : createdAt;
    }
    return createdAt;
  };

  // Get category color for subtitle
  const getCategoryColor = (cat: string): string => {
    switch (cat) {
      case 'partnership': return 'text-blue-600';
      case 'media': return 'text-purple-600';
      case 'business': return 'text-green-600';
      case 'community': return 'text-orange-600';
      default: return 'text-muted-foreground';
    }
  };

  // Prepare normalized data
  const normalizedThreadData = {
    id: `gmail:${threadId}`,
    title: subject.length > 80 ? subject.substring(0, 80) + '...' : subject,
    type: 'gmail',
    platform: 'gmail',
    createdAt,
    ...thread,
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Mail className="w-8 h-8 text-red-500" />
                <div>
                  <h1 className="text-2xl font-bold line-clamp-1">{subject}</h1>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>Gmail Thread</span>
                    <span>•</span>
                    <span>{messageCount} message{messageCount !== 1 ? 's' : ''}</span>
                    {category !== 'none' && (
                      <>
                        <span>•</span>
                        <Badge className={getCategoryColor(category)}>
                          {category}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const gmailUrl = `https://mail.google.com/mail/u/0/#inbox/${threadId}`;
                  window.open(gmailUrl, '_blank');
                }}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in Gmail
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                ✕
              </Button>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Thread Metadata */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Thread Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">From:</span>
                    <span>{fromField}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MessageCircle className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Messages:</span>
                    <span>{messageCount}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Created:</span>
                    <span>{formatDate(createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Latest:</span>
                    <span>{formatDate(getMostRecentDate())}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Email Thread */}
          <div className="space-y-4 mb-8">
            {messages.length > 0 ? (
              messages.map((message: any, index: number) => {
                if (!message) return null;
                
                const messageFrom = message.from || fromField;
                const messageDate = message.date || createdAt;
                const messageContent = message.body || message.htmlBody || message.snippet || 'No content available';
                
                return (
                  <Card key={message.id || index} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                          {getInitials(messageFrom)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium text-sm">
                                {extractName(messageFrom)}
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                {extractEmail(messageFrom)}
                              </p>
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                              <Clock className="w-3 h-3" />
                              {formatDate(messageDate)}
                            </div>
                          </div>
                          
                          {message.subject && message.subject !== subject && (
                            <p className="text-sm text-muted-foreground mt-1">
                              <strong>Re:</strong> {message.subject}
                            </p>
                          )}
                          
                          {message.to && (
                            <p className="text-xs text-muted-foreground mt-1">
                              <strong>To:</strong> {message.to}
                            </p>
                          )}
                        </div>
                        
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="bg-muted/30 rounded-lg p-4">
                        <div className="text-sm whitespace-pre-wrap leading-relaxed">
                          {messageContent}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              // Fallback for single message or no messages array
              <Card className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                      {getInitials(fromField)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-sm">
                            {extractName(fromField)}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {extractEmail(fromField)}
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          {formatDate(createdAt)}
                        </div>
                      </div>
                    </div>
                    
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">
                      {threadData.snippet || 'No content preview available'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Analysis Section */}
          {thread.analysis && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Email Analysis
                </CardTitle>
                <CardDescription>Smart insights about this email thread</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="text-sm">
                    {typeof thread.analysis === 'string' ? (
                      <MarkdownRenderer content={thread.analysis} />
                    ) : (
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(thread.analysis, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}; 