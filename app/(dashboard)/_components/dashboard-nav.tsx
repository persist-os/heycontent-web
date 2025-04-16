'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { auth } from '@/app/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { Logo } from '@/app/_components/logo'
import { useSidebar } from '@/app/context/sidebar-context'
import {
  Brain, Users, MessageSquare, Settings,
  Briefcase, ChevronLeft, Clock, Star, FileText,
  ChevronRight
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
  },
  {
    id: 'notes',
    label: 'Smart Notes',
    icon: FileText,
    href: '/notes',
    color: 'text-blue-500'
  }
]

export function DashboardNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [recentChats, setRecentChats] = useState<RecentChat[]>([])
  const { isExpanded, setIsExpanded } = useSidebar()

  useEffect(() => {
    if (!auth) {
      console.error('Firebase auth not initialized')
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
    })
    return () => unsubscribe()
  }, [])

  // Fetch recent chats
  useEffect(() => {
    const fetchRecentChats = async () => {
      if (!user?.uid) return
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
  }, [user?.uid])

  return (
    <>
      {/* Collapsed state overlay */}
      {!isExpanded && (
        <div
          className="h-full w-16 bg-white border-r border-gray-200 shadow-sm"
          onClick={() => setIsExpanded(true)}
        >
          <div className="h-16 flex items-center justify-center border-b border-gray-100">
            <Logo className="h-8 text-gray-900" />
          </div>
          <div className="flex flex-col items-center py-4 space-y-4">
            {navItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={`p-2 rounded-lg transition-all ${
                  pathname === item.href
                    ? 'bg-gray-100 ' + item.color
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
                title={item.label}
              >
                <item.icon className={`w-5 h-5 ${pathname === item.href ? item.color : ''}`} />
              </Link>
            ))}
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
            <Link
              href="/settings"
              className="flex items-center justify-center p-2 rounded-lg text-gray-600 hover:bg-gray-50"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </Link>
          </div>
        </div>
      )}

      {/* Expanded state */}
      <div
        className={`h-full bg-white border-r border-gray-200 shadow-sm transition-all duration-300 ${
          isExpanded ? 'w-64' : 'w-0 overflow-hidden'
        }`}
      >
        <div className="relative h-full">
          {/* Logo Area with Toggle */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100">
            <Logo className="h-12 text-gray-900" />
            <button
              onClick={() => setIsExpanded(false)}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700"
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
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
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                      pathname === item.href
                        ? 'bg-gray-100 font-medium ' + item.color
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 ${pathname === item.href ? item.color : ''}`} />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Bottom Section */}
            <div className="shrink-0 border-t border-gray-100">
              {/* Recent Chats */}
              <div className="px-3 py-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Recent Chats</span>
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
              <div className="px-3 py-4 border-t border-gray-100 relative z-20">
                <Link
                  href="/settings"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
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