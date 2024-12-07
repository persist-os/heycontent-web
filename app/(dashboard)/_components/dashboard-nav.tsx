'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Logo } from '@/app/_components/logo'
import { 
  Brain, Users, MessageSquare, Settings, 
  Briefcase, ChevronLeft, Clock, Star
} from 'lucide-react'

// Add type for recent chats
type RecentChat = {
  id: number
  topic: string
  lastMessage: string
  timestamp: string
}

const navItems = [
  { 
    id: 'chat', 
    label: 'AI Assistant',
    icon: MessageSquare,
    href: '/chat',
    color: 'text-pink-500'
  },
  { 
    id: 'ai-insights', 
    label: 'AI Insights',
    icon: Brain,
    href: '/ai-insights',
    color: 'text-purple-500'
  },
  { 
    id: 'audience', 
    label: 'Audience DNA',
    icon: Users,
    href: '/audience',
    color: 'text-green-500'
  },
  { 
    id: 'partnerships', 
    label: 'Partnerships',
    icon: Briefcase,
    href: '/partnerships',
    color: 'text-orange-500'
  }
]

export function DashboardNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const [isExpanded, setIsExpanded] = useState(false)
  const [recentChats, setRecentChats] = useState<RecentChat[]>([])
  const [isHovering, setIsHovering] = useState(false)

  // Fetch recent chats
  useEffect(() => {
    const fetchRecentChats = async () => {
      if (!session?.user?.id) return
      try {
        const response = await fetch('/api/chat/history?limit=5')
        const data = await response.json()
        if (data.conversations) {
          setRecentChats(data.conversations.map((conv: any) => ({
            id: conv.id,
            topic: conv.topic || 'Untitled Chat',
            lastMessage: conv.messages[conv.messages.length - 1]?.content || '',
            timestamp: new Date(conv.updatedAt).toLocaleDateString()
          })))
        }
      } catch (error) {
        console.error('Failed to fetch recent chats:', error)
      }
    }

    fetchRecentChats()
  }, [session?.user?.id])

  return (
    <>
      {/* Wider hover detection area with shadow indicator */}
      <div 
        className="fixed left-0 top-0 bottom-0 w-16 z-50 transition-all duration-300"
        onMouseEnter={() => setIsHovering(true)}
        style={{
          background: 'linear-gradient(to right, rgba(0,0,0,0.01), transparent)',
          pointerEvents: 'none'
        }}
      />
      
      {/* Actual hover detection area */}
      <div 
        className="fixed left-0 top-0 bottom-0 w-8 z-50"
        onMouseEnter={() => setIsHovering(true)}
      />

      {/* Nav content */}
      <div 
        className={`fixed left-0 top-0 bottom-0 z-40 w-64 transition-transform duration-300 ease-in-out ${
          isHovering ? 'translate-x-0' : '-translate-x-[calc(100%-1px)]'
        }`}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className="relative h-full bg-white/80 backdrop-blur-md border-r border-gray-100">
          {/* Logo Area */}
          <div className="h-16 flex items-center px-6">
            <div 
              className={`group flex items-center transition-all duration-300 ease-in-out transform
                ${isHovering ? 'scale-100 opacity-100' : 'scale-90 opacity-50'}
              `}
            >
              <Logo 
                className={`h-12 text-gray-900 animate-fade-in
                  ${isHovering ? 'animate-float' : ''}
                  group-hover:scale-105 group-hover:rotate-1 transition-all duration-300
                `}
              />
            </div>
          </div>

          {/* Main Navigation */}
          <div className="flex flex-col h-[calc(100%-4rem)]">
            {/* Nav Items */}
            <div className="flex-1 px-3 py-6">
              <div className="space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                      pathname === item.href 
                        ? 'bg-gray-100 font-medium ' + item.color
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 ${pathname === item.href ? item.color : ''}`} />
                    <span className="transition-opacity duration-200 ease-in-out"
                      style={{ opacity: isHovering ? 1 : 0 }}
                    >
                      {item.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Bottom Section */}
            <div className="shrink-0 border-t transition-opacity duration-200 ease-in-out"
              style={{ opacity: isHovering ? 1 : 0 }}
            >
              {/* Recent Chats */}
              <div className="px-3 py-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Recent Chats</span>
                  <Link 
                    href="/history"
                    className="text-xs text-blue-500 hover:underline"
                  >
                    View All
                  </Link>
                </div>
                <div className="space-y-1">
                  {recentChats.map((chat) => (
                    <Link
                      key={chat.id}
                      href={`/chat?id=${chat.id}`}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
                    >
                      <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="truncate">{chat.topic}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Settings */}
              <div className="px-3 py-4 border-t">
                <Link
                  href="/settings"
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                    pathname === '/settings' 
                      ? 'bg-gray-100 font-medium text-gray-500'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Settings className="w-5 h-5" />
                  <span>Settings</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}