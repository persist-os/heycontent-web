'use client';

import React, { useState, useEffect } from 'react';
import { BaseModal } from '@/components/ui/base-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, User, Loader2, Save, Send, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { InlineEmailReply } from './InlineEmailReply';

interface EmailComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTo?: string;
  defaultSubject?: string;
}

// Operation status types (matching InlineEmailReply pattern)
type OperationStatus = 'idle' | 'loading' | 'success' | 'error';

interface OperationState {
  send: OperationStatus;
  draft: OperationStatus;
  message: string;
  error: string | null;
}

export function EmailComposerModal({
  isOpen,
  onClose,
  defaultTo = '',
  defaultSubject = ''
}: EmailComposerModalProps) {
  const [toEmail, setToEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(true);
  const [emailContent, setEmailContent] = useState('');
  
  // Operation states (matching InlineEmailReply pattern)
  const [operationState, setOperationState] = useState<OperationState>({
    send: 'idle',
    draft: 'idle',
    message: '',
    error: null
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setToEmail(defaultTo);
      setSubject(defaultSubject);
      setIsEmailValid(true);
      setEmailContent('');
      setOperationState({
        send: 'idle',
        draft: 'idle',
        message: '',
        error: null
      });
    } else {
      setToEmail('');
      setSubject('');
      setIsEmailValid(true);
      setEmailContent('');
      setOperationState({
        send: 'idle',
        draft: 'idle',
        message: '',
        error: null
      });
    }
  }, [isOpen, defaultTo, defaultSubject]);

  // Clear status after delay
  useEffect(() => {
    if (operationState.send === 'success' || operationState.draft === 'success') {
      const timer = setTimeout(() => {
        if (operationState.send === 'success' || operationState.draft === 'success') {
          // Close modal after successful send or draft
          onClose();
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [operationState.send, operationState.draft, onClose]);

  // Email validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setToEmail(email);
    
    // Validate email if not empty
    if (email.trim()) {
      setIsEmailValid(validateEmail(email));
    } else {
      setIsEmailValid(true); // Don't show error for empty field
    }
  };

  // Helper to get status icon (matching InlineEmailReply pattern)
  const getStatusIcon = (status: OperationStatus) => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  // Helper to check if content is empty
  const isContentEmpty = () => {
    if (!emailContent) return true;
    
    // Create a temporary div to extract text content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = emailContent;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    
    // Check if there's any actual text (ignoring whitespace)
    return textContent.trim().length === 0;
  };

  // Determine if any operation is in progress
  const isOperating = operationState.send === 'loading' || operationState.draft === 'loading';

  const handleSend = async () => {
    if (!toEmail.trim() || !isEmailValid || isContentEmpty() || isOperating) return;
    
    // Confirm send action
    const confirmSend = window.confirm(`Send email to ${toEmail}?`);
    if (!confirmSend) return;
    
    setOperationState(prev => ({
      ...prev,
      send: 'loading',
      error: null,
      message: 'Sending email...'
    }));

    // Preserve HTML content for rich email formatting
    const htmlContent = emailContent;
    
    try {
      // Get API key for authentication
      const { getApiKey } = await import('@/app/lib/api-helpers');
      const key = await getApiKey();
      
      if (!key) {
        throw new Error('Authentication required. Please log in again.');
      }

      // Send email via Gmail API with HTML content
      const response = await fetch('/api/social/gmail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
        },
        body: JSON.stringify({
          to: toEmail,
          subject: subject || 'New Email',
          body: htmlContent,
          is_html: true
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Email sent successfully:', data);
      
      setOperationState(prev => ({
        ...prev,
        send: 'success',
        message: 'Email sent successfully! Closing...'
      }));
      
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      setOperationState(prev => ({
        ...prev,
        send: 'error',
        error: error instanceof Error ? error.message : 'Failed to send email',
        message: ''
      }));
    }
  };

  const handleSaveDraft = async () => {
    if (!toEmail.trim() || !isEmailValid || isContentEmpty() || isOperating) return;
    
    setOperationState(prev => ({
      ...prev,
      draft: 'loading',
      error: null,
      message: 'Saving draft + smart note...'
    }));

    // Preserve HTML content for rich email formatting
    const htmlContent = emailContent;
    
    try {
      // Get API key for authentication
      const { getApiKey } = await import('@/app/lib/api-helpers');
      const key = await getApiKey();
      
      if (!key) {
        throw new Error('Authentication required. Please log in again.');
      }

      // Save email as draft via Gmail API with smart note creation
      const response = await fetch('/api/social/gmail/drafts/create-with-note', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
        },
        body: JSON.stringify({
          to: toEmail,
          subject: subject || 'New Email',
          body: htmlContent,
          is_html: true,
          partnership_context: {
            recipientEmail: toEmail,
            originalSubject: subject,
            composeMode: true,
            isOutbound: true
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Email draft + smart note saved successfully:', data);
      
      setOperationState(prev => ({
        ...prev,
        draft: 'success',
        message: 'Draft & smart note saved! Closing...'
      }));
      
    } catch (error) {
      console.error('❌ Failed to save email draft:', error);
      setOperationState(prev => ({
        ...prev,
        draft: 'error',
        error: error instanceof Error ? error.message : 'Failed to save draft',
        message: ''
      }));
    }
  };

  const handleRetryOperation = (operation: 'send' | 'draft') => {
    if (operation === 'send') {
      handleSend();
    } else {
      handleSaveDraft();
    }
  };

  const handleClose = () => {
    // Don't allow closing during operations
    if (isOperating) {
      return;
    }
    
    // Only ask for confirmation if both email and subject are filled (indicates serious intent)
    if (toEmail.trim() && subject.trim()) {
      const confirmClose = window.confirm('You have an email draft in progress. Are you sure you want to close?');
      if (!confirmClose) return;
    }
    
    onClose();
  };

  // Check if we have required fields for email composition
  const hasRequiredFields = toEmail.trim() && isEmailValid;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Compose Email"
      description="Enter recipient details and compose your email with AI assistance"
      variant="email-composer"
      maxWidth="2xl"
      className="max-h-[95vh] flex flex-col"
    >
      <div 
        className="flex-1 overflow-y-auto flex flex-col space-y-4 pr-1 [&::-webkit-scrollbar]:hidden" 
        style={{
          scrollbarWidth: 'none', /* Firefox */
          msOverflowStyle: 'none', /* Internet Explorer 10+ */
        }}
      >
          {/* Status Messages */}
          {(operationState.message || operationState.error) && (
            <div className="flex-shrink-0 p-3 rounded-md border">
              {operationState.error ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Error: {operationState.error}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRetryOperation(operationState.send === 'error' ? 'send' : 'draft')}
                    className="h-7 px-2"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Retry
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                  {isOperating && <Loader2 className="w-4 h-4 animate-spin" />}
                  {operationState.send === 'success' && <CheckCircle className="w-4 h-4 text-green-500" />}
                  {operationState.draft === 'success' && <CheckCircle className="w-4 h-4 text-green-500" />}
                  <span className="text-sm font-medium">{operationState.message}</span>
                </div>
              )}
            </div>
          )}

          {/* Email Form Fields */}
          <div className="flex-shrink-0 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/20 rounded-lg border">
            {/* To Field */}
            <div className="space-y-2">
              <Label htmlFor="to-email" className="text-sm font-medium">To</Label>
              <div className="relative">
                <Input
                  id="to-email"
                  type="email"
                  value={toEmail}
                  onChange={handleEmailChange}
                  placeholder="recipient@example.com"
                  className={`pl-9 ${
                    !isEmailValid 
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                      : ''
                  }`}
                  disabled={isOperating}
                />
                <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
              {!isEmailValid && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  Please enter a valid email address
                </p>
              )}
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
                disabled={isOperating}
              />
            </div>

            {/* Info Row */}
            <div className="md:col-span-2 pt-2">
              <div className="text-xs text-muted-foreground">
                {hasRequiredFields ? 'Ready to compose email below' : 'Enter valid email address to continue'}
              </div>
            </div>
          </div>

          {/* Email Composer */}
          <div className="flex-1 min-h-0">
            <InlineEmailReply
              isOpen={true}
              onClose={handleClose}
              onSend={(content) => setEmailContent(content)}
              onSaveDraft={(content) => setEmailContent(content)}
              recipientEmail={toEmail || 'recipient@example.com'}
              subject={subject || 'New Email'}
              composeMode={true}
              emailContext="compose"
              className="h-full border-0"
            />
          </div>
        </div>
    </BaseModal>
  );
} 