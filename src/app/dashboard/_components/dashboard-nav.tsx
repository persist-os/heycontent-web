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
              <button
                  onClick={() => {
                    router.push('/dashboard/chat')
                    setIsExpanded(false)
                  }}
                  className="ml-auto p-2 rounded-lg hover:bg-gray-100 text-black hover:text-black"
                  title="New Chat"
              >
                <svg className="w-5 h-5" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g transform="translate(0,512) scale(0.1,-0.1)">
                    <path d="M712 4835 c-205 -49 -390 -239 -431 -443 -8 -36 -11 -476 -11 -1410 0 -1495 -4 -1408 62 -1542 41 -82 161 -206 238 -245 124 -63 148 -67 390 -74 248 -7 261 -10 317 -75 43 -48 51 -81 56 -236 4 -102 10 -150 26 -194 59 -166 186 -274 367 -314 93 -20 189 -9 284 33 59 26 96 60 425 386 264 262 373 364 405 378 44 20 64 21 760 21 795 0 795 0 930 66 98 48 211 160 257 254 67 137 63 47 63 1543 0 934 -3 1373 -11 1409 -19 95 -85 213 -161 289 -75 75 -189 138 -286 158 -83 17 -3609 14 -3680 -4z m1936 -1077 c18 -11 41 -37 52 -59 18 -35 20 -59 20 -293 l0 -255 263 -3 c255 -3 263 -4 300 -27 51 -31 81 -91 74 -149 -5 -50 -29 -87 -77 -119 -32 -22 -40 -23 -296 -23 l-263 0 -3 -269 c-3 -255 -4 -271 -24 -298 -35 -48 -82 -73 -134 -73 -52 0 -99 25 -134 73 -20 27 -21 43 -24 298 l-3 269 -263 0 c-256 0 -264 1 -296 23 -77 52 -100 138 -58 211 45 77 58 81 356 84 l262 3 0 255 c0 232 2 258 19 293 24 45 39 59 88 77 45 16 96 10 141 -18z" fill="currentColor"/>
                  </g>
                </svg>
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
                                <Logo size="medium" />
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
                    {recentChats.map((chat) => (
                        <Link
                            key={chat.id}
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