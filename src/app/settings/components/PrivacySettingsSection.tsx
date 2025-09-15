'use client'

import React, { useState, useEffect } from 'react'
import { Shield } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { toast } from 'sonner'
import { useAuth } from '@/app/context/auth-context'

interface PrivacySettingsSectionProps {
  initialSettings?: {
    showPersonaToFriends: boolean
    allowFriendRequests: boolean
    friendRequestNotifications: boolean
  }
  onSettingsChange?: (settings: {
    showPersonaToFriends: boolean
    allowFriendRequests: boolean
    friendRequestNotifications: boolean
  }) => void
}

const PrivacySettingsSection: React.FC<PrivacySettingsSectionProps> = ({
  initialSettings,
  onSettingsChange
}) => {
  const { firebaseUser } = useAuth()
  const userId = firebaseUser?.uid
  
  // Convex queries and mutations
  const userPreferences = useQuery(
    api.friendshipQueries.getUserPreferences,
    userId ? { userId } : 'skip'
  )
  const updateUserPreferences = useMutation(api.friendshipMutations.updateUserPreferences)

  // Local state for settings
  const [settings, setSettings] = useState({
    showPersonaToFriends: true,
    allowFriendRequests: true,
    friendRequestNotifications: true
  })

  // Update local state when preferences are loaded
  useEffect(() => {
    if (userPreferences) {
      setSettings({
        showPersonaToFriends: userPreferences.showPersonaToFriends,
        allowFriendRequests: userPreferences.allowFriendRequests,
        friendRequestNotifications: userPreferences.friendRequestNotifications
      })
    } else if (initialSettings) {
      setSettings(initialSettings)
    }
  }, [userPreferences, initialSettings])

  const handleToggle = async (key: keyof typeof settings) => {
    if (!userId) return

    const newValue = !settings[key]
    const newSettings = {
      ...settings,
      [key]: newValue
    }
    
    // Optimistically update local state
    setSettings(newSettings)
    onSettingsChange?.(newSettings)

    try {
      // Update preferences in Convex
      await updateUserPreferences({
        userId,
        preferences: {
          [key]: newValue
        }
      })
      toast.success('Privacy settings updated')
    } catch (error) {
      console.error('Error updating privacy settings:', error)
      // Revert optimistic update on error
      setSettings(settings)
      onSettingsChange?.(settings)
      toast.error('Failed to update privacy settings. Please try again.')
    }
  }

  const privacyOptions = [
    {
      key: 'showPersonaToFriends' as const,
      title: 'Show my persona to friends',
      description: 'Allow friends to see your creator persona and profile information'
    },
    {
      key: 'allowFriendRequests' as const,
      title: 'Allow friend requests',
      description: 'Let other users send you friend requests'
    },
    {
      key: 'friendRequestNotifications' as const,
      title: 'Friend request notifications',
      description: 'Get notified when someone sends you a friend request'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-xl font-medium text-foreground">Privacy Settings</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Control how you interact with friends and manage your privacy preferences
        </p>
      </div>

      {/* Privacy Options */}
      <div className="space-y-4">
        {privacyOptions.map((option) => (
          <div
            key={option.key}
            className="flex items-start justify-between py-4 border-b border-border/30 last:border-b-0"
          >
            <div className="space-y-1 flex-1 pr-4">
              <h3 className="text-sm font-medium text-foreground">{option.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {option.description}
              </p>
            </div>
            <Switch
              checked={settings[option.key]}
              onCheckedChange={() => handleToggle(option.key)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default PrivacySettingsSection
