'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { getFirebaseAuth } from '@/app/lib/firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { Logo } from '@/components/ui/logo'
import { useSidebar } from '@/app/context/sidebar-context'
import {
  Brain, Users, MessageSquare, Settings,
  Briefcase, ChevronLeft, Clock, Star, FileText,
  ChevronRight, LogOut, BarChart3, Video
} from 'lucide-react'

// Add type for recent chats
interface RecentChat {
  id: string
  topic: string
  lastMessage: string
  timestamp: string
}

const navItems = [
  {
    id: 'chat',
    label: 'Chat With Content',
    icon: Logo,
    href: '/dashboard/chat',
    color: 'text-black'
  },
  {
    id: 'content',
    label: 'Content Analytics',
    icon: BarChart3,
    href: '/dashboard/content',
    color: 'text-blue-500'
  },
  {
    id: 'ai-insights',
    label: 'AI Insights',
    icon: Brain,
    href: '/dashboard/ai-insights',
    color: 'text-purple-500'
  },
  // {
  //   id: 'audience',
  //   label: 'Audience DNA',
  //   icon: Users,
  //   href: '/dashboard/audience',
  //   color: 'text-green-500'
  // },
  // {
  //   id: 'partnerships',
  //   label: 'Partnerships',
  //   icon: Briefcase,
  //   href: '/dashboard/partnerships',
  //   color: 'text-orange-500'
  // },
  {
    id: 'notes',
    label: 'Smart Notes',
    icon: FileText,
    href: '/dashboard/notes',
    color: 'text-red-500'
  }
]

export function DashboardNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [userId, setUserId] = useState<string | undefined>()
  const [userEmail, setUserEmail] = useState<string | undefined>()
  const [recentChats, setRecentChats] = useState<RecentChat[]>([])
  const { isExpanded, setIsExpanded, isViewingNote } = useSidebar()
  const navRef = useRef<HTMLDivElement>(null)
  const toggleButtonRef = useRef<HTMLDivElement>(null)

  // Add click outside handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Don't handle click outside if clicking the toggle button
      if (toggleButtonRef.current?.contains(event.target as Node)) {
        return
      }
      if (navRef.current && !navRef.current.contains(event.target as Node) && isExpanded) {
        setIsExpanded(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isExpanded, setIsExpanded])

  useEffect(() => {
    let auth
    try {
      auth = getFirebaseAuth()
    } catch (e) {
      auth = null
    }
    if (!auth) return
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setUserId(firebaseUser?.uid)
      setUserEmail(firebaseUser?.email)
    })
    return () => unsubscribe()
  }, [])

  // Fetch recent chats
  useEffect(() => {
    const fetchRecentChats = async () => {
      if (!userId) return
      try {
        // Get the API key from localStorage or backend
        const { getApiKey } = await import('@/app/lib/api-helpers');
        const apiKey = await getApiKey();
        if (!apiKey) {
          throw new Error('No API key found. Please log in again.');
        }
        const response = await fetch('/api/chat/history?limit=5', {
          headers: { 'Authorization': `Bearer ${apiKey}` },
        });
        const data = await response.json()
        if (data.conversations) {
          setRecentChats(data.conversations.map((conv: any, index: number) => ({
            id: conv.id || `conv-${index}`,
            topic: conv.topic || 'Untitled Chat',
            lastMessage: conv.messages?.[conv.messages.length - 1]?.content || '',
            timestamp: new Date(conv.updatedAt || Date.now()).toLocaleDateString()
          })))
        }
      } catch (error) {
        console.error('Failed to fetch recent chats:', error)
      }
    }

    fetchRecentChats()
  }, [userId])

  return (
      <>
        {/* Menu toggle button */}
        <div
            ref={toggleButtonRef}
            className={`fixed top-7 left-5 z-50 ${isViewingNote ? 'hidden' : 'block'}`}
        >
          <div className="flex flex-col gap-1 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
            <div className="w-4 h-0.5 bg-black rounded-full"></div>
            <div className="w-3 h-0.5 bg-black rounded-full"></div>
          </div>
        </div>

        {/* Expanded state */}
        <div
            ref={navRef}
            className={`absolute top-0 left-0 h-full w-64 bg-white border-r border-gray-200 shadow-sm transform transition-transform duration-300 ${
                isExpanded ? 'translate-x-0' : '-translate-x-full'
            }`}
        >
          <div className="relative h-full">
            {/* Header */}
            <div className="h-16 flex items-center px-6 border-b border-gray-100">
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
                          onClick={() => setIsExpanded(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                              pathname === item.href
                                  ? 'bg-gray-100 font-medium ' + item.color
                                  : 'text-gray-600 hover:bg-gray-50'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          {item.id === 'chat' ? (
                              <div className="w-10 h-10 flex items-center justify-center">
                                <Logo size="medium" disableLink />
                              </div>
                          ) : (
                              <item.icon className={`w-5 h-5 ${item.color}`} />
                          )}
                          <span className="text-sm font-medium">{item.label}</span>
                        </div>
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
                        href="/dashboard/history"
                        onClick={() => setIsExpanded(false)}
                        className="text-xs text-blue-500 hover:underline"
                    >
                      View All
                    </Link>
                  </div>
                  <div className="space-y-1">
                    {recentChats.map((chat, index) => (
                        <Link
                            key={chat.id || `chat-${index}`}
                            href={`/dashboard/chat?id=${chat.id}`}
                            onClick={() => setIsExpanded(false)}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
                        >
                          <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                          <span className="truncate">{chat.topic}</span>
                        </Link>
                    ))}
                  </div>
                </div>

                {/* Settings */}
                <div className="px-3 py-4 border-t border-gray-100">
                  <Link
                      href="/settings"
                      onClick={() => setIsExpanded(false)}
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