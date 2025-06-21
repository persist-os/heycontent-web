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
import { ThemeToggle } from '@/components/theme-toggle'

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
    color: 'text-foreground',
    activeColor: 'text-foreground font-medium',
    iconColor: 'text-foreground'
  },
  {
    id: 'content-hub',
    label: 'Content Hub',
    icon: BarChart3,
    href: '/dashboard/content-hub',
    color: 'text-blue-600 dark:text-blue-400',
    activeColor: 'text-blue-600 dark:text-blue-400 font-medium',
    iconColor: 'text-blue-600 dark:text-blue-400'
  },
  {
    id: 'notes',
    label: 'Smart Notes',
    icon: FileText,
    href: '/dashboard/notes',
    color: 'text-red-600 dark:text-red-400',
    activeColor: 'text-red-600 dark:text-red-400 font-medium',
    iconColor: 'text-red-600 dark:text-red-400'
  },
  {
    id: 'self-hub',
    label: 'Self',
    icon: Users,
    href: '/dashboard/self-hub',
    color: 'text-purple-600 dark:text-purple-400',
    activeColor: 'text-purple-600 dark:text-purple-400 font-medium',
    iconColor: 'text-purple-600 dark:text-purple-400'
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
            <div className="w-4 h-0.5 bg-black dark:bg-white rounded-full"></div>
            <div className="w-3 h-0.5 bg-black dark:bg-white rounded-full"></div>
          </div>
        </div>

        {/* Expanded state */}
        <div
            ref={navRef}
            className={`absolute top-0 left-0 h-full w-64 bg-background border-r border-border shadow-sm transform transition-transform duration-300 ${
                isExpanded ? 'translate-x-0' : '-translate-x-full'
            }`}
        >
          <div className="relative h-full">
            {/* Header */}
            <div className="h-16 flex items-center px-6 border-b border-border">
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
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors hover:bg-secondary/50 ${
                            pathname === item.href || 
                            (item.id === 'content-hub' && (pathname.startsWith('/dashboard/content') || pathname.startsWith('/dashboard/ai-insights'))) ||
                            (item.id === 'self-hub' && pathname.startsWith('/dashboard/self-hub'))
                              ? 'font-medium' : ''
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          {item.id === 'chat' ? (
                            <div className="w-10 h-10 flex items-center justify-center">
                              <Logo size="medium" disableLink />
                            </div>
                          ) : (
                            <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                          )}
                          <span className={`text-sm ${pathname === item.href ? item.activeColor : item.color}`}>
                            {item.label}
                          </span>
                        </div>
                      </Link>
                  ))}
                </div>
              </div>

              {/* Bottom Section */}
              <div className="shrink-0 border-t border-border">
                {/* Recent Chats */}
                <div className="px-3 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">Recent Chats</span>
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
                            className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-secondary rounded-lg"
                        >
                          <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="truncate">{chat.topic}</span>
                        </Link>
                    ))}
                  </div>
                </div>

                {/* Theme Toggle */}
                <div className="px-3 py-2">
                  <ThemeToggle />
                </div>

                {/* Settings */}
                <div className="px-3 py-4 border-t border-border">
                  <Link
                      href="/settings"
                      onClick={() => setIsExpanded(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                          pathname === '/settings'
                              ? 'bg-secondary font-medium text-foreground'
                              : 'text-muted-foreground hover:bg-secondary'
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