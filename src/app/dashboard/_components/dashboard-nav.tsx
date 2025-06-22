'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Logo } from '@/components/ui/logo'
import {
  Users, Settings, FileText, LogOut, BarChart3, Menu, X, MessageSquare, Clock
} from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { useSidebar } from '@/app/context/sidebar-context'
import { getApiKey } from '@/app/lib/api-helpers'

const navItems = [
  {
    id: 'chat',
    label: 'Chat With Content',
    icon: Logo,
    href: '/dashboard/chat',
  },
  {
    id: 'content-hub',
    label: 'Content Hub',
    icon: BarChart3,
    href: '/dashboard/content-hub',
  },
  {
    id: 'self-hub',
    label: 'Self',
    icon: Users,
    href: '/dashboard/self-hub',
  },
  {
    id: 'notes',
    label: 'Smart Notes',
    icon: FileText,
    href: '/dashboard/notes',
  },
]

interface ChatHistory {
  id: string;
  topic: string;
  preview?: string;
}

export function DashboardNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { isExpanded, setIsExpanded } = useSidebar();
  const [recentChats, setRecentChats] = useState<ChatHistory[]>([])

  useEffect(() => {
    const fetchRecentChats = async () => {
      try {
        const apiKey = await getApiKey();
        if (!apiKey) {
          // Silently fail if no API key, as the user might not be logged in yet
          return;
        }
        const response = await fetch('/api/chat/history?limit=5', {
          headers: { 'Authorization': `Bearer ${apiKey}` },
        });
        if (response.ok) {
          const data = await response.json();
          if (data.conversations) {
            setRecentChats(data.conversations);
          }
        }
      } catch (error) {
        console.error('Failed to fetch recent chats:', error);
      }
    };

    if (isExpanded) {
      fetchRecentChats();
    }
  }, [isExpanded]);

  const isItemActive = (item: typeof navItems[0]) => {
    switch (item.id) {
      case 'content-hub':
        // This tab is active for multiple, non-nested routes
        return pathname.startsWith('/dashboard/content') || pathname.startsWith('/dashboard/ai-insights');
      case 'self-hub':
        // This tab is active for all its sub-routes
        return pathname.startsWith(item.href);
      case 'chat':
      case 'notes':
        // These tabs are only active on their exact pages, not sub-pages
        return pathname === item.href;
      default:
        return false;
    }
  }

  return (
    <div className={`h-screen fixed top-0 left-0 bg-muted/20 shadow-lg flex flex-col justify-between transition-all duration-300 z-40 ${isExpanded ? 'w-64 translate-x-0' : 'w-64 -translate-x-full md:w-16 md:translate-x-0'}`}>
      <div>
        <div className={`flex items-center h-20 ${isExpanded ? 'justify-between px-4' : 'justify-center'}`}>
            <div className={`transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0 md:opacity-100'}`}>
                {isExpanded && <Logo />}
                
            </div>
          <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 rounded-md hover:bg-muted hidden md:flex" aria-label="Toggle navigation">
            <Menu className="w-6 h-6"/>
          </button>
        </div>

        <div className="flex flex-col items-center gap-4 mt-8">
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => setIsExpanded(false)}
              className={`flex items-center w-full h-12 rounded-none transition-colors ${
                isExpanded ? 'justify-start px-6' : 'justify-center'
              } ${
                isItemActive(item)
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted/80'
              }`}
            >
              <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
                {item.id === 'chat' ? (
                  <Logo disableLink />
                ) : (
                  <item.icon className="w-6 h-6 text-foreground" />
                )}
              </div>
              {isExpanded && <span className="ml-4 text-sm font-medium">{isExpanded ? item.label : ''}</span>}
            </Link>
          ))}
        </div>
      </div>
      <div>
        {isExpanded && (
          <div className="px-6 my-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent Chats</h3>
              <Link href="/dashboard/history" onClick={() => setIsExpanded(false)} className="text-xs text-primary hover:underline">
                View All
              </Link>
            </div>
            <div className="space-y-1">
              {recentChats.length > 0 ? (
                recentChats.map((chat) => (
                  <Link
                    key={chat.id}
                    href={`/dashboard/chat?id=${chat.id}`}
                    onClick={() => setIsExpanded(false)}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-muted"
                    title={chat.topic}
                  >
                    <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-sm text-foreground truncate">{chat.topic}</span>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground p-2">No recent chats.</p>
              )}
            </div>
          </div>
        )}
        <div className="flex flex-col items-center gap-2 mb-4">
          <Link
            href="/settings"
            onClick={() => setIsExpanded(false)}
            className={`flex items-center w-full h-12 rounded-none transition-all ${
              isExpanded ? 'px-6' : 'justify-center'
            } ${
              pathname === '/settings'
                ? 'bg-muted font-medium'
                : 'hover:bg-muted'
            }`}
          >
            <Settings className="w-6 h-6 text-foreground" />
            {isExpanded && <span className="ml-4 text-sm font-medium">Settings</span>}
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </div>
  )
}