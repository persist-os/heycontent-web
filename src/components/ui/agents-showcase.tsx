'use client'

import React, { useState, useEffect } from 'react'
import { MessageCircle, BarChart3, Zap, Globe, Brain, ArrowRight, Play, Pause, Instagram, Mail, Database, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { YouTubeBrandIcon } from '@/lib/YoutubeBrandIcon'
import Tilt from 'react-parallax-tilt'

const mockChatMessages = [
  {
    type: 'user',
    message: "What Instagram content can I create based on my latest YouTube video 'How to Edit Like a Pro'?",
    timestamp: '2:34 PM'
  },
  {
    type: 'system',
    message: "🔍 Cross-referencing YouTube video with Instagram audience patterns...",
    timestamp: '2:34 PM',
    loading: true
  },
  {
    type: 'agent',
    message: "Perfect cross-platform opportunity! Your YouTube video had 15 key editing techniques. I found that your Instagram audience engages 340% more with carousel posts about tutorials. I've created 3 carousel concepts: '5 Quick Edit Tricks', 'Before/After Transformations', and 'Tools Every Creator Needs'.",
    timestamp: '2:34 PM',
    data: {
      source_platform: "YouTube: 'How to Edit Like a Pro'",
      target_platform: "Instagram carousel strategy",
      engagement_boost: "+340% for tutorial carousels",
      content_created: "3 carousel concepts ready",
      audience_insight: "Prefers bite-sized tutorial content"
    }
  },
  {
    type: 'user',
    message: "Should I reach out to any brands based on my content performance this month?",
    timestamp: '2:35 PM'
  },
  {
    type: 'system',
    message: "🧠 Analyzing performance data + Gmail partnership patterns...",
    timestamp: '2:35 PM',
    loading: true
  },
  {
    type: 'agent',
    message: "Yes! Your editing tutorials are trending (+580% growth). I found 23 tech brands in your Gmail that sponsor similar creators. Adobe and Filmora would be perfect - your audience demographic matches their target. I've drafted personalized pitch emails with your best performance metrics.",
    timestamp: '2:35 PM',
    data: {
      growth_trend: "+580% in editing content",
      brand_matches: "23 tech brands identified",
      top_targets: "Adobe, Filmora, Final Cut Pro",
      pitch_ready: "3 personalized emails drafted",
      success_probability: "High match (87% alignment)"
    }
  }
]

const connectedPlatforms = [
  {
    title: "Instagram",
    description: "Deep engagement analysis across posts, stories & reels",
    icon: Instagram,
    iconProps: { className: "w-6 h-6 text-white" },
    color: "from-purple-500 to-pink-500",
    status: "connected",
          insights: [
        "🧠 1,247 posts analyzed for audience emotion & viral prediction patterns",
        "🔥 Cross-platform AI turns your YouTube hits into Instagram gold",
        "🎯 Engagement forecasting predicts which posts will break 100K+",
        "💡 Smart memory identifies your content DNA across every post"
      ]
  },
  {
    title: "YouTube",
    description: "Advanced video performance & audience insights",
    icon: YouTubeBrandIcon,
    iconProps: { className: "w-6 h-6" },
    color: "from-red-500 to-red-600",
    status: "connected",
          insights: [
        "📈 847 videos analyzed to decode your creator success formula",
        "🎬 AI maps exact moments where audience attention peaks & drops",
        "🚀 Cross-platform intelligence spots which videos drive Instagram viral moments",
        "💰 Performance AI predicts partnership value before you even reach out"
      ]
  },
  {
    title: "Gmail",
    description: "Partnership & business communication insights",
    icon: "gmail-image",
    iconProps: { className: "w-6 h-6" },
    color: "from-blue-500 to-blue-600",
    status: "connected",
    insights: [
      "🤝 342 partnership emails analyzed - AI finds hidden $50K+ opportunities",
      "💰 Brand deal prediction engine scores your partnership potential in real-time",
      "📊 Success pattern AI learns from every creator deal to optimize your outreach",
      "🎯 Strategic timing AI maximizes response rates based on partnership data"
    ]
  }
];

const comingSoonPlatforms = [
  {
    title: "TikTok",
    description: "Viral trend analysis & content optimization",
    icon: "tiktok-image",
    color: "from-pink-600 to-purple-600",
    status: "coming_soon"
  },
  {
    title: "X (Twitter)",
    description: "Real-time engagement & thread performance",
    icon: "twitter",
    color: "from-blue-400 to-blue-600", 
    status: "coming_soon"
  },
  {
    title: "Google Calendar",
    description: "Content scheduling & deadline management",
    icon: "google-calendar-image",
    color: "from-blue-500 to-green-500",
    status: "coming_soon"
  },
  {
    title: "Notion",
    description: "Content planning & knowledge management",
    icon: "notion", 
    color: "from-gray-600 to-gray-800",
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
              🏗️ The OS the next generation of creators will run on
            </span>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-foreground via-blue-800 dark:via-blue-400 to-purple-800 dark:to-purple-400 bg-clip-text text-transparent leading-relaxed tracking-tight py-2 mb-6">
            A new layer on top of the entire creator stack
          </h2>
          <p className="text-xl sm:text-2xl text-muted-foreground leading-relaxed max-w-4xl mx-auto">
            HeyContent connects all your platforms and tools with deep AI insights. 
            We build a smart memory of your content, analyze patterns across millions of creators, and give you the exact strategies that work.
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
                                  <span className="text-blue-400">📹</span>
                                  <span>{msg.data.source_platform}</span>
                                </div>
                              )}
                              {msg.data.target_platform && (
                                <div className="flex items-center gap-2">
                                  <span className="text-pink-400">📸</span>
                                  <span>{msg.data.target_platform}</span>
                                </div>
                              )}
                              {msg.data.engagement_boost && (
                                <div className="flex items-center gap-2">
                                  <span className="text-green-400">📈</span>
                                  <span>{msg.data.engagement_boost}</span>
                                </div>
                              )}
                              {msg.data.content_created && (
                                <div className="flex items-center gap-2">
                                  <span className="text-purple-400">✨</span>
                                  <span>{msg.data.content_created}</span>
                                </div>
                              )}
                              {msg.data.audience_insight && (
                                <div className="flex items-center gap-2">
                                  <span className="text-cyan-400">🎯</span>
                                  <span>{msg.data.audience_insight}</span>
                                </div>
                              )}
                              {msg.data.growth_trend && (
                                <div className="flex items-center gap-2">
                                  <span className="text-green-400">📊</span>
                                  <span>{msg.data.growth_trend}</span>
                                </div>
                              )}
                              {msg.data.brand_matches && (
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-400">🏢</span>
                                  <span>{msg.data.brand_matches}</span>
                                </div>
                              )}
                              {msg.data.top_targets && (
                                <div className="flex items-center gap-2">
                                  <span className="text-orange-400">🎯</span>
                                  <span>{msg.data.top_targets}</span>
                                </div>
                              )}
                              {msg.data.pitch_ready && (
                                <div className="flex items-center gap-2">
                                  <span className="text-purple-400">📧</span>
                                  <span>{msg.data.pitch_ready}</span>
                                </div>
                              )}
                              {msg.data.success_probability && (
                                <div className="flex items-center gap-2">
                                  <span className="text-emerald-400">🎪</span>
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
                    <span>Smart search through 847 videos, 1,247 posts, 342 emails...</span>
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
                  <Database className="w-6 h-6 text-blue-500" />
                  <h3 className="text-xl font-bold text-foreground">Your content, smart memory</h3>
                </div>
                <p className="text-muted-foreground">
                  We don't just connect your platforms - we build a smart memory of every piece of content. 
                  This means we understand what works, why it works, and how to replicate your success.
                </p>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <div className="relative bg-background/60 backdrop-blur-sm rounded-xl border border-border p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Brain className="w-6 h-6 text-purple-500" />
                  <h3 className="text-xl font-bold text-foreground">Deep insights, not surface metrics</h3>
                </div>
                <p className="text-muted-foreground">
                  Beyond likes and views - we analyze content themes, audience sentiment, engagement patterns, 
                  and compare against millions of creators to find your unique growth opportunities.
                </p>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <div className="relative bg-background/60 backdrop-blur-sm rounded-xl border border-border p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Zap className="w-6 h-6 text-orange-500" />
                  <h3 className="text-xl font-bold text-foreground">The creator OS you've been waiting for</h3>
                </div>
                <p className="text-muted-foreground">
                  One layer that connects Instagram, YouTube, Gmail, and all your tools. Chat with your content, 
                  get AI recommendations, and watch your creator business transform into a data-driven operation.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Connected Platforms */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-center mb-4 text-foreground">
            Currently Connected
          </h3>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Deep analysis powered by your actual content and audience data
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {connectedPlatforms.map((platform, index) => (
              <Tilt
                key={index}
                tiltMaxAngleX={10}
                tiltMaxAngleY={10}
                perspective={1000}
                scale={1.05}
                transitionSpeed={1000}
              >
                <div
                  className={`relative group cursor-pointer transition-all duration-300 ${
                    selectedIntegration === index ? 'scale-105' : ''
                  }`}
                  onClick={() => setSelectedIntegration(index)}
                >
                  <div className={`absolute -inset-1 bg-gradient-to-r ${platform.color} rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity`}></div>
                  <div className="relative bg-background/80 backdrop-blur-sm rounded-xl border border-border p-6 h-full">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-3 ${platform.title === 'YouTube' || platform.title === 'Gmail' ? 'bg-white' : `bg-gradient-to-r ${platform.color}`} rounded-xl flex items-center justify-center`}>
                        {platform.icon === 'gmail-image' ? (
                          <img src="/icons8-gmail-240.png" alt="Gmail" className="w-6 h-6" />
                        ) : typeof platform.icon === 'string' ? (
                          <span className="text-xl">{platform.icon}</span>
                        ) : React.createElement(platform.icon, platform.iconProps || {})}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-foreground text-lg">{platform.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs text-green-600 dark:text-green-400 font-medium">Connected</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{platform.description}</p>
                    <div className="space-y-2">
                      {platform.insights.map((insight, insightIndex) => (
                        <div key={insightIndex} className="flex items-start gap-2 text-sm">
                          <span className="text-sm opacity-80">{insight}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Tilt>
            ))}
          </div>

          {/* Coming Soon Platforms */}
          <h3 className="text-2xl font-bold text-center mb-4 text-foreground">
            Coming Soon
          </h3>
          <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
            More platforms to complete your creator stack + many more
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
                    <div className={`p-2 ${platform.title === 'TikTok' || platform.title === 'Google Calendar' ? 'bg-white' : `bg-gradient-to-r ${platform.color}`} rounded-lg flex items-center justify-center`}>
                      {platform.icon === 'tiktok-image' && (
                        <img src="/icons8-tiktok-500.png" alt="TikTok" className="w-6 h-6" />
                      )}
                      {platform.icon === 'twitter' && (
                        <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                      )}
                      {platform.icon === 'google-calendar-image' && (
                        <img src="/icons8-google-calendar-240.png" alt="Google Calendar" className="w-6 h-6" />
                      )}
                      {platform.icon === 'notion' && (
                        <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.934zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z"/>
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
            <span>Connect your first platform</span>
            <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
          </div>
          <p className="text-sm text-muted-foreground mt-4">Join countless creators building the future with HeyContent</p>
        </div>
      </div>
    </section>
  )
} 