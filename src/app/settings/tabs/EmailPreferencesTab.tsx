'use client'

import React, { useState, useEffect } from 'react'
import { Mail } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { toast } from 'sonner'
import { useAuth } from '@/app/context/auth-context'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const EmailPreferencesTab: React.FC = () => {
  const { firebaseUser } = useAuth()
  const userEmail = firebaseUser?.email

  // Get current email preferences
  const emailPreferences = useQuery(
    api.userQueries.getEmailPreferences,
    userEmail ? { email: userEmail } : 'skip'
  )

  const updateEmailPreferences = useMutation(api.userMutations.updateEmailPreferences)

  // Local state for unsubscribe status
  const [emailUnsubscribed, setEmailUnsubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Update local state when preferences are loaded
  useEffect(() => {
    if (emailPreferences && emailPreferences.found) {
      setEmailUnsubscribed(emailPreferences.emailUnsubscribed || false)
    }
  }, [emailPreferences])

  const handleToggle = async () => {
    if (!userEmail) {
      toast.error('Email address not found')
      return
    }

    setIsLoading(true)
    const newValue = !emailUnsubscribed

    // Optimistically update local state
    setEmailUnsubscribed(newValue)

    try {
      // Update preferences in Convex
      const result = await updateEmailPreferences({
        email: userEmail,
        emailUnsubscribed: newValue
      })

      if (result.success) {
        toast.success(
          newValue
            ? 'You have been unsubscribed from all emails'
            : 'Your email preferences have been updated'
        )
      } else {
        // Revert on error
        setEmailUnsubscribed(!newValue)
        toast.error(result.message || 'Failed to update email preferences')
      }
    } catch (error) {
      console.error('Error updating email preferences:', error)
      // Revert optimistic update on error
      setEmailUnsubscribed(!newValue)
      toast.error('Failed to update email preferences. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Mail className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-xl font-medium text-foreground">Email Preferences</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Manage your email subscription preferences and notifications
        </p>
      </div>

      {/* Email Unsubscribe Option */}
      <div className="border border-border rounded-lg p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1 pr-4">
            <h3 className="text-sm font-medium text-foreground">Email Subscription</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {emailUnsubscribed
                ? 'You are currently unsubscribed from all emails. Toggle to receive emails again.'
                : 'Receive important updates, notifications, and communications from HeyContext.'}
            </p>
          </div>
          <Switch
            checked={!emailUnsubscribed}
            onCheckedChange={handleToggle}
            disabled={isLoading || !userEmail}
          />
        </div>

        {emailUnsubscribed && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              You are unsubscribed from all emails. You can re-enable email notifications at any time
              using the toggle above, or visit the{' '}
              <Link
                href="/unsubscribe"
                className="text-primary hover:underline"
              >
                unsubscribe page
              </Link>
              .
            </p>
          </div>
        )}
      </div>

      {/* Additional Info */}
      <div className="border-t border-border pt-6">
        <p className="text-xs text-muted-foreground">
          You can also manage your email preferences from the{' '}
          <Link href="/unsubscribe" className="text-primary hover:underline">
            unsubscribe page
          </Link>
          . Changes made there will be reflected here.
        </p>
      </div>
    </div>
  )
}

export default EmailPreferencesTab

