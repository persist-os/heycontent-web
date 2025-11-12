/**
 * EMAIL LAYOUT
 * 
 * Renders email artifacts with compose UI.
 * Supports draft, scheduled, and sent statuses.
 * Design Spec: Email composer with send/schedule actions
 */

'use client'

import React, { useState, useEffect, useRef } from 'react'
import { EmailArtifact, LayoutProps } from '@/types/artifacts'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Pencil, Mail, Send, Calendar, CheckCircle, Clock, AlertCircle, X, History, ExternalLink, Reply, ChevronDown } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useGmailAuth } from '@/app/hooks/useGmailAuth'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { fetchWithApiKey } from '@/app/lib/api-helpers'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'

export function EmailLayout({ 
  artifact,
  editable = false,
  onUpdate,
  editButton
}: LayoutProps<EmailArtifact>) {
  // Gmail auth check
  const { isAuthenticated, isLoading: authLoading, isConnecting, connectGmail } = useGmailAuth()
  
  // Query actions table for send history and computed status
  const artifactStatus = useQuery(api.actionQueries.getArtifactStatus, { artifactId: artifact._id })
  const artifactActions = useQuery(api.actionQueries.getArtifactActions, { 
    artifactId: artifact._id,
    actionType: 'artifact_email_send'
  })
  
  // Compute send history from actions
  const sendHistory = artifactActions?.map(action => ({
    timestamp: action.createdAt,
    to: action.actionData?.to || '',
    subject: action.actionData?.subject || '',
    status: action.status === 'completed' ? 'sent' : 'failed',
    emailId: action.actionData?.emailId,
    threadId: action.actionData?.threadId,
    error: action.error || action.actionData?.error,
    scheduledAt: action.scheduledAt
  })) || []
  
  // Use computed status (fallback to 'draft' if not loaded)
  const computedStatus = artifactStatus || 'draft'
  
  // Defensive: ensure all required properties exist
  const data_model = artifact?.data_model || { layout: 'compose' as const }
  const data = artifact?.data || { 
    to: '', 
    subject: '', 
    body: ''
  }
  const metadata = artifact?.metadata || {
    version: 1,
    lastUpdatedBy: 'unknown',
    lastUpdatedAt: Date.now()
  }

  const [emailContent, setEmailContent] = useState(data.body || '')
  const [toEmail, setToEmail] = useState(data.to || '')
  const [subject, setSubject] = useState(data.subject || '')
  const [isScheduleOpen, setIsScheduleOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isSendConfirmOpen, setIsSendConfirmOpen] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  // Removed isSending state - Convex reactivity handles UI updates after send
  const [scheduledDateTime, setScheduledDateTime] = useState(
    (data as any).scheduledAt ? new Date((data as any).scheduledAt).toISOString().slice(0, 16) : ''
  )
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)

  // Sync state when artifact data changes
  // CRITICAL: Watch entire data object to ensure component syncs with Convex reactive updates
  // Watching data object reference catches all changes including sendHistory and replies
  useEffect(() => {
    if (data.body) {
      setEmailContent(data.body)
    } else {
      setEmailContent('')
    }
    if (data.to) {
      setToEmail(data.to)
    }
    if (data.subject) {
      setSubject(data.subject)
    }
    if ((data as any).scheduledAt) {
      setScheduledDateTime(new Date((data as any).scheduledAt).toISOString().slice(0, 16))
    }
    // Note: sendHistory and replies changes will trigger re-render via data object reference
    // Convex reactive queries return new object references when any property changes
  }, [data]) // Watch data object - catches all changes including sendHistory and replies

  // Sync editor innerHTML with emailContent state (always treat as HTML)
  useEffect(() => {
    if (editorRef.current) {
      const currentHTML = editorRef.current.innerHTML
      const targetHTML = emailContent || ''
      
      // Only update if different to avoid cursor position issues
      if (currentHTML !== targetHTML) {
        editorRef.current.innerHTML = targetHTML
      }
    }
  }, [emailContent])

  // Format timestamp for display
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  // Format timestamp with relative time (e.g., "2 hours ago")
  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    return 'Just now'
  }

  // Generate time slots (8am to 6pm)
  const generateTimeSlots = (): string[] => {
    return ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00']
  }

  // Format time slot for display (e.g., "08:00" -> "8:00 AM")
  const formatTimeSlot = (time: string): string => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${displayHour}:${minutes} ${ampm}`
  }

  // Check if time is in the past for a given date
  const isTimeInPast = (date: Date, time: string): boolean => {
    const [hours, minutes] = time.split(':')
    const dateTime = new Date(date)
    dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)
    return dateTime < new Date()
  }

  // Get date for "Today"
  const getToday = (): Date => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today
  }

  // Get date for "Tomorrow"
  const getTomorrow = (): Date => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    return tomorrow
  }

  // Get dates for current week (Mon-Sun) with Today/Tomorrow labels
  const getWeekDays = (): Array<{ date: Date; label: string }> => {
    const today = getToday()
    const tomorrow = getTomorrow()
    const todayDay = today.getDay()
    
    // Calculate Monday of current week
    const mondayOffset = todayDay === 0 ? -6 : 1 - todayDay
    const monday = new Date(today)
    monday.setDate(today.getDate() + mondayOffset)
    monday.setHours(0, 0, 0, 0)
    
    const days: Array<{ date: Date; label: string }> = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)
      
      let label: string
      if (date.getTime() === today.getTime()) {
        label = 'Today'
      } else if (date.getTime() === tomorrow.getTime()) {
        label = 'Tomorrow'
      } else {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        label = dayNames[date.getDay()]
      }
      
      days.push({ date, label })
    }
    return days
  }

  // Format natural language preview (e.g., "Tomorrow at 8:00 AM")
  const formatNaturalLanguage = (date: Date | null, time: string | null): string => {
    if (!date || !time) return 'Select date and time'
    
    const today = getToday()
    const tomorrow = getTomorrow()
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    const timeStr = `${displayHour}:${minutes.padStart(2, '0')} ${ampm}`
    
    if (date.getTime() === today.getTime()) {
      return `Today at ${timeStr}`
    }
    if (date.getTime() === tomorrow.getTime()) {
      return `Tomorrow at ${timeStr}`
    }
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${dayNames[date.getDay()]}, ${monthNames[date.getMonth()]} ${date.getDate()} at ${timeStr}`
  }

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    setSelectedTime(null) // Clear time when date changes
  }

  // Handle time selection
  const handleTimeSelect = (time: string) => {
    if (selectedDate && !isTimeInPast(selectedDate, time)) {
      setSelectedTime(time)
    }
  }

  // Reset schedule modal state when dialog opens/closes
  useEffect(() => {
    if (!isScheduleOpen) {
      setSelectedDate(null)
      setSelectedTime(null)
    } else {
      // Initialize with today if no date selected
      if (!selectedDate) {
        setSelectedDate(getToday())
      }
    }
  }, [isScheduleOpen, selectedDate])

  // Get status badge variant - Show computed status from actions table
  const getStatusBadge = () => {
    const lastSend = sendHistory.length > 0 ? sendHistory[sendHistory.length - 1] : null
    
    // Show last send status if history exists
    if (lastSend) {
      if (lastSend.status === 'sent') {
        return (
          <Badge variant="success">
            <CheckCircle className="w-3 h-3 mr-1" />
            Sent ({sendHistory.length}x)
          </Badge>
        )
      } else if (lastSend.status === 'failed') {
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        )
      }
    }
    
    // Fall back to computed status
    switch (computedStatus) {
      case 'sent':
        return (
          <Badge variant="success">
            <CheckCircle className="w-3 h-3 mr-1" />
            Sent
          </Badge>
        )
      case 'scheduled':
        return (
          <Badge variant="default" className="bg-primary/10 text-primary-foreground">
            <Clock className="w-3 h-3 mr-1" />
            Scheduled
          </Badge>
        )
      default:
        return <Badge variant="outline">Draft</Badge>
    }
  }

  // Handle email content changes from editor (always preserve HTML)
  const handleEditorInput = (e: React.FormEvent<HTMLDivElement>) => {
    const content = e.currentTarget.innerHTML || ''
    setEmailContent(content)
  }

  // Handle Gmail auth check and connection
  const ensureGmailAuth = async (): Promise<boolean> => {
    if (isAuthenticated) {
      return true
    }
    
    // Show auth modal
    setIsAuthModalOpen(true)
    return false
  }

  const handleConnectGmail = async () => {
    try {
      setAuthError(null)
      await connectGmail()
      // connectGmail will reload the page on success, so we don't need to close modal here
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Failed to connect Gmail')
    }
  }

  // Validate form fields
  const validateForm = (): boolean => {
    if (!toEmail.trim() || !subject.trim() || !emailContent.trim()) {
      setValidationError('Please fill in all required fields (To, Subject, Body)')
      return false
    }
    setValidationError(null)
    return true
  }

  // Handle send action
  const handleSendClick = async () => {
    if (!validateForm()) {
      return
    }

    // Check Gmail auth first
    if (!isAuthenticated) {
      await ensureGmailAuth()
      return
    }

    // Show confirmation dialog
    setIsSendConfirmOpen(true)
  }

  const handleSendConfirm = async () => {
    setIsSendConfirmOpen(false)
    
    try {
      // Backend handles all artifact updates atomically (form data + actions table)
      // Frontend only displays data, doesn't update it
      const response = await fetchWithApiKey('/api/emails/send-artifact', {
        method: 'POST',
        body: JSON.stringify({
          artifact_id: artifact._id,
          // Send current form data to backend so it can update artifact atomically
          to: toEmail,
          subject: subject,
          body: emailContent
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to send email' }))
        throw new Error(errorData.error || errorData.detail || 'Failed to send email')
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to send email')
      }
      
      // Convex reactive queries will automatically update via useQuery hooks
      // Actions table update triggers artifactActions query re-fetch
      // No manual state management needed - Convex handles reactivity
      
    } catch (error) {
      console.error('Error sending email:', error)
      setValidationError(error instanceof Error ? error.message : 'Failed to send email')
      // Show error in validation area, don't reopen dialog
    }
  }

  // SCHEDULING TEMPORARILY DISABLED - Commented out for merge
  // Handle schedule action
  // const handleScheduleClick = async () => {
  //   if (!selectedDate || !selectedTime) {
  //     setValidationError('Please select a date and time')
  //     return
  //   }

  //   if (!validateForm()) {
  //     return
  //   }

  //   // Check Gmail auth first
  //   if (!isAuthenticated) {
  //     await ensureGmailAuth()
  //     return
  //   }

  //   // Combine selected date and time
  //   const [hours, minutes] = selectedTime.split(':')
  //   const scheduledDate = new Date(selectedDate)
  //   scheduledDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)
    
  //   const scheduledTimestamp = scheduledDate.getTime()
  //   if (onUpdate) {
  //     onUpdate({
  //       ...data,
  //       to: toEmail,
  //       subject: subject,
  //       body: emailContent,
  //       status: 'scheduled' as const,
  //       scheduledAt: scheduledTimestamp
  //     })
  //   }
  //   setIsScheduleOpen(false)
  // }

  // Check if fields are complete
  const isComplete = toEmail.trim() && subject.trim() && emailContent.trim()

  return (
    <>
      <Card className="bg-card/50 backdrop-blur-sm border border-accent/20 hover:bg-card/80 transition-all duration-300">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-foreground">Email</span>
              {editable && (
                <Pencil className="w-3 h-3 text-accent/60" />
              )}
              {getStatusBadge()}
            </div>
            <div className="flex items-center gap-2">
              {editButton}
              <Badge variant="outline" className="text-xs">
                v{metadata.version}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Validation Error */}
          {validationError && (
            <Alert className="border-destructive/50 bg-destructive/10">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-destructive">{validationError}</AlertDescription>
            </Alert>
          )}

          {/* Send errors shown via validationError */}

          {/* Reply Notification - Phase 6 */}
          {(data as any).replies && (data as any).replies.length > 0 && (
            <Alert className="border-primary/50 bg-primary/10 cursor-pointer hover:bg-primary/20 transition-colors" onClick={() => {
              // Scroll to replies section
              const repliesSection = document.querySelector('[data-replies-section]')
              if (repliesSection) {
                repliesSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
            }}>
              <Reply className="h-4 w-4 text-primary" />
              <AlertDescription className="text-primary font-medium">
                {(data as any).replies.length} new {(data as any).replies.length === 1 ? 'reply' : 'replies'} received
                <span className="ml-2 text-xs text-primary/70">Click to view →</span>
              </AlertDescription>
            </Alert>
          )}

          {/* Email Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/20 rounded-lg border">
            {/* To Field */}
            <div className="space-y-2">
              <Label htmlFor="to-email" className="text-sm font-medium">To</Label>
              <div className="relative">
                <Input
                  id="to-email"
                  type="email"
                  value={toEmail}
                  onChange={(e) => setToEmail(e.target.value)}
                  placeholder="recipient@example.com"
                  className="pl-9"
                />
                <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>

            {/* Subject Field */}
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-sm font-medium">Subject</Label>
              <Input
                id="subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter email subject..."
              />
            </div>
          </div>

          {/* Email Body Editor */}
          <div className="space-y-2">
            <Label htmlFor="email-body" className="text-sm font-medium">Body</Label>
            <div
              ref={editorRef}
              contentEditable={editable}
              onInput={handleEditorInput}
              suppressContentEditableWarning={true}
              className="min-h-[200px] max-h-[400px] overflow-y-auto border border-border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background text-foreground"
              style={{
                lineHeight: '1.6',
                fontSize: '14px'
              }}
            />
            {!emailContent && (
              <p className="text-xs text-muted-foreground">Type your email content here...</p>
            )}
          </div>

          {/* Gmail Auth Warning */}
          {!isAuthenticated && !authLoading && computedStatus === 'draft' && editable && (
            <Alert className="bg-yellow-500/10 border-yellow-500/20">
              <AlertCircle className="h-4 w-4 text-foreground" />
              <AlertDescription className="text-sm text-foreground">
                Connect your Gmail account to send emails.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons - Disabled only by form completeness + auth state (NOT editable prop) */}
          <div className="flex items-center gap-2 pt-2 border-t">
            <Button
              onClick={handleSendClick}
              disabled={!isComplete || authLoading || isConnecting}
              className="flex-1"
            >
              <Send className="w-4 h-4 mr-2" />
              {isConnecting ? 'Connecting...' : (sendHistory.length > 0 ? 'Send Again' : 'Send Now')}
            </Button>
            
            {/* SCHEDULING TEMPORARILY DISABLED - Commented out for merge */}
            {/* <Button
              variant="outline"
              disabled={!isComplete || authLoading || isConnecting}
              className="flex-1"
              onClick={() => setIsScheduleOpen(true)}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Schedule
            </Button> */}
          </div>

          {/* SCHEDULING TEMPORARILY DISABLED - Commented out for merge */}
          {/* Scheduled Info */}
          {/* {computedStatus === 'scheduled' && (data as any).scheduledAt && (
            <Alert className="bg-primary/10 border-primary/20">
              <Clock className="h-4 w-4 text-foreground" />
              <AlertDescription className="text-sm text-foreground">
                Scheduled for: {formatDate((data as any).scheduledAt)}
              </AlertDescription>
            </Alert>
          )} */}

          {/* Send History Section - Phase 7 */}
          {/* Always show history section, even when empty */}
          <Collapsible open={isHistoryOpen} onOpenChange={setIsHistoryOpen} className="pt-4 border-t">
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between w-full hover:bg-muted/30 rounded-lg p-2 -m-2 transition-colors">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-muted-foreground" />
                  <h4 className="text-sm font-semibold">Send History</h4>
                  {sendHistory.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {sendHistory.length} {sendHistory.length === 1 ? 'send' : 'sends'}
                    </Badge>
                  )}
                  {sendHistory.length === 0 && (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      No sends yet
                    </Badge>
                  )}
                </div>
                <ChevronDown 
                  className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                    isHistoryOpen ? 'transform rotate-180' : ''
                  }`}
                />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-3">
              {sendHistory.length > 0 ? (
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {/* Reverse chronological order (newest first) */}
                  {[...sendHistory].reverse().map((entry, index) => (
                    <div 
                      key={index} 
                      className="p-3 bg-muted/30 rounded-lg border border-border/50 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-foreground">
                              {formatDate(entry.timestamp)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({formatRelativeTime(entry.timestamp)})
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground space-y-0.5">
                            <div className="truncate">
                              <span className="font-medium">To:</span> {entry.to}
                            </div>
                            <div className="truncate">
                              <span className="font-medium">Subject:</span> {entry.subject}
                            </div>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {entry.status === 'sent' ? (
                            <Badge variant="success" className="text-xs">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Sent
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-xs">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Failed
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Gmail IDs and error details */}
                      {(entry.emailId || entry.threadId || entry.error) && (
                        <div className="mt-2 pt-2 border-t border-border/30 space-y-1">
                          {entry.emailId && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <span className="font-medium">Gmail ID:</span>
                              <code className="px-1.5 py-0.5 bg-background rounded text-[10px] font-mono">
                                {entry.emailId}
                              </code>
                              <a
                                href={`https://mail.google.com/mail/u/0/#inbox/${entry.emailId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-1 text-primary hover:underline inline-flex items-center gap-0.5"
                                title="Open in Gmail"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          )}
                          {entry.threadId && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <span className="font-medium">Thread ID:</span>
                              <code className="px-1.5 py-0.5 bg-background rounded text-[10px] font-mono">
                                {entry.threadId}
                              </code>
                            </div>
                          )}
                          {entry.error && (
                            <div className="text-xs text-destructive mt-1 p-2 bg-destructive/10 rounded border border-destructive/20">
                              <span className="font-medium">Error:</span> {entry.error}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No email sends yet</p>
                  <p className="text-xs mt-1">Send history will appear here after you send emails</p>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Scheduled Emails Section - Phase 7 */}
          {/* NOTE: Scheduled sends are now tracked in actions table as artifact_email_schedule actions */}
          {/* Query artifact_email_schedule actions if needed in future */}
          {false && (
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <h4 className="text-sm font-semibold">Scheduled Emails</h4>
                <Badge variant="outline" className="text-xs">
                  0 pending
                </Badge>
              </div>
              <div className="space-y-3">
                {[].map((scheduled, index) => (
                  <div 
                    key={index} 
                    className="p-3 bg-muted/30 rounded-lg border border-border/50 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-foreground">
                            {formatDate(scheduled.scheduledAt)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({formatRelativeTime(scheduled.scheduledAt)})
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          <div className="truncate">
                            <span className="font-medium">To:</span> {scheduled.to}
                          </div>
                          <div className="truncate">
                            <span className="font-medium">Subject:</span> {scheduled.subject}
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {scheduled.status === 'pending' ? (
                          <Badge variant="default" className="text-xs bg-primary/10 text-primary-foreground">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        ) : scheduled.status === 'sent' ? (
                          <Badge variant="success" className="text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Sent
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Failed
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Replies Section - Phase 5 */}
          {(data as any).replies && (data as any).replies.length > 0 && (
            <div className="space-y-3 pt-4 border-t" data-replies-section>
              <div className="flex items-center gap-2">
                <Reply className="w-4 h-4 text-muted-foreground" />
                <h4 className="text-sm font-semibold">Replies</h4>
                <Badge variant="outline" className="text-xs">
                  {(data as any).replies.length} {(data as any).replies.length === 1 ? 'reply' : 'replies'}
                </Badge>
              </div>
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {/* Reverse chronological order (newest first) */}
                {[...(data as any).replies].reverse().map((reply, index) => (
                  <div 
                    key={reply.messageId || index} 
                    className="p-3 bg-muted/30 rounded-lg border border-border/50 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-foreground">
                            {formatDate(reply.timestamp)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({formatRelativeTime(reply.timestamp)})
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mb-2">
                          <div className="truncate">
                            <span className="font-medium">From:</span> {reply.from}
                          </div>
                        </div>
                        <div className="text-sm text-foreground whitespace-pre-wrap break-words">
                          {reply.snippet || reply.body?.substring(0, 200) || 'No content'}
                          {reply.body && reply.body.length > 200 && '...'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata footer */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground/70 border-t border-border/20 pt-3 mt-4">
            <span>Updated {formatDate(metadata.lastUpdatedAt)}</span>
            <span>•</span>
            <span>Source: {metadata.lastUpdatedBy}</span>
          </div>
        </CardContent>
      </Card>

      {/* Gmail Auth Dialog - Root Level */}
      <Dialog open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect Gmail Account</DialogTitle>
            <DialogDescription>
              You need to connect your Gmail account to send emails. 
              This will open Google's authorization page in a popup window.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {authError && (
              <Alert className="border-destructive/50 bg-destructive/10">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <AlertDescription className="text-destructive">{authError}</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAuthModalOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleConnectGmail} disabled={isConnecting}>
              {isConnecting ? 'Connecting...' : 'Connect Gmail'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SCHEDULING TEMPORARILY DISABLED - Commented out for merge */}
      {/* Schedule Dialog - Root Level */}
      {/* <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Schedule Email</DialogTitle>
            <DialogDescription>
              Choose when to send this email
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-foreground">Select Day</Label>
              <div className="flex flex-wrap gap-2">
                {getWeekDays().map(({ date, label }, idx) => (
                  <Button
                    key={idx}
                    type="button"
                    variant={selectedDate?.getTime() === date.getTime() ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleDateSelect(date)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {selectedDate && (
              <div className="space-y-3 border-t border-border/20 pt-4">
                <Label className="text-sm font-semibold text-foreground">Select Time</Label>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                  {generateTimeSlots().map(time => (
                    <Button
                      key={time}
                      type="button"
                      variant={selectedTime === time ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleTimeSelect(time)}
                      disabled={isTimeInPast(selectedDate, time)}
                    >
                      {formatTimeSlot(time)}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {selectedDate && selectedTime && (
              <div className="border-t border-border/20 pt-4">
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="text-sm text-muted-foreground mb-1">Scheduled for</div>
                  <div className="text-lg font-semibold text-foreground">
                    {formatNaturalLanguage(selectedDate, selectedTime)}
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsScheduleOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleScheduleClick} disabled={!selectedDate || !selectedTime}>
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog> */}

      {/* Send Confirmation Dialog - Root Level */}
      <AlertDialog open={isSendConfirmOpen} onOpenChange={setIsSendConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Email</AlertDialogTitle>
            <AlertDialogDescription>
              Send email to {toEmail}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSendConfirm}>
              Send
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
