'use client'

import React, { memo, useCallback, useMemo, useRef, useEffect, useState } from 'react'
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
    label: 'Chat with Content',
    icon: BarChart3,
    href: '/dashboard/chat',
  },
  {
    id: 'content-hub',
    label: 'Content Hub',
    icon: BarChart3,
    href: '/dashboard/content-hub',
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
  createdAt?: number;
}

// Helper function to format relative time
const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  // For older chats, show the actual date
  return new Date(timestamp).toLocaleDateString();
};

export const DashboardNav = memo(function DashboardNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { isExpanded, setIsExpanded } = useSidebar();
  const [recentChats, setRecentChats] = useState<ChatHistory[]>([])
  const [apiKeyError, setApiKeyError] = useState(false);
  
  // Refs for throttling
  const lastMouseMoveTime = useRef(0);
  const mouseMoveThrottleMs = 100; // Throttle to 10fps max

  // Memoized fetch function to prevent recreation
  const fetchRecentChats = useCallback(async () => {
    try {
      const apiKey = await getApiKey();
      if (!apiKey) {
        // Silently fail if no API key, but track the error
        setApiKeyError(true);
        return;
      }
      
      setApiKeyError(false);
      const response = await fetch('/api/chat/history?limit=5', {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Chat history API response:', data);
        if (data.conversations) {
          console.log('Recent chats data:', data.conversations);
          setRecentChats(data.conversations);
        }
      }
    } catch (error) {
      console.error('Failed to fetch recent chats:', error);
      setApiKeyError(true);
    }
  }, []);

  // Only fetch when sidebar expands and we don't have an API key error
  useEffect(() => {
    if (isExpanded && !apiKeyError) {
      fetchRecentChats();
    }
  }, [isExpanded, fetchRecentChats, apiKeyError]);

  // Throttled proximity-based sidebar toggle
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const now = Date.now();
    if (now - lastMouseMoveTime.current < mouseMoveThrottleMs) {
      return; // Throttle to reduce excessive calls
    }
    lastMouseMoveTime.current = now;
    
    const proximityThreshold = 50; // pixels from left edge
    const mouseX = e.clientX;
    
    // Open sidebar when mouse is near left edge
    if (mouseX < proximityThreshold && !isExpanded) {
      setIsExpanded(true);
    }
    // Close sidebar when mouse moves away (but not immediately)
    else if (mouseX > 300 && isExpanded) {
      setIsExpanded(false);
    }
  }, [isExpanded, setIsExpanded]);

  // Proximity-based sidebar toggle with throttling
  useEffect(() => {
    // Add event listener to document
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    
    // Cleanup
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleMouseMove]);

  // Memoize active item calculation
  const isItemActive = useCallback((item: typeof navItems[0]) => {
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
  }, [pathname]);

  // Memoize the self hub link
  const selfHubLink = useMemo(() => (
    <Link
      href="/dashboard/self-hub"
      onClick={() => setIsExpanded(false)}
      className={`flex items-center transition-colors p-2 rounded-md ${
        pathname.startsWith('/dashboard/self-hub')
          ? 'bg-primary'
          : 'hover:bg-muted/80'
      }`}
    >
      <Users className={`w-6 h-6 ${
        pathname.startsWith('/dashboard/self-hub')
          ? 'text-white dark:text-black'
          : 'text-foreground'
      }`} />
      {isExpanded && <span className={`ml-3 text-sm font-medium ${
        pathname.startsWith('/dashboard/self-hub')
          ? 'text-white dark:text-black'
          : 'text-foreground'
      }`}>Self</span>}
    </Link>
  ), [pathname, isExpanded, setIsExpanded]);

  // Memoize the settings link
  const settingsLink = useMemo(() => (
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
  ), [pathname, isExpanded, setIsExpanded]);

  return (
    <div className={`h-screen fixed top-0 left-0 bg-muted/20 shadow-lg flex flex-col justify-between transition-all duration-300 z-40 ${isExpanded ? 'w-64 translate-x-0' : 'w-64 -translate-x-full md:w-16 md:translate-x-0'}`}>
      <div>
        <div className={`flex items-center h-20 ${isExpanded ? 'px-4' : 'justify-center'}`}>
          {selfHubLink}
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
                  <item.icon className={`w-6 h-6 ${
                    isItemActive(item)
                      ? 'text-white dark:text-black'
                      : 'text-foreground'
                  }`} />
                )}
              </div>
              {isExpanded && (
                <span className={`ml-4 text-sm font-medium ${isItemActive(item) ? 'dark:text-black' : ''}`}>{isExpanded ? item.label : ''}</span>
              )}
            </Link>
          ))}
        </div>
      </div>
      <div>
        {isExpanded && (
          <div className="px-6 my-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-semibold text-black dark:text-white uppercase tracking-wider">Recent Chats</h3>
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
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-sm text-black dark:text-white truncate">{chat.topic}</span>
                      {chat.createdAt ? (
                        <span className="text-xs text-black dark:text-white">
                          {formatRelativeTime(chat.createdAt)}
                        </span>
                      ) : (
                        <span className="text-xs text-red-500">No timestamp</span>
                      )}
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground p-2">No recent chats.</p>
              )}
            </div>
          </div>
        )}
        <div className="flex flex-col items-center gap-2 mb-4">
          {settingsLink}
          <ThemeToggle />
        </div>
      </div>
    </div>
  )
});