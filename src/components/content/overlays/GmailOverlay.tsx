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
  MoreVertical
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MarkdownRenderer } from '@/app/dashboard/chat/markdown-renderer';

interface GmailOverlayProps {
  threadId: string;
  onClose: () => void;
  showAnalysis?: boolean;
  // Optional pre-fetched data to avoid Convex query
  preFetchedData?: any;
  hideDiscussButton?: boolean;
}

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

  // Use pre-fetched data if available, otherwise fetch from Convex
  const thread = preFetchedData || useQuery(api.gmailQueries.getGmailThreadForLinking, {
    threadId,
    userId: userId || ''
  });

  // Debug: Log the raw thread data
  console.log('Raw Gmail thread data:', thread);

  // Callback to handle analysis generation - this will trigger a refetch
  const handleAnalysisGenerated = useCallback(() => {
    // Force a re-render by updating the key
    setTimeout(() => {
      setRefreshKey(prev => prev + 1);
      console.log('Analysis generated, triggering component refresh');
    }, 2000);
  }, []);

  // Early return if thread is not loaded yet
  if (!thread) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-center mb-4">
            <h3 className="text-lg font-semibold">Loading...</h3>
          </div>
          <div className="w-full h-32 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  // Normalize to a consistent format
  const subject = thread?.subject || thread?.data?.subject || 'No Subject';
  const from = thread?.from || thread?.data?.from || 'Unknown Sender';
  const category = thread?.category || 'none';
  const messageCount = thread?.message_count || thread?.data?.message_count || 1;

  // Get category color for subtitle
  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'partnership': return 'text-blue-600';
      case 'media': return 'text-purple-600';
      case 'business': return 'text-green-600';
      case 'community': return 'text-orange-600';
      default: return 'text-muted-foreground';
    }
  };

  const threadData = thread && {
    id: `gmail:${thread.threadId}`,
    title: subject.length > 80 ? subject.substring(0, 80) + '...' : subject,
    type: 'gmail',
    platform: 'gmail',
    createdAt: thread.createdAt || Date.now(),
    // Pass through all the original thread data
    ...thread,
  };

  // Debug: Log the normalized thread data
  console.log('Normalized Gmail thread data:', threadData);

  // Helper functions
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (email: string) => {
    if (!email) return '?';
    const name = email.split('<')[0].trim() || email.split('@')[0];
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const extractEmail = (emailString: string) => {
    const match = emailString.match(/<(.+)>/);
    return match ? match[1] : emailString;
  };

  const extractName = (emailString: string) => {
    const match = emailString.split('<')[0].trim();
    return match || emailString.split('@')[0];
  };

  // Extract thread info
  const messages = thread.messages || thread.data?.messages || [];
  const mainFrom = thread.from || thread.data?.from || 'Unknown Sender';
  
  // Get most recent message date
  const getMostRecentDate = () => {
    if (messages.length > 0) {
      // Get the latest message date
      const dates = messages
        .map(msg => new Date(msg.date || thread.createdAt).getTime())
        .filter(date => !isNaN(date));
      return dates.length > 0 ? Math.max(...dates) : thread.createdAt;
    }
    return thread.createdAt;
  };

  // This loading check is now redundant since we check above, but keeping for safety
  if (!threadData) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-center mb-4">
            <h3 className="text-lg font-semibold">Loading...</h3>
          </div>
          <div className="w-full h-32 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

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
          {/* Thread Metadata at top */}
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
                    <span>{mainFrom}</span>
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
                    <span>{formatDate(thread.createdAt)}</span>
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
            {messages.length > 0 ? messages.map((message: any, index: number) => (
              <Card key={message.id || index} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                      {getInitials(message.from || mainFrom)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-sm">
                            {extractName(message.from || mainFrom)}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {extractEmail(message.from || mainFrom)}
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          {formatDate(new Date(message.date || thread.createdAt).getTime())}
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
                      {message.body || message.htmlBody || message.snippet || 'No content available'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )) : (
              // Fallback for single message or no messages array
              <Card className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                      {getInitials(mainFrom)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-sm">
                            {extractName(mainFrom)}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {extractEmail(mainFrom)}
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          {formatDate(thread.createdAt)}
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
                       {thread.snippet || thread.data?.snippet || 'No content preview available'}
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
                <CardDescription>AI-powered insights about this email thread</CardDescription>
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