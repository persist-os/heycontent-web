'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Switch } from "@/src/components/ui/switch"
import {
  Bell, Globe, Users,
  Sliders,
  Download, Database,
  LogOut, Bug} from 'lucide-react'
import { signOut, updateProfile } from 'firebase/auth'
import { auth } from '@/app/lib/firebase'
import { Badge } from "@/src/components/ui/badge"
import { Button } from "@/src/components/ui/button"
import { toast } from "react-hot-toast"
import { PlatformConnect } from './platform-connect'
import { fetchWithAuth } from '@/app/lib/api-helpers'
import DebugTab from './debug-tab'

const MAX_PERSONA_LENGTH = 500  // Enough for detailed description but not too long
const MAX_VISION_LENGTH = 500

const SettingsScreen = () => {
  const router = useRouter()
  const [isFirstTimeSetup, setIsFirstTimeSetup] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPersona: '',
    futureVision: ''
  })
  const [showPersonaFields, setShowPersonaFields] = useState(true)

  useEffect(() => {
    setIsFirstTimeSetup(window.location.search.includes('newUser=true'))
  }, [])

  const fetchPersonaData = async () => {
    try {
      const response = await fetchWithAuth('/api/user/profile')
      const data = await response.json()

      if (response.ok && data.persona) {
        setFormData(prev => ({
          ...prev,
          currentPersona: data.persona.currentState?.description || '',
          futureVision: data.persona.aspirations?.description || ''
        }))
      }
    } catch (error) {
      console.error('Error fetching persona:', error)
    }
  }

  useEffect(() => {
    const currentUser = auth?.currentUser
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        name: currentUser.displayName || '',
        email: currentUser.email || ''
      }))
      fetchPersonaData()
    }
  }, [])

  const handleEmailIntegration = () => {
    alert(`Email integration coming soon! This will allow you to:
- Sync email subscribers
- Import contact lists
- Track email engagement
- Analyze email performance`);
  };

  const handleSignOut = async () => {
    try {
      // Clear any remaining local storage first
      localStorage.clear()
      sessionStorage.clear()

      // Make the logout API call
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to logout')
      }

      // Sign out from Firebase last
      if (auth) {
        try {
          await signOut(auth)
        } catch (firebaseError) {
          console.warn('Firebase signOut error:', firebaseError)
          // Continue with redirect even if Firebase signOut fails
        }
      }

      // Redirect to login page
      router.push('/login')
    } catch (error) {
      console.error('Sign out error:', error)
      toast.error('Failed to sign out. Please try again.')
    }
  }

  const handleResendVerification = async () => {
    setIsResending(true)
    try {
      if (!auth) throw new Error('Auth not initialized');

      const response = await fetchWithAuth('/api/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({
          email: auth.currentUser?.email
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to resend verification email')
      }

      // Show success message
      toast.success("Verification email sent. Please check your inbox.")
    } catch (error) {
      console.error('Resend verification error:', error)
      // Show error message
      toast.error(error instanceof Error ? error.message : "Failed to send verification email")
    } finally {
      setIsResending(false)
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdating(true)

    try {
      const response = await fetchWithAuth('/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: formData.name,
          currentPersona: formData.currentPersona,
          futureVision: formData.futureVision
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile')
      }

      // Update form data with the response
      setFormData(prev => ({
        ...prev,
        name: data.user.name || '',
        currentPersona: data.persona?.currentState?.description || '',
        futureVision: data.persona?.aspirations?.description || ''
      }))

      // Update session
      if (!auth?.currentUser) throw new Error('User not authenticated');
      await updateProfile(auth.currentUser, {
        displayName: data.user.name
      })

      toast.success('Profile updated successfully')
    } catch (error) {
      console.error('Profile update error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update profile')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="h-full min-h-screen bg-background">
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
              onClick={handleSignOut}
              variant="ghost"
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="account" className="space-y-4 sm:space-y-6">
          <div className="overflow-x-auto pb-2 -mx-3 sm:mx-0">
            <TabsList className="w-full md:w-auto flex flex-nowrap px-3 sm:px-0">
              <TabsTrigger value="account" className="flex-1 sm:flex-none">
                <Users className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Account</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex-1 sm:flex-none">
                <Bell className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Notifications</span>
              </TabsTrigger>
              <TabsTrigger value="integrations" className="flex-1 sm:flex-none">
                <Globe className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Integrations</span>
              </TabsTrigger>
              <TabsTrigger value="ai-preferences" className="flex-1 sm:flex-none">
                <Sliders className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">AI Preferences</span>
              </TabsTrigger>
              <TabsTrigger value="data" className="flex-1 sm:flex-none">
                <Database className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Data</span>
              </TabsTrigger>
              <TabsTrigger value="debug" className="flex-1 sm:flex-none">
                <Bug className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Debug</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Account Settings */}
          <TabsContent value="account">
            <div className="grid gap-4 sm:gap-6 max-w-full">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                    <CardTitle className="text-lg sm:text-xl">Profile Information</CardTitle>
                    {auth?.currentUser ? (
                      <Badge variant="success">Verified</Badge>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive">Unverified</Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleResendVerification}
                          disabled={isResending}
                          className="w-full sm:w-auto"
                        >
                          {isResending ? 'Sending...' : 'Resend Verification'}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={handleProfileUpdate}>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label htmlFor="name" className="text-sm font-medium">Name</label>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          className="w-full mt-1 p-2 border rounded-lg text-base"
                          placeholder="Your name"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="text-sm font-medium">Email</label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          className="w-full mt-1 p-2 border rounded-lg text-base"
                          placeholder="your@email.com"
                          value={formData.email}
                          disabled
                        />
                      </div>
                    </div>
                    <div className="mt-4 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-medium">AI Persona Understanding</h3>
                          <p className="text-sm text-gray-600">Help Content understand your journey and goals</p>
                        </div>
                        <Switch
                          checked={showPersonaFields}
                          onCheckedChange={setShowPersonaFields}
                        />
                      </div>

                      {showPersonaFields && (
                        <>
                          <div>
                            <div className="flex justify-between items-center">
                              <label className="text-sm font-medium">Current Persona</label>
                              <span className="text-sm text-gray-500">
                                {formData.currentPersona.length}/{MAX_PERSONA_LENGTH}
                              </span>
                            </div>
                            <textarea
                              className="w-full mt-1 p-2 border rounded-lg resize-y min-h-[100px] text-base"
                              placeholder="Describe who you are today (e.g., 'I'm a tech content creator with 50k subscribers, focusing on AI and automation tutorials...')"
                              value={formData.currentPersona}
                              onChange={(e) => {
                                if (e.target.value.length <= MAX_PERSONA_LENGTH) {
                                  setFormData(prev => ({ ...prev, currentPersona: e.target.value }))
                                }
                              }}
                              maxLength={MAX_PERSONA_LENGTH}
                            />
                          </div>

                          <div>
                            <div className="flex justify-between items-center">
                              <label className="text-sm font-medium">Future Vision</label>
                              <span className="text-sm text-gray-500">
                                {formData.futureVision.length}/{MAX_VISION_LENGTH}
                              </span>
                            </div>
                            <textarea
                              className="w-full mt-1 p-2 border rounded-lg resize-y min-h-[100px] text-base"
                              placeholder="Describe your goals and aspirations (e.g., 'I want to become a thought leader in AI education, build a community of 500k learners...')"
                              value={formData.futureVision}
                              onChange={(e) => {
                                if (e.target.value.length <= MAX_VISION_LENGTH) {
                                  setFormData(prev => ({ ...prev, futureVision: e.target.value }))
                                }
                              }}
                              maxLength={MAX_VISION_LENGTH}
                            />
                          </div>
                        </>
                      )}
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button
                        type="submit"
                        disabled={isUpdating}
                        className="w-full sm:w-auto"
                      >
                        {isUpdating ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Security</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg gap-3">
                    <div>
                      <h3 className="font-medium">Two-Factor Authentication</h3>
                      <p className="text-sm text-gray-600">Add an extra layer of security</p>
                    </div>
                    <Switch />
                  </div>
                  <button className="text-purple-500 text-sm">Change Password</button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { title: 'AI Insights', desc: 'Get notified about new AI recommendations' },
                  { title: 'Performance Alerts', desc: 'Notifications about significant metrics changes' },
                  { title: 'Partnership Opportunities', desc: 'Updates about new collaboration possibilities' },
                  { title: 'Content Updates', desc: 'Notifications about content performance and suggestions' }
                ].map((item, i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg gap-3">
                    <div>
                      <h3 className="font-medium">{item.title}</h3>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                    <Switch />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations */}
          <TabsContent value="integrations">
            <div className="grid gap-4 sm:gap-6 max-w-full">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Connected Platforms</CardTitle>
                </CardHeader>
                <CardContent>
                  <PlatformConnect />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* AI Preferences */}
          <TabsContent value="ai-preferences">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Chat With Content Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { title: 'Proactive Insights', desc: 'AI suggests opportunities without being asked' },
                  { title: 'Learning Mode', desc: 'AI learns from your preferences and decisions' },
                  { title: 'Automated Actions', desc: 'Allow AI to take recommended actions' },
                  { title: 'Partners Insights', desc: 'Get AI-powered partnership recommendations' }
                ].map((item, i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg gap-3">
                    <div>
                      <h3 className="font-medium">{item.title}</h3>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                    <Switch />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Management */}
          <TabsContent value="data">
            <div className="grid gap-4 sm:gap-6 max-w-full">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Data Export & Backup</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg gap-3">
                    <div>
                      <h3 className="font-medium">Export All Data</h3>
                      <p className="text-sm text-gray-600">Download all your data in a single file</p>
                    </div>
                    <button className="px-4 py-2 bg-purple-500 text-white rounded-lg flex items-center justify-center gap-2 w-full sm:w-auto">
                      <Download className="w-4 h-4" /> Export
                    </button>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg gap-3">
                    <div>
                      <h3 className="font-medium">Automatic Backups</h3>
                      <p className="text-sm text-gray-600">Keep your data safe with regular backups</p>
                    </div>
                    <Switch />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Privacy & Data</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg gap-3">
                    <div>
                      <h3 className="font-medium">Data Collection</h3>
                      <p className="text-sm text-gray-600">Manage what data is collected and analyzed</p>
                    </div>
                    <button className="text-purple-500 px-4 py-2 border border-purple-500 rounded-lg w-full sm:w-auto">Configure</button>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg gap-3">
                    <div>
                      <h3 className="font-medium">Clear Data</h3>
                      <p className="text-sm text-gray-600">Delete all stored data and preferences</p>
                    </div>
                    <button className="px-4 py-2 bg-red-500 text-white rounded-lg w-full sm:w-auto">
                      Clear All
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Debug Tab */}
          <TabsContent value="debug">
            <DebugTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default SettingsScreen;