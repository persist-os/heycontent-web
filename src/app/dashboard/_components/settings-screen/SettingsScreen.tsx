// File: components/settings/SettingsScreen.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/auth-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { LogOut, Users, Bell, Globe, Sliders, Database, CreditCard, Key } from 'lucide-react'
import { PlatformConnect } from './tabs/platform-connect/platform-connect'
import AccountTab from './tabs/AccountTab'
import NotificationsTab from './tabs/NotificationsTab'
import AIPreferencesTab from './tabs/AIPreferencesTab'
import DataTab from './tabs/DataTab'
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
  const [showPlaygroundModal, setShowPlaygroundModal] = useState(false)
  const [playgroundPassword, setPlaygroundPassword] = useState('')
  const [playgroundError, setPlaygroundError] = useState('')

  useEffect(() => {
    setIsFirstTimeSetup(window.location.search.includes('newUser=true'))
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

  const handleOpenPlayground = () => {
    setShowPlaygroundModal(true)
    setPlaygroundPassword('')
    setPlaygroundError('')
  }

  const handlePlaygroundSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (playgroundPassword === 'prompter1205') {
      setShowPlaygroundModal(false)
      setPlaygroundPassword('')
      setPlaygroundError('')
      router.push('/prompt-playground')
    } else {
      setPlaygroundError('Incorrect password')
    }
  }

  return (
    <div className="h-full min-h-screen bg-background relative">
      {/* Hidden Playground Button */}
      <button
        className="fixed bottom-3 right-3 z-50 opacity-40 hover:opacity-100 transition-opacity bg-white border border-gray-200 rounded-full p-2 shadow-sm text-xs flex items-center gap-1"
        title="Secret Playground"
        onClick={handleOpenPlayground}
        style={{ fontSize: '11px' }}
      >
        <Key className="w-3 h-3 mr-1" />
        Playground
      </button>
      {/* Playground Password Modal */}
      {showPlaygroundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80 relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowPlaygroundModal(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-1">
              <Key className="w-4 h-4" /> Playground Access
            </h3>
            <form onSubmit={handlePlaygroundSubmit}>
              <input
                type="password"
                className="w-full border rounded px-3 py-2 mb-2 text-sm"
                placeholder="Enter password..."
                value={playgroundPassword}
                onChange={e => setPlaygroundPassword(e.target.value)}
                autoFocus
              />
              {playgroundError && <div className="text-xs text-red-500 mb-2">{playgroundError}</div>}
              <button
                type="submit"
                className="w-full bg-purple-600 text-white rounded py-2 text-sm hover:bg-purple-700 transition"
              >
                Unlock
              </button>
            </form>
          </div>
        </div>
      )}
      <div className="container max-w-6xl mx-auto py-4 sm:py-6 px-3 sm:px-6 space-y-4 sm:space-y-6">
        {isFirstTimeSetup && (
          <div className="mb-4 sm:mb-6 bg-purple-50 p-3 sm:p-4 rounded-lg">
            <h2 className="text-base sm:text-lg font-semibold mb-2">Welcome to HeyContent! 🎉</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">Intelligent Relationship and Insight System</p>
            <ol className="list-decimal list-inside space-y-1 sm:space-y-2 text-sm sm:text-base text-gray-600">
              <li>Complete your profile information</li>
              <li>Connect your social media accounts</li>
              <li>Set up your notification preferences</li>
              <li>Configure Chat With Content settings</li>
            </ol>
          </div>
        )}

        <div className="flex justify-between items-center -mt-2">
          <div className="w-[100px] sm:w-auto"></div>
          <div className="flex-1 flex justify-center sm:justify-start">
            <div className="text-center sm:text-left">
              <h1 className="text-base font-medium text-black dark:text-white">Settings</h1>
              <p className="text-text-gray block sm:block max-sm:hidden">Manage your preferences and account settings</p>
            </div>
          </div>
          <div className="w-[100px] sm:w-auto flex justify-end">
            <Button
              onClick={() => handleSignOut(router)}
              variant="ghost"
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="account" className="space-y-4 sm:space-y-6">
          <TabsList className="w-full md:w-auto flex flex-nowrap px-3 sm:px-0">
            <TabsTrigger value="account" className="flex-1 sm:flex-none"><Users className="w-4 h-4 mr-2" /><span className="hidden sm:inline">Account</span></TabsTrigger>
            <TabsTrigger value="subscription" className="flex-1 sm:flex-none"><CreditCard className="w-4 h-4 mr-2" /><span className="hidden sm:inline">Subscription</span></TabsTrigger>
            <TabsTrigger value="notifications" className="flex-1 sm:flex-none"><Bell className="w-4 h-4 mr-2" /><span className="hidden sm:inline">Notifications</span></TabsTrigger>
            <TabsTrigger value="integrations" className="flex-1 sm:flex-none"><Globe className="w-4 h-4 mr-2" /><span className="hidden sm:inline">Integrations</span></TabsTrigger>
            <TabsTrigger value="ai-preferences" className="flex-1 sm:flex-none"><Sliders className="w-4 h-4 mr-2" /><span className="hidden sm:inline">AI Preferences</span></TabsTrigger>
            <TabsTrigger value="data" className="flex-1 sm:flex-none"><Database className="w-4 h-4 mr-2" /><span className="hidden sm:inline">Data</span></TabsTrigger>
          </TabsList>

          <TabsContent value="account">
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
          </TabsContent>

          <TabsContent value="subscription">
            <SubscriptionOverview />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationsTab />
          </TabsContent>

          <TabsContent value="integrations">
            <PlatformConnect />
          </TabsContent>

          <TabsContent value="ai-preferences">
            <AIPreferencesTab />
          </TabsContent>

          <TabsContent value="data">
            <DataTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default SettingsScreen;
