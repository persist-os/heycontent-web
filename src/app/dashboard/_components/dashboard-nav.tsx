'use client'

import React, { memo, useCallback, useMemo, useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Logo } from '@/components/ui/logo'
import {
  Users, Settings, FileText, LogOut, BarChart3, Menu, X, MessageSquare, Clock, Handshake, Trash2, Shield, Zap, Search, ArrowRight, Sparkles, Command, Gem
} from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { useSidebar } from '@/app/context/sidebar-context'
import { getApiKey } from '@/app/lib/api-helpers'
import { DeleteConfirmationDialog } from '@/components/ui/DeleteConfirmationDialog'
import { useAdminAuth } from '@/app/lib/admin-auth'
import { cn } from '@/lib/utils'

const navItems = [
  {
    id: 'living-projects',
    label: 'Living Projects',
    description: 'Collaborative spaces that evolve',
    icon: Zap,
    href: '/dashboard/living-projects',
    dataAttr: 'data-living-projects-link',
    category: 'create',
  },
  {
    id: 'notes',
    label: 'Files',
    description: 'AI-enhanced thoughts and ideas',
    icon: FileText,
    href: '/dashboard/notes',
    dataAttr: 'data-smart-notes-link',
    category: 'create',
  },
  {
    id: 'thinking-lab',
    label: 'Thinking Lab',
    description: 'Integrated dialogue, reflection, and insights',
    icon: Sparkles,
    href: '/dashboard/thinking_lab',
    dataAttr: 'data-thinking-lab-link',
    category: 'explore',
  },
  {
    id: 'crystals',
    label: 'Crystals',
    description: 'Crystallized insights from your content',
    icon: Gem,
    href: '/dashboard/crystals',
    dataAttr: 'data-crystals-link',
    category: 'explore',
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
  const { canAccessAdmin } = useAdminAuth();
  const [recentChats, setRecentChats] = useState<ChatHistory[]>([])
  const [apiKeyError, setApiKeyError] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  

  // Build nav items based on user permissions
  const dynamicNavItems = [
    ...navItems,
    // Only show admin to users with admin access
    ...(canAccessAdmin ? [{
      id: 'admin',
      label: 'Admin',
      description: 'System administration and controls',
      icon: Shield,
      href: '/admin',
      dataAttr: 'data-admin-link',
      category: 'system',
    }] : []),
  ];

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
      // Focus search input when opening
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      // Clear search when closing
      setSearchQuery('');
    }
  }, [isExpanded, fetchRecentChats, apiKeyError]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command/Ctrl + K to open command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsExpanded(!isExpanded);
      }
      // Escape to close
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded, setIsExpanded]);

  const handleDeleteChat = useCallback(async (chatId: string) => {
    setIsDeleting(true);
    try {
      const apiKey = await getApiKey();
      
      const response = await fetch(`/api/chat/${chatId}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete conversation');
      }
      
      // Remove from local state only after successful deletion
      setRecentChats(prev => prev.filter(chat => chat.id !== chatId));
      console.log('Successfully deleted conversation:', chatId);
    } catch (error) {
      console.error('Failed to delete chat:', error);
      // Show error to user - you might want to add a toast notification here
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setChatToDelete(null);
    }
  }, []);

  const openDeleteDialog = useCallback((chatId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setChatToDelete(chatId);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (chatToDelete) {
      handleDeleteChat(chatToDelete);
    }
  }, [chatToDelete, handleDeleteChat]);

  const cancelDelete = useCallback(() => {
    setDeleteDialogOpen(false);
    setChatToDelete(null);
  }, []);

  // Filter items based on search query
  const filteredNavItems = useMemo(() => {
    if (!searchQuery.trim()) return dynamicNavItems;
    
    const query = searchQuery.toLowerCase();
    return dynamicNavItems.filter(item => 
      item.label.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query)
    );
  }, [dynamicNavItems, searchQuery]);

  // Filter chats based on search query
  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return recentChats;
    
    const query = searchQuery.toLowerCase();
    return recentChats.filter(chat => 
      chat.topic.toLowerCase().includes(query)
    );
  }, [recentChats, searchQuery]);

  // Handle navigation with search query
  const handleNavigate = useCallback((href: string) => {
    router.push(href);
    setIsExpanded(false);
    setSearchQuery('');
  }, [router, setIsExpanded]);

  // Memoize active item calculation
  const isItemActive = useCallback((item: typeof dynamicNavItems[0]) => {
    switch (item.id) {
      case 'living-projects':
        // This tab is active for living projects and project discovery routes
        return pathname.startsWith('/dashboard/living-projects');
      case 'thinking-lab':
        // This tab is active for thinking lab routes
        return pathname.startsWith('/dashboard/thinking_lab');
      case 'crystals':
        // This tab is active for crystals routes
        return pathname.startsWith('/dashboard/crystals');
      case 'chat':
      case 'notes':
      case 'admin':
        // These tabs are only active on their exact pages, not sub-pages
        return pathname === item.href;
      default:
        return false;
    }
  }, [pathname]);

  return (
    <>
      {/* Backdrop with blur effect */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-all duration-300"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Floating Command Palette */}
      <div className={cn(
        "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 transition-all duration-500 ease-out",
        isExpanded 
          ? "opacity-100 scale-100" 
          : "opacity-0 scale-95 pointer-events-none"
      )}>
        <div className="w-[90vw] max-w-2xl bg-background/95 backdrop-blur-xl border border-border/40 rounded-3xl shadow-2xl overflow-hidden">
          
          {/* Header with Search */}
          <div className="p-6 border-b border-border/20">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary/70" />
                </div>
                <div>
                  <h2 className="text-xl font-light tracking-tight text-foreground">
                    Command Palette
                  </h2>
                  <p className="text-sm text-muted-foreground/60 font-light">
                    Navigate your creative universe
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() => handleNavigate('/settings')}
                  className={cn(
                    "p-1.5 hover:bg-muted/30 rounded-lg transition-colors",
                    pathname === '/settings' && "bg-muted/40"
                  )}
                  title="Settings"
                  aria-label="Settings"
                >
                  <Settings className="w-4 h-4 text-muted-foreground/60" />
                </button>
                <div className="px-2 py-1 bg-muted/20 rounded-lg">
                  <span className="text-xs font-mono text-muted-foreground/60">⌘K</span>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1.5 hover:bg-muted/30 rounded-lg transition-colors"
                  title="Close command palette"
                  aria-label="Close command palette"
                >
                  <X className="w-4 h-4 text-muted-foreground/60" />
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search spaces, chats, or actions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-muted/20 border-0 rounded-2xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-muted/30 transition-all font-light"
              />
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[60vh] overflow-y-auto">
            
            {/* Navigation Items */}
            {filteredNavItems.length > 0 && (
              <div className="p-6">
                <h3 className="text-sm font-light text-muted-foreground/70 mb-4 tracking-wide">
                  Spaces
                </h3>
                <div className="space-y-2">
                  {filteredNavItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleNavigate(item.href)}
                      onMouseEnter={() => setHoveredItem(item.id)}
                      onMouseLeave={() => setHoveredItem(null)}
                      className={cn(
                        "w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 text-left group",
                        isItemActive(item)
                          ? "bg-primary/10 border border-primary/20"
                          : "hover:bg-muted/30 border border-transparent",
                        hoveredItem === item.id && "scale-[1.02]"
                      )}
                      {...{[item.dataAttr]: true}}
                    >
                      <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
                        isItemActive(item)
                          ? "bg-primary/20"
                          : "bg-muted/20 group-hover:bg-muted/40"
                      )}>
                        <item.icon className={cn(
                          "w-7 h-7 transition-colors",
                          isItemActive(item)
                            ? "text-primary"
                            : "text-muted-foreground group-hover:text-foreground"
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-foreground group-hover:text-foreground transition-colors">
                            {item.label}
                          </h4>
                          {isItemActive(item) && (
                            <div className="w-2 h-2 rounded-full bg-primary/60" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground/70 font-light leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Chats */}
            {filteredChats.length > 0 && (
              <div className="px-6 pb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-light text-muted-foreground/70 tracking-wide">
                    Recent Conversations
                  </h3>
                  <button
                    onClick={() => handleNavigate('/dashboard/history')}
                    className="text-xs text-primary/70 hover:text-primary transition-colors font-light"
                  >
                    View All
                  </button>
                </div>
                <div className="space-y-2">
                  {filteredChats.map((chat) => (
                    <div
                      key={chat.id}
                      className="group flex items-center gap-3 p-3 rounded-xl hover:bg-muted/20 transition-all"
                    >
                      <button
                        onClick={() => handleNavigate(`/dashboard/thinking_lab?chatId=${chat.id}`)}
                        className="flex items-center gap-3 flex-1 min-w-0"
                        title={chat.topic}
                      >
                        <div className="w-12 h-12 rounded-xl bg-muted/20 flex items-center justify-center flex-shrink-0">
                          <MessageSquare className="w-6 h-6 text-muted-foreground/60" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {chat.topic}
                          </p>
                          <p className="text-xs text-muted-foreground/60 font-light">
                            {chat.createdAt ? formatRelativeTime(chat.createdAt) : 'No timestamp'}
                          </p>
                        </div>
                      </button>
                      <button
                        onClick={(e) => openDeleteDialog(chat.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-2 hover:bg-destructive/10 rounded-lg transition-all text-destructive/60 hover:text-destructive"
                        title="Delete chat"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Theme */}
            <div className="p-6 border-t border-border/20 bg-muted/10">
              <div className="flex items-center justify-between">
                <span className="text-sm font-light text-muted-foreground/70">Theme</span>
                <ThemeToggle />
              </div>
            </div>

            {/* Empty State */}
            {filteredNavItems.length === 0 && filteredChats.length === 0 && searchQuery.trim() && (
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/20 flex items-center justify-center">
                  <Search className="w-6 h-6 text-muted-foreground/40" />
                </div>
                <h3 className="text-lg font-light text-foreground mb-2">
                  No results found
                </h3>
                <p className="text-muted-foreground/60 font-light">
                  Try adjusting your search or explore available spaces above
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Delete Conversation"
        description="Are you sure you want to delete this conversation? This action cannot be undone."
        isLoading={isDeleting}
      />
    </>
  )
});