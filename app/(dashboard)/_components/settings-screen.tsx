'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from "@/components/ui/switch"
import { 
  Settings, Bell, Lock, Palette, Globe, Users, 
  Sliders, Mail, Briefcase, MessageSquare, Upload,
  Download, Database, Instagram, Youtube, Twitter, Video,
  LogOut
} from 'lucide-react'
import { signOut } from 'next-auth/react'

const SettingsScreen = () => {
  const router = useRouter()

  const [isFirstTimeSetup] = useState(() => {
    // Check if this is first time setup
    return window.location.search.includes('newUser=true')
  })

  const handleEmailIntegration = () => {
    alert(`Email integration coming soon! This will allow you to:
- Sync email subscribers
- Import contact lists
- Track email engagement
- Analyze email performance`);
  };

  const handleSignOut = async () => {
    try {
      await signOut({ 
        callbackUrl: '/',
        redirect: true
      })
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {isFirstTimeSetup && (
        <div className="mb-6 bg-blue-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Welcome to AVA IRIS! 🎉</h2>
          <p className="text-gray-600 mb-4">Intelligent Relationship and Insight System</p>
          <ol className="list-decimal list-inside space-y-2 text-gray-600">
            <li>Complete your profile information</li>
            <li>Connect your social media accounts</li>
            <li>Set up your notification preferences</li>
            <li>Configure AI assistant settings</li>
          </ol>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-lg font-semibold">Settings</h1>
          <p className="text-gray-600">Manage your preferences and account settings</p>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign out</span>
        </button>
      </div>

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList>
          <TabsTrigger value="account">
            <Users className="w-4 h-4 mr-2" />
            Account
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <Globe className="w-4 h-4 mr-2" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="ai-preferences">
            <Sliders className="w-4 h-4 mr-2" />
            AI Preferences
          </TabsTrigger>
          <TabsTrigger value="data">
            <Database className="w-4 h-4 mr-2" />
            Data Management
          </TabsTrigger>
        </TabsList>

        {/* Account Settings */}
        <TabsContent value="account">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Name</label>
                    <input type="text" className="w-full mt-1 p-2 border rounded-lg" placeholder="Your name" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <input type="email" className="w-full mt-1 p-2 border rounded-lg" placeholder="your@email.com" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Bio</label>
                  <textarea className="w-full mt-1 p-2 border rounded-lg" rows={3} placeholder="Tell us about yourself" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium">Two-Factor Authentication</h3>
                    <p className="text-sm text-gray-600">Add an extra layer of security</p>
                  </div>
                  <Switch />
                </div>
                <button className="text-blue-500 text-sm">Change Password</button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { title: 'AI Insights', desc: 'Get notified about new AI recommendations' },
                { title: 'Performance Alerts', desc: 'Notifications about significant metrics changes' },
                { title: 'Partnership Opportunities', desc: 'Updates about new collaboration possibilities' },
                { title: 'Content Suggestions', desc: 'Receive content optimization recommendations' }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
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
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Connected Platforms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { platform: 'Email', icon: Mail, status: 'Not Connected', lastSync: null },
                  { platform: 'Instagram', icon: Instagram, status: 'Connected', lastSync: '2 hours ago' },
                  { platform: 'YouTube', icon: Youtube, status: 'Connected', lastSync: '1 hour ago' },
                  { platform: 'Twitter', icon: Twitter, status: 'Not Connected', lastSync: null },
                  { platform: 'TikTok', icon: Video, status: 'Not Connected', lastSync: null }
                ].map((platform, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gray-100">
                        <platform.icon className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">{platform.platform}</h3>
                        <p className="text-sm text-gray-600">
                          {platform.status === 'Connected' ? `Last sync: ${platform.lastSync}` : 'Not connected'}
                        </p>
                      </div>
                    </div>
                    <button 
                      className={`px-4 py-2 rounded-lg ${
                        platform.status === 'Connected' 
                          ? 'bg-gray-200 text-gray-700'
                          : 'bg-blue-500 text-white'
                      }`}
                      onClick={() => {
                        if (platform.platform === 'Email') {
                          handleEmailIntegration();
                        }
                      }}
                    >
                      {platform.status === 'Connected' ? 'Disconnect' : 'Connect'}
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI Preferences */}
        <TabsContent value="ai-preferences">
          <Card>
            <CardHeader>
              <CardTitle>AI Assistant Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { title: 'Proactive Insights', desc: 'AI suggests opportunities without being asked' },
                { title: 'Learning Mode', desc: 'AI learns from your preferences and decisions' },
                { title: 'Automated Actions', desc: 'Allow AI to take recommended actions' },
                { title: 'Partnership Suggestions', desc: 'Receive AI-curated partnership opportunities' }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
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
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Data Export & Backup</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium">Export All Data</h3>
                    <p className="text-sm text-gray-600">Download all your data in JSON format</p>
                  </div>
                  <button className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center gap-2">
                    <Download className="w-4 h-4" /> Export
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
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
                <CardTitle>Privacy & Data</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium">Data Collection</h3>
                    <p className="text-sm text-gray-600">Manage what data is collected and analyzed</p>
                  </div>
                  <button className="text-blue-500">Configure</button>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium">Clear Data</h3>
                    <p className="text-sm text-gray-600">Delete all stored data and preferences</p>
                  </div>
                  <button className="px-4 py-2 bg-red-500 text-white rounded-lg">
                    Clear All
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default SettingsScreen;