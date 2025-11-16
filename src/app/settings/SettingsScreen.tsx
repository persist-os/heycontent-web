'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/auth-context';
import { Button } from '@/components/ui/button'
import { LogOut, Upload, ArrowRight } from 'lucide-react'
import AccountTab from './tabs/AccountTab'
import DataTab from './tabs/DataTab'
import FriendsTab from './tabs/FriendsTab'
import ConnectionsTab from './tabs/ConnectionsTab'
import EmailPreferencesTab from './tabs/EmailPreferencesTab'
import { handleSignOut } from './utils'
import SubscriptionOverview from './tabs/subscription/subscription-overview'
import { getFirebaseAuth } from '@/app/lib/firebase'
import { authStateManager } from '@/app/lib/auth-state-manager'
import { T } from '@/components/translation/T'

const SettingsScreen = () => {
  const router = useRouter()
  const { firebaseUser, authLoading } = useAuth()
  const [isFirstTimeSetup, setIsFirstTimeSetup] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [activeTab, setActiveTab] = useState('account')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    referralCode: '',
    referredBy: '',
    currentPersona: '',
    futureVision: ''
  })
  const [showPersonaFields, setShowPersonaFields] = useState(true)
  const [userId, setUserId] = useState<string | undefined>()
  const [userEmail, setUserEmail] = useState<string | undefined>()



  useEffect(() => {
    setIsFirstTimeSetup(window.location.search.includes('newUser=true'))
    
    // 0) Session flag set before navigating to /settings
    try {
      const stored = window.sessionStorage.getItem('settingsActiveTab')
      if (stored && ['account', 'friends', 'subscription', 'notifications', 'integrations', 'ai-preferences', 'data', 'imports', 'connections', 'email'].includes(stored)) {
        setActiveTab(stored)
        window.sessionStorage.removeItem('settingsActiveTab')
        return
      }
    } catch {}

    // 1) Prefer hash routing e.g. /settings#subscription
    const hash = (window.location.hash || '').replace('#', '')
    if (['account', 'friends', 'subscription', 'notifications', 'integrations', 'ai-preferences', 'data', 'imports', 'connections', 'email'].includes(hash)) {
      setActiveTab(hash)
      return
    }
    // 2) Fallback to tab query parameter e.g. /settings?tab=subscription
    const urlParams = new URLSearchParams(window.location.search)
    const tabParam = urlParams.get('tab')
    if (tabParam && ['account', 'friends', 'subscription', 'notifications', 'integrations', 'ai-preferences', 'data', 'imports', 'connections', 'email'].includes(tabParam)) {
      setActiveTab(tabParam)
      return
    }
  }, [])

  useEffect(() => {
    // Use centralized auth state manager to prevent multiple listeners
    const unsubscribe = authStateManager.subscribe((firebaseUser) => {
      setUserId(firebaseUser?.uid)
      setUserEmail(firebaseUser?.email)
      if (firebaseUser) {
        setFormData(prev => ({
          ...prev,
          name: firebaseUser.displayName || '',
          email: firebaseUser.email || ''
        }));
      }
    })
    return () => unsubscribe()
  }, [])



  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Banner for First Time Setup */}
        {isFirstTimeSetup && (
          <div className="py-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200/50 dark:border-blue-800/30 rounded-2xl p-6">
              <div className="space-y-4">
                <div className="flex items-baseline gap-3">
                  <h2 className="text-2xl font-light tracking-tight text-foreground">
                    <T context="heading.welcome">Welcome to HeyContent</T>
                  </h2>
                  <span className="text-lg text-muted-foreground">✨</span>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  <T context="settings.welcome.subtitle">Your intelligent content companion is ready. Let's get you set up.</T>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                    <span><T context="settings.welcome.step">Complete your profile</T></span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                    <span><T context="settings.welcome.step">Choose your subscription</T></span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                    <span><T context="settings.welcome.step">Connect your platforms</T></span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                    <span><T context="settings.welcome.step">Configure preferences</T></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="py-8 sm:py-12">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-light tracking-tight text-foreground">
                <T context="heading.settings">Settings</T>
              </h1>
              <p className="text-lg text-muted-foreground">
                <T context="settings.subtitle">Manage your account and preferences</T>
              </p>
            </div>
            <Button
              onClick={() => handleSignOut(router)}
              variant="ghost"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">
                <T context="button.signout">Sign out</T>
              </span>
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <div className="border-b border-border/30 mb-8">
          <nav className="flex gap-8 overflow-x-auto scrollbar-hide">
            {[
              { id: 'account', label: 'Account', description: 'Profile and personal information' },
              { id: 'friends', label: 'Friends', description: 'Manage friends and sharing' },
              { id: 'subscription', label: 'Subscription', description: 'Billing and plan details' },
              { id: 'connections', label: 'Connections', description: 'Platform integrations' },
              { id: 'imports', label: 'Imports', description: 'Import external data' },
              { id: 'data', label: 'Privacy', description: 'Security and data management' },
              { id: 'email', label: 'Email', description: 'Email preferences and notifications' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group pb-4 px-1 text-left transition-colors duration-200 relative flex-shrink-0 ${
                  activeTab === tab.id 
                    ? 'text-foreground' 
                    : 'text-muted-foreground hover:text-foreground/70'
                }`}
              >
                <div className="space-y-1">
                  <div className="font-medium text-sm">
                    <T context={`settings.tab.${tab.id}`}>{tab.label}</T>
                  </div>
                  <div className="text-xs text-muted-foreground group-hover:text-muted-foreground/80 transition-colors duration-200">
                    <T context={`settings.tab.${tab.id}.description`}>{tab.description}</T>
                  </div>
                </div>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-foreground" />
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="pb-16">
          {activeTab === 'account' && (
            <div className="space-y-8">
              <AccountTab
                formData={formData}
                setFormData={setFormData}
                isUpdating={isUpdating}
                setIsUpdating={setIsUpdating}
                isResending={isResending}
                setIsResending={setIsResending}
                showPersonaFields={showPersonaFields}
                setShowPersonaFields={setShowPersonaFields}
              />
            </div>
          )}

          {activeTab === 'friends' && (
            <div className="space-y-8">
              <FriendsTab userId={userId} />
            </div>
          )}

          {activeTab === 'subscription' && (
            <div className="space-y-8">
              <SubscriptionOverview />
            </div>
          )}

          {activeTab === 'connections' && (
            <div className="space-y-8">
              <ConnectionsTab userId={userId} />
            </div>
          )}

          {activeTab === 'imports' && (
            <div className="space-y-8">
              {/* Imports Section */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold">
                    <T context="settings.imports.title">Import External Data</T>
                  </h2>
                  <p className="text-muted-foreground">
                    <T context="settings.imports.subtitle">Import your data from external platforms to enhance your Crystal Dam</T>
                  </p>
                </div>

                {/* ChatGPT Import Card - COMMENTED OUT */}
                {/* <div className="border border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/20">
                        <Upload className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold">ChatGPT Conversations</h3>
                        <p className="text-sm text-muted-foreground max-w-md">
                          Import your ChatGPT conversation history. Upload your conversations.json.zip file
                          to add your ChatGPT interactions to your content library.
                        </p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                            Background Processing
                          </span>
                          <span className="text-xs px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300">
                            Non-blocking
                          </span>
                          <span className="text-xs px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300">
                            Full Context
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      onClick={() => router.push('/dashboard/import/chatgpt')}
                      className="flex items-center gap-2"
                    >
                      Import Now
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div> */}

                {/* Coming Soon - Other Imports */}
                <div className="border border-dashed border-border rounded-lg p-6 opacity-60">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">
                        <T context="settings.imports.coming_soon">More Import Options Coming Soon</T>
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        <T context="settings.imports.coming_soon.subtitle">We're working on additional import options for other platforms.</T>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-8">
              <DataTab />
            </div>
          )}

          {activeTab === 'email' && (
            <div className="space-y-8">
              <EmailPreferencesTab />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SettingsScreen;
