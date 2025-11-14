/**
 * Admin email service for sending emails to users.
 * Pattern 1: Full-Stack API Call - Uses fetchWithApiKey
 */

import { fetchWithApiKey } from './api-helpers'

export interface SendAdminEmailParams {
  recipients: string[]
  subject: string
  htmlContent?: string
  textContent?: string
}

export interface SendAdminEmailBatchParams {
  emails: Array<{
    recipients: string[]
    subject: string
    htmlContent?: string
    textContent?: string
  }>
}

export interface SendAdminEmailResponse {
  success: boolean
  message: string
  sentCount: number
  filteredCount: number
  totalRecipients: number
  error?: string
}

/**
 * Send an email to recipients via admin endpoint.
 * 
 * @param params Email send parameters
 * @returns Send result with counts
 */
export async function sendAdminEmail(
  params: SendAdminEmailParams
): Promise<SendAdminEmailResponse> {
  const response = await fetchWithApiKey('/api/admin/emails/send', {
    method: 'POST',
    body: JSON.stringify({
      recipients: params.recipients,
      subject: params.subject,
      html_content: params.htmlContent,
      text_content: params.textContent,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to send email' }))
    return {
      success: false,
      message: error.detail || 'Failed to send email',
      error: error.detail,
      sentCount: 0,
      filteredCount: 0,
      totalRecipients: params.recipients.length,
    }
  }

  const data = await response.json()
  return data
}

/**
 * Send a batch of personalized emails via admin endpoint.
 * Uses Resend batch API for better performance and rate limit handling.
 * 
 * @param params Batch email send parameters
 * @returns Send result with counts
 */
export async function sendAdminEmailBatch(
  params: SendAdminEmailBatchParams
): Promise<SendAdminEmailResponse> {
  const response = await fetchWithApiKey('/api/admin/emails/send', {
    method: 'POST',
    body: JSON.stringify({
      emails: params.emails.map(email => ({
        recipients: email.recipients,
        subject: email.subject,
        html_content: email.htmlContent,
        text_content: email.textContent,
      })),
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to send batch email' }))
    const totalRecipients = params.emails.reduce((sum, e) => sum + e.recipients.length, 0)
    return {
      success: false,
      message: error.detail || 'Failed to send batch email',
      error: error.detail,
      sentCount: 0,
      filteredCount: 0,
      totalRecipients,
    }
  }

  const data = await response.json()
  return data
}

