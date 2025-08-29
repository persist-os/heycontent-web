'use client'

import React, { useState, useEffect } from 'react'
import { MessageCircle, BarChart3, Zap, Globe, Brain, ArrowRight, Play, Pause, Instagram, Mail, Database, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { YouTubeBrandIcon } from '@/lib/YoutubeBrandIcon'
import Tilt from 'react-parallax-tilt'
import { PlatformCard } from './platform-card'

const mockChatMessages = [
  {
    type: 'user',
    message: "I keep going back and forth on this job decision. Can you help me remember what I was thinking about it last week?",
    timestamp: '2:34 PM'
  },
  {
    type: 'system',
    message: "Looking through your recent conversations and notes...",
    timestamp: '2:34 PM',
    loading: true
  },
    {
    type: 'agent',
    message: "You had a really insightful conversation about this on Tuesday. You mentioned feeling excited about the growth potential but worried about the commute affecting your evening routine. You also noted that the team seemed collaborative, which you said was your top priority after the last job.",
    timestamp: '2:34 PM',
    data: {
      key_insight: "Growth potential vs. commute concerns",
      priority_reminder: "Collaborative team environment",
      emotional_state: "Excited but cautious",
      previous_context: "Compared to challenges at last job",
      decision_factors: "3 main considerations identified"
    }
  },
  {
    type: 'user',
    message: "What patterns do you notice in how I handle stress?",
    timestamp: '2:35 PM'
  },
  {
    type: 'system',
    message: "Analyzing your conversations and notes for patterns...",
    timestamp: '2:35 PM',
    loading: true
  },
  {
    type: 'agent',
    message: "I've noticed you tend to overthink decisions when you're stressed, but your best insights come when you talk through problems out loud. You also mentioned feeling calmer after organizing your thoughts in writing. When you're overwhelmed, you often benefit from breaking things into smaller steps.",
    timestamp: '2:35 PM',
    data: {
      stress_response: "Tends to overthink decisions",
      best_processing: "Talking through problems",
      calming_activity: "Writing thoughts down",
      helpful_strategy: "Breaking into smaller steps",
      pattern_confidence: "Based on 12 conversations"
    }
  }
]

const connectedPlatforms = [
  {
    title: "Conversations",
    description: "Remembers everything you've talked through and worked on",
    icon: MessageCircle,
    iconProps: { className: "w-10 h-10 text-white" },
    color: "from-purple-500 to-pink-500",
    status: "connected",
    insights: [
      "Never loses track of decisions you're working through",
      "Remembers context from weeks or months ago",
      "Helps you pick up exactly where you left off",
      "Connects ideas across different conversations"
    ]
  },
  {
    title: "Notes & Thoughts",
    description: "Your personal thinking space that grows with you",
    icon: Brain,
    iconProps: { className: "w-10 h-10 text-white" },
    color: "from-blue-500 to-cyan-500",
    status: "connected",
    insights: [
      "Keeps track of your evolving thoughts and ideas",
      "Helps you see patterns in how you think and decide",
      "Never judges or pressures you to have it figured out",
      "Creates a safe space for working through anything"
    ]
  },
  {
    title: "Personal Patterns",
    description: "Learns what works for you and how you process best",
    icon: BarChart3,
    iconProps: { className: "w-10 h-10 text-white" },
    color: "from-green-500 to-emerald-500",
    status: "connected",
    insights: [
      "Notices how you handle different types of decisions",
      "Remembers what strategies work best for you",
      "Helps you understand your own thinking patterns",
      "Suggests approaches based on what's worked before"
    ]
  }
];

const comingSoonPlatforms = [
  {
    title: "Voice Notes",
    description: "Talk through ideas when typing feels too much",
    icon: "voice",
    color: "from-pink-600 to-purple-600",
    status: "coming_soon"
  },
  {
    title: "Journal Integration",
    description: "Connect your existing journaling habits",
    icon: "journal",
    color: "from-blue-400 to-blue-600", 
    status: "coming_soon"
  },
  {
    title: "Mood Tracking",
    description: "Understand patterns in how you feel and think",
    icon: "mood",
    color: "from-green-500 to-emerald-500",
    status: "coming_soon"
  },
  {
    title: "Goal Reflection",
    description: "Check in with yourself and track what matters",
    icon: "goals",
    color: "from-orange-500 to-red-500",
    status: "coming_soon"
  }
]

export function AgentsShowcase() {
  const [activeMessage, setActiveMessage] = useState(0)
  const [isAnimating, setIsAnimating] = useState(true)
  const [selectedIntegration, setSelectedIntegration] = useState(0)
  const router = useRouter()

  useEffect(() => {
    if (!isAnimating) return

    const interval = setInterval(() => {
      setActiveMessage((prev) => (prev + 1) % mockChatMessages.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [isAnimating])

  return (
    <section className="relative py-16 sm:py-24 bg-gradient-to-br from-background via-muted/10 to-background overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-100/10 dark:from-purple-900/10 to-blue-100/10 dark:to-blue-900/10 rounded-3xl blur-3xl"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-full border border-white/20 dark:border-border mb-6">
            <span className="text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              🧠 Your Personal Memory System
            </span>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-foreground via-blue-800 dark:via-blue-400 to-purple-800 dark:to-purple-400 bg-clip-text text-transparent leading-relaxed tracking-tight py-2 mb-6">
            It remembers so you don't have to
          </h2>
          <p className="text-xl sm:text-2xl text-muted-foreground leading-relaxed max-w-4xl mx-auto">
            A safe space where you can work through anything. It holds onto every conversation, learns your patterns, 
            and helps you understand yourself better, without ever sharing or judging.
          </p>
        </div>

        {/* Main Demo Section */}
        <div className="grid lg:grid-cols-2 gap-12 mb-20">
          {/* Interactive Chat Demo */}
          <div className="relative">
            <Tilt
              tiltMaxAngleX={5}
              tiltMaxAngleY={5}
              perspective={1000}
              scale={1.02}
              transitionSpeed={1000}
            >
              <div className="bg-background/60 backdrop-blur-sm rounded-2xl border border-border p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsAnimating(!isAnimating)}
                      className="p-1 hover:bg-muted rounded transition-colors"
                    >
                      {isAnimating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {mockChatMessages.map((msg, index) => (
                    <div
                      key={index}
                      className={`transition-all duration-500 ${
                        index <= activeMessage ? 'opacity-100 translate-y-0' : 'opacity-30 translate-y-2'
                      }`}
                    >
                      <div className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[80%] rounded-xl p-3 ${
                            msg.type === 'user'
                              ? 'bg-primary text-primary-foreground dark:text-black'
                              : msg.type === 'system'
                              ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border border-orange-200 dark:border-orange-800'
                              : 'bg-muted text-foreground'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {msg.loading && (
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
                                <div className="w-2 h-2 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                                <div className="w-2 h-2 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                              </div>
                            )}
                            <p className="text-sm">{msg.message}</p>
                          </div>
                          {msg.data && (
                            <div className="mt-3 p-3 bg-background/20 rounded-lg text-xs space-y-2">
                              {msg.data.source_platform && (
                                <div className="flex items-center gap-2">
                                  <span>{msg.data.source_platform}</span>
                                </div>
                              )}
                              {msg.data.target_platform && (
                                <div className="flex items-center gap-2">
                                  <span>{msg.data.target_platform}</span>
                                </div>
                              )}
                              {msg.data.engagement_boost && (
                                <div className="flex items-center gap-2">
                                  <span>{msg.data.engagement_boost}</span>
                                </div>
                              )}
                              {msg.data.content_created && (
                                <div className="flex items-center gap-2">
                                  <span>{msg.data.content_created}</span>
                                </div>
                              )}
                              {msg.data.audience_insight && (
                                <div className="flex items-center gap-2">
                                  <span>{msg.data.audience_insight}</span>
                                </div>
                              )}
                              {msg.data.growth_trend && (
                                <div className="flex items-center gap-2">
                                  <span>{msg.data.growth_trend}</span>
                                </div>
                              )}
                              {msg.data.brand_matches && (
                                <div className="flex items-center gap-2">
                                  <span>{msg.data.brand_matches}</span>
                                </div>
                              )}
                              {msg.data.top_targets && (
                                <div className="flex items-center gap-2">
                                  <span>{msg.data.top_targets}</span>
                                </div>
                              )}
                              {msg.data.pitch_ready && (
                                <div className="flex items-center gap-2">
                                  <span>{msg.data.pitch_ready}</span>
                                </div>
                              )}
                              {msg.data.success_probability && (
                                <div className="flex items-center gap-2">
                                  <span>{msg.data.success_probability}</span>
                                </div>
                              )}
                            </div>
                          )}
                          <p className="text-xs mt-1 opacity-70">{msg.timestamp}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Search className="w-4 h-4" />
                    <span>Searching through all your thoughts, decisions, and conversations...</span>
                    <div className="ml-auto flex space-x-1">
                      <div className="w-2 h-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </Tilt>
          </div>

          {/* Feature Highlights */}
          <div className="space-y-8">
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <div className="relative bg-background/60 backdrop-blur-sm rounded-xl border border-border p-6">
                <div className="flex items-center gap-3 mb-3">
                  <MessageCircle className="w-6 h-6 text-blue-500" />
                  <h3 className="text-xl font-bold text-foreground">Talk through anything</h3>
                </div>
                <p className="text-muted-foreground">
                  Work through decisions, sort through feelings, or just think out loud. 
                  It listens without judgment and helps you understand your own thoughts better.
                </p>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <div className="relative bg-background/60 backdrop-blur-sm rounded-xl border border-border p-6">
                <div className="flex items-center gap-3 mb-3">
                  <BarChart3 className="w-6 h-6 text-purple-500" />
                  <h3 className="text-xl font-bold text-foreground">Remembers your patterns</h3>
                </div>
                <p className="text-muted-foreground">
                  Notices how you think, what works for you, and what you care about. 
                  Helps you understand yourself better by seeing patterns you might miss.
                </p>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <div className="relative bg-background/60 backdrop-blur-sm rounded-xl border border-border p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Globe className="w-6 h-6 text-orange-500" />
                  <h3 className="text-xl font-bold text-foreground">Completely private</h3>
                </div>
                <p className="text-muted-foreground">
                  No feeds, no sharing, no social features. What you share here stays here, always. 
                  It's built for you alone, a sanctuary for your thoughts.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Connected Platforms */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-center mb-4 text-foreground">
            How It Remembers
          </h3>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Your personal memory system that learns from how you think and what you care about
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {connectedPlatforms.map((platform, index) => (
              <PlatformCard
                key={index}
                title={platform.title}
                description={platform.description}
                icon={platform.icon}
                iconProps={platform.iconProps}
                color={platform.color}
                insights={platform.insights}
                isSelected={selectedIntegration === index}
                onClick={() => setSelectedIntegration(index)}
              />
            ))}
          </div>

          {/* Coming Soon Platforms */}
          <h3 className="text-2xl font-bold text-center mb-4 text-foreground">
            Coming Soon
          </h3>
          <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
            More ways to work through what's on your mind
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {comingSoonPlatforms.map((platform, index) => (
              <div
                key={index}
                className="relative group"
              >
                <div className={`absolute -inset-1 bg-gradient-to-r ${platform.color} rounded-xl blur opacity-10 group-hover:opacity-20 transition-opacity`}></div>
                <div className="relative bg-background/60 backdrop-blur-sm rounded-lg border border-border border-dashed p-4 h-full opacity-60">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 bg-gradient-to-r ${platform.color} rounded-lg flex items-center justify-center`}>
                      {platform.icon === 'voice' && (
                        <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C13.1 2 14 2.9 14 4V10C14 11.1 13.1 12 12 12C10.9 12 10 11.1 10 10V4C10 2.9 10.9 2 12 2ZM19 10V12C19 15.9 15.9 19 12 19S5 15.9 5 12V10H7V12C7 14.8 9.2 17 12 17S17 14.8 17 12V10H19ZM11 21V23H13V21H11Z"/>
                        </svg>
                      )}
                      {platform.icon === 'journal' && (
                        <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                        </svg>
                      )}
                      {platform.icon === 'mood' && (
                        <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12,2C13.1,2 14,2.9 14,4C14,5.1 13.1,6 12,6C10.9,6 10,5.1 10,4C10,2.9 10.9,2 12,2ZM21,9V7L15,13.5C14.8,13.8 14.4,14 14,14C13.6,14 13.2,13.8 13,13.5L10,10.5C9.8,10.2 9.4,10 9,10S8.2,10.2 8,10.5L3,16V18L8.5,12L12,16L21,9Z"/>
                        </svg>
                      )}
                      {platform.icon === 'goals' && (
                        <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2ZM12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4ZM12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6ZM12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
                        </svg>
                      )}
                    </div>
                    <h4 className="font-medium text-foreground text-sm">{platform.title}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{platform.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <div 
            onClick={() => router.push('/auth/register')}
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full text-white font-bold text-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300 cursor-pointer group shadow-xl hover:shadow-2xl transform hover:scale-105"
          >
            <span>Find your space</span>
            <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
          </div>
         <p className="text-sm text-muted-foreground mt-4">A place where you can finally put down what you've been carrying</p>
        </div>
      </div>
    </section>
  )
}