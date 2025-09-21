'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/auth-context';
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import AccountTab from './tabs/AccountTab'
import DataTab from './tabs/DataTab'
import FriendsTab from './tabs/FriendsTab'
import { InsightsTab } from './tabs/InsightsTab'
import { handleSignOut } from './utils'
import SubscriptionOverview from './tabs/subscription/subscription-overview'
import { getFirebaseAuth } from '@/app/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'

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
      if (stored && ['account', 'friends', 'subscription', 'notifications', 'integrations', 'ai-preferences', 'data', 'insights'].includes(stored)) {
        setActiveTab(stored)
        window.sessionStorage.removeItem('settingsActiveTab')
        return
      }
    } catch {}

    // 1) Prefer hash routing e.g. /settings#subscription
    const hash = (window.location.hash || '').replace('#', '')
    if (['account', 'friends', 'subscription', 'notifications', 'integrations', 'ai-preferences', 'data', 'insights'].includes(hash)) {
      setActiveTab(hash)
      return
    }
    // 2) Fallback to tab query parameter e.g. /settings?tab=subscription
    const urlParams = new URLSearchParams(window.location.search)
    const tabParam = urlParams.get('tab')
    if (tabParam && ['account', 'friends', 'subscription', 'notifications', 'integrations', 'ai-preferences', 'data', 'insights'].includes(tabParam)) {
      setActiveTab(tabParam)
      return
    }
  }, [])

  useEffect(() => {
    let auth
    try {
      auth = getFirebaseAuth()
    } catch (e) {
      auth = null
    }
    if (!auth) return
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
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
                  <h2 className="text-2xl font-light tracking-tight text-foreground">Welcome to HeyContent</h2>
                  <span className="text-lg text-muted-foreground">✨</span>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Your intelligent content companion is ready. Let's get you set up.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                    <span>Complete your profile</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                    <span>Choose your subscription</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                    <span>Connect your platforms</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                    <span>Configure preferences</span>
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
              <h1 className="text-4xl font-light tracking-tight text-foreground">Settings</h1>
              <p className="text-lg text-muted-foreground">Manage your account and preferences</p>
            </div>
            <Button
              onClick={() => handleSignOut(router)}
              variant="ghost"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">Sign out</span>
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
              { id: 'insights', label: 'Insights', description: 'Your knowledge and patterns' },
              { id: 'data', label: 'Privacy', description: 'Security and data management' }
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
                  <div className="font-medium text-sm">{tab.label}</div>
                  <div className="text-xs text-muted-foreground group-hover:text-muted-foreground/80 transition-colors duration-200">
                    {tab.description}
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

          {activeTab === 'insights' && (
            <div className="space-y-8">
              <InsightsTab />
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-8">
              <DataTab />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SettingsScreen;
