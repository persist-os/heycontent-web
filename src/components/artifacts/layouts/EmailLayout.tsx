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
import { Pencil, Mail, Send, Calendar, CheckCircle, Clock, AlertCircle, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { useGmailAuth } from '@/app/hooks/useGmailAuth'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function EmailLayout({ 
  artifact,
  editable = false,
  onUpdate,
  editButton
}: LayoutProps<EmailArtifact>) {
  // Gmail auth check
  const { isAuthenticated, isLoading: authLoading, isConnecting, connectGmail } = useGmailAuth()
  
  // Defensive: ensure all required properties exist
  const data_model = artifact?.data_model || { layout: 'compose' as const }
  const data = artifact?.data || { 
    to: '', 
    subject: '', 
    body: '', 
    status: 'draft' as const 
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
  const [scheduledDateTime, setScheduledDateTime] = useState(
    data.scheduledAt ? new Date(data.scheduledAt).toISOString().slice(0, 16) : ''
  )
  const editorRef = useRef<HTMLDivElement>(null)

  // Sync state when artifact data changes
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
    if (data.scheduledAt) {
      setScheduledDateTime(new Date(data.scheduledAt).toISOString().slice(0, 16))
    }
  }, [data.body, data.to, data.subject, data.scheduledAt])

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

  // Get status badge variant - using semantic variants
  const getStatusBadge = () => {
    switch (data.status) {
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
    
    if (onUpdate) {
      onUpdate({
        ...data,
        to: toEmail,
        subject: subject,
        body: emailContent,
        status: 'sent' as const
      })
    }
  }

  // Handle schedule action
  const handleScheduleClick = async () => {
    if (!scheduledDateTime) {
      setValidationError('Please select a date and time')
      return
    }

    if (!validateForm()) {
      return
    }

    // Check Gmail auth first
    if (!isAuthenticated) {
      await ensureGmailAuth()
      return
    }

    const scheduledTimestamp = new Date(scheduledDateTime).getTime()
    if (onUpdate) {
      onUpdate({
        ...data,
        to: toEmail,
        subject: subject,
        body: emailContent,
        status: 'scheduled' as const,
        scheduledAt: scheduledTimestamp
      })
    }
    setIsScheduleOpen(false)
  }

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
                  disabled={data.status === 'sent'}
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
                disabled={data.status === 'sent'}
              />
            </div>
          </div>

          {/* Email Body Editor */}
          <div className="space-y-2">
            <Label htmlFor="email-body" className="text-sm font-medium">Body</Label>
            <div
              ref={editorRef}
              contentEditable={data.status !== 'sent'}
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
          {!isAuthenticated && !authLoading && data.status === 'draft' && editable && (
            <Alert className="bg-yellow-500/10 border-yellow-500/20">
              <AlertCircle className="h-4 w-4 text-foreground" />
              <AlertDescription className="text-sm text-foreground">
                Connect your Gmail account to send or schedule emails.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          {data.status === 'draft' && editable && (
            <div className="flex items-center gap-2 pt-2 border-t">
              <Button
                onClick={handleSendClick}
                disabled={!isComplete || authLoading || isConnecting}
                className="flex-1"
              >
                <Send className="w-4 h-4 mr-2" />
                {isConnecting ? 'Connecting...' : 'Send Now'}
              </Button>
              
              <Button
                variant="outline"
                disabled={!isComplete || authLoading || isConnecting}
                className="flex-1"
                onClick={() => setIsScheduleOpen(true)}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Schedule
              </Button>
            </div>
          )}

          {/* Scheduled Info */}
          {data.status === 'scheduled' && data.scheduledAt && (
            <Alert className="bg-primary/10 border-primary/20">
              <Clock className="h-4 w-4 text-foreground" />
              <AlertDescription className="text-sm text-foreground">
                Scheduled for: {formatDate(data.scheduledAt)}
              </AlertDescription>
            </Alert>
          )}

          {/* Sent Info */}
          {data.status === 'sent' && (
            <Alert className="bg-primary/10 border-primary/20">
              <CheckCircle className="h-4 w-4 text-foreground" />
              <AlertDescription className="text-sm text-foreground">
                Email sent successfully
              </AlertDescription>
            </Alert>
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
              You need to connect your Gmail account to send or schedule emails. 
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

      {/* Schedule Dialog - Root Level */}
      <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Email</DialogTitle>
            <DialogDescription>
              Select date and time to send this email
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="schedule-datetime">Date & Time</Label>
              <Input
                id="schedule-datetime"
                type="datetime-local"
                value={scheduledDateTime}
                onChange={(e) => setScheduledDateTime(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsScheduleOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleScheduleClick} disabled={!scheduledDateTime}>
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
