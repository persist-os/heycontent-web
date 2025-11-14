'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Send, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { sendAdminEmailBatch } from '@/app/lib/admin-email-service'
import { useAuth } from '@/app/context/auth-context'
import { UserRecipient } from './RecipientSelector'
import { personalizeContent, personalizeHtmlContent, htmlToFormattedText } from '@/app/lib/email-personalization'

interface EmailComposerProps {
  recipients?: UserRecipient[]
  onSendComplete?: () => void
}

export default function EmailComposer({ recipients = [], onSendComplete }: EmailComposerProps) {
  const { firebaseUser } = useAuth()
  const [subject, setSubject] = useState('')
  const [greeting, setGreeting] = useState('')
  const [htmlContent, setHtmlContent] = useState('')
  const [textContent, setTextContent] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

  const handleSend = async () => {
    if (!subject.trim()) {
      toast.error('Please enter a subject')
      return
    }

    if (!htmlContent.trim() && !textContent.trim()) {
      toast.error('Please enter email content')
      return
    }

    if (recipients.length === 0) {
      toast.error('Please select at least one recipient')
      return
    }

    setIsSending(true)
    try {
      // Personalize content for each recipient and prepare batch
      const hasHtml = htmlContent.trim()
      const baseText = hasHtml 
        ? htmlToFormattedText(htmlContent.trim()) 
        : textContent.trim()
      
      // Prepare batch of personalized emails
      const batchEmails = recipients.map(recipient => {
        // Personalize both HTML and text versions
        const personalizedText = personalizeContent(
          baseText,
          greeting.trim(),
          recipient.name
        )
        
        const personalizedHtml = hasHtml
          ? personalizeHtmlContent(
              htmlContent.trim(),
              greeting.trim(),
              recipient.name
            )
          : undefined

        return {
          recipients: [recipient.email],
          subject: subject.trim(),
          htmlContent: personalizedHtml,
          textContent: personalizedText,
        }
      })

      // Send batch in one API call (uses Resend batch API on backend)
      const result = await sendAdminEmailBatch({
        emails: batchEmails,
      })

      if (result.success) {
        toast.success(`Email sent to ${result.sentCount || recipients.length} recipient(s)`)
        if (result.filteredCount && result.filteredCount > 0) {
          toast.info(`${result.filteredCount} recipient(s) were filtered (unsubscribed)`)
        }
        
        // Reset form
        setSubject('')
        setGreeting('')
        setHtmlContent('')
        setTextContent('')
        onSendComplete?.()
      } else {
        toast.error(result.error || 'Failed to send email')
      }
    } catch (error) {
      console.error('Error sending email:', error)
      toast.error('Failed to send email. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="subject" className="text-base font-medium">
          Subject
        </Label>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPreviewMode(!previewMode)}
        >
          <Eye className="h-4 w-4 mr-2" />
          {previewMode ? 'Edit' : 'Preview'}
        </Button>
      </div>
      <Input
        id="subject"
        placeholder="Email subject..."
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        disabled={previewMode || isSending}
      />

      <div className="space-y-2">
        <Label htmlFor="greeting" className="text-base font-medium">
          Greeting (Optional)
        </Label>
        <Input
          id="greeting"
          placeholder="e.g., Hi"
          value={greeting}
          onChange={(e) => setGreeting(e.target.value)}
          disabled={previewMode || isSending}
        />
        {greeting && recipients.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Preview: {greeting.trim()} {recipients[0].name || 'there'},
          </p>
        )}
        {greeting && recipients.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Preview: {greeting.trim()} there,
          </p>
        )}
      </div>

      {previewMode ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-sm font-medium">Subject: {subject || '(no subject)'}</div>
              {greeting && recipients.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  Greeting: {greeting.trim()} {recipients[0].name || 'there'},
                </div>
              )}
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: htmlContent || textContent || '(no content)' }}
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="html" className="w-full">
          <TabsList>
            <TabsTrigger value="html">HTML</TabsTrigger>
            <TabsTrigger value="text">Plain Text</TabsTrigger>
          </TabsList>
          <TabsContent value="html" className="space-y-2">
            <Label htmlFor="html-content">HTML Content</Label>
            <Textarea
              id="html-content"
              placeholder="Enter HTML email content..."
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              rows={12}
              className="font-mono text-sm"
              disabled={isSending}
            />
            <p className="text-xs text-muted-foreground">
              HTML content will be used if provided. Plain text will be used as fallback.
            </p>
          </TabsContent>
          <TabsContent value="text" className="space-y-2">
            <Label htmlFor="text-content">Plain Text Content</Label>
            <Textarea
              id="text-content"
              placeholder="Enter plain text email content..."
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              rows={12}
              disabled={isSending}
            />
          </TabsContent>
        </Tabs>
      )}

      <div className="flex items-center justify-between pt-4">
        <div className="text-sm text-muted-foreground">
          {recipients.length > 0 ? (
            <>Will send to {recipients.length} recipient(s)</>
          ) : (
            <>Select recipients above</>
          )}
        </div>
        <Button
          onClick={handleSend}
          disabled={isSending || !subject.trim() || (!htmlContent.trim() && !textContent.trim()) || recipients.length === 0}
        >
          <Send className="h-4 w-4 mr-2" />
          {isSending ? 'Sending...' : 'Send Email'}
        </Button>
      </div>
    </div>
  )
}

