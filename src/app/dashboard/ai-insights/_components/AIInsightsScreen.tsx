'use client'

import React, { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Instagram, Mail } from 'lucide-react'
import { useAuth } from '@/app/context/auth-context'

// Platform-specific components
import { YouTubePlatform } from './platforms/YouTubePlatform'
import { InstagramPlatform } from './platforms/InstagramPlatform'
import { GmailPlatform } from './platforms/GmailPlatform'

// Platform-specific hooks for counting insights
import { useYouTubeInsights } from './hooks/useYouTubeInsights'
import { useInstagramInsights } from './hooks/useInstagramInsights'
import { useGmailInsights } from './hooks/useGmailInsights'

// Import RefreshState component
import { RefreshState } from '@/components/ui/refresh-state'

export function AIInsightsScreen() {
  const [activeTab, setActiveTab] = useState('youtube')
  const [currentQuote, setCurrentQuote] = useState<string>('')
  
  const { firebaseUser } = useAuth()

  // Get insight counts for tabs
  const youtubeHook = useYouTubeInsights(firebaseUser?.uid)
  const instagramHook = useInstagramInsights(firebaseUser?.uid)
  const gmailHook = useGmailInsights(firebaseUser?.uid)

  const motivationalQuotes = [
    "Create because it's fun. Create because it helps people. Create because it gives you a sense of accomplishment. Create like nobody's watching and you might be surprised how many do. — Matt D'Avella",
    "When creating content, be the best answer on the internet. — Andy Crestodina",
    "We need to stop interrupting what people are interested in and be what people are interested in. — Craig Davis",
    "I don't create content for a specific type of audience; I just share my life and whatever resonates with people is what draws them to me. — Nara Smith",
    "The artists today that are making it realize that it's about creating a continuous engagement with their fans. — Daniel Ek",
    "Without big data, you are blind and deaf and in the middle of a freeway. — Geoffrey Moore",
    "Data is the new oil. — Clive Humby",
    "Data helps solve problems. — Anne Wojcicki",
    "Data visualization is language. It's a means to convey an opinion or argument. — Kim Rees"
  ];  

  useEffect(() => {
    // Set initial quote
    setCurrentQuote(motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);
    
    // Change quote every 4 seconds
    const interval = setInterval(() => {
      setCurrentQuote(motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);
    }, 4000);
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  return (
    <div className="relative">
      {/* Fixed Header */}
      <div className="shrink-0 px-6 py-4 bg-white dark:bg-gray-900">
        <div className="flex justify-between items-center">
          <div className="w-[100px] sm:w-[24px]"></div>
          <div className="flex-1 flex justify-center sm:justify-start">
            <div className="text-center sm:text-left">
              <h1 className="text-base font-medium text-black dark:text-white">AI Insights</h1>
              <p className="text-text-gray dark:text-gray-400">
                <span className="hidden sm:inline">Personalized recommendations for your content strategy</span>
              </p>
            </div>
          </div>
          <div className="w-[100px] sm:w-auto">
            {/* Removed global refresh button - now each tab has its own */}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto dark:bg-gray-900">
        <div className="p-6">
          <div className="max-w-5xl mx-auto space-y-6">
            <Tabs defaultValue="youtube" className="w-full" onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger 
                  value="youtube" 
                  className="flex items-center gap-2"
                >
                  YouTube ({youtubeHook.insights.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="instagram" 
                  className="flex items-center gap-2"
                >
                  <Instagram className="w-4 h-4" />
                  Instagram ({instagramHook.insights.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="gmail" 
                  className="flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Gmail ({gmailHook.insights.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="youtube" className="space-y-6">
                <YouTubePlatform userId={firebaseUser?.uid} currentQuote={currentQuote} loading={youtubeHook.loading} />
              </TabsContent>

              <TabsContent value="instagram" className="space-y-6">
                <InstagramPlatform userId={firebaseUser?.uid} currentQuote={currentQuote} loading={instagramHook.loading} />
              </TabsContent>

              <TabsContent value="gmail" className="space-y-6">
                <GmailPlatform userId={firebaseUser?.uid} currentQuote={currentQuote} loading={gmailHook.loading} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
} 