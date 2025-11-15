'use client'

import React, { memo, useCallback, useMemo, useEffect, useState, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  FileText, Shield, Zap, Sparkles, Radio, Home, PenTool, Mail
} from 'lucide-react'
import { useSidebar } from '@/app/context/sidebar-context'
import { getApiKey } from '@/app/lib/api-helpers'
import { DeleteConfirmationDialog } from '@/components/ui/DeleteConfirmationDialog'
import { useAdminAuth, useBloggerAuth } from '@/app/lib/admin-auth'
import { cn } from '@/lib/utils'
import { useLanguagePreference, useTranslation } from '@/hooks/useTranslation'
import { T } from '@/components/translation/T'
import { useUnifiedSearch } from '@/hooks/useUnifiedSearch'
import { useTiptapEditor } from '@/app/context/tiptap-editor-context'
import {
  CommandPaletteHeader,
  CommandPaletteSearch,
  SpacesGrid,
  RecentConversations,
  EmptySearchState,
  SearchResults,
} from '@/components/command-palette'

const navItems = [
  {
    id: 'home',
    label: 'Home',
    description: 'Your personalized dashboard',
    icon: Home,
    href: '/dashboard/home',
    dataAttr: 'data-home-link',
    category: 'navigate',
  },
  // {
  //   id: 'briefing-room',
  //   label: 'Briefing Room',
  //   description: 'Living intelligence command center',
  //   icon: Radio,
  //   href: '/dashboard/briefing_room',
  //   dataAttr: 'data-briefing-room-link',
  //   category: 'explore',
  // },
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
  const { canAccessBlogger } = useBloggerAuth();
  const { language } = useLanguagePreference();
  const { isTiptapEditorActive } = useTiptapEditor();
  
  // Get translated placeholder text
  const { text: searchPlaceholder } = useTranslation('Search spaces, chats, or actions...', {
    context: 'dashboard_nav.search.placeholder',
    targetLang: language,
    enabled: true,
  });
  
  // Unified search hook (gets Firebase userId internally)
  const {
    searchQuery,
    setSearchQuery,
    searchMode,
    setSearchMode,
    results: searchResults,
    isSearching,
    triggerVectorSearch
  } = useUnifiedSearch({
    enabled: isExpanded
  });
  
  const [recentChats, setRecentChats] = useState<ChatHistory[]>([])
  const [apiKeyError, setApiKeyError] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showChatMenu, setShowChatMenu] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  

  // Build nav items based on user permissions
  const dynamicNavItems = [
    ...navItems,
    // Only show blogger dashboard to users with blogger access
    ...(canAccessBlogger ? [
      {
        id: 'blogger',
        label: 'Blog Editor',
        description: 'Create and manage blog posts',
        icon: PenTool,
        href: '/dashboard/blogger',
        dataAttr: 'data-blogger-link',
        category: 'create',
      }
    ] : []),
    // Only show admin and briefing room to users with admin access
    ...(canAccessAdmin ? [
      {
        id: 'briefing-room',
        label: 'Briefing Room',
        description: 'Living intelligence command center',
        icon: Radio,
        href: '/dashboard/briefing_room',
        dataAttr: 'data-briefing-room-link',
        category: 'explore',
      },
      {
        id: 'admin',
        label: 'Admin',
        description: 'System administration and controls',
        icon: Shield,
        href: '/admin',
        dataAttr: 'data-admin-link',
        category: 'system',
      },
      {
        id: 'admin-emails',
        label: 'Email Campaigns',
        description: 'Draft and send emails to users',
        icon: Mail,
        href: '/admin/emails',
        dataAttr: 'data-admin-emails-link',
        category: 'system',
      }
    ] : []),
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
        if (data.conversations) {
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
      setSearchMode('keyword');
    }
  }, [isExpanded, fetchRecentChats, apiKeyError, setSearchQuery, setSearchMode]);

  // Handle search input key events
  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      e.preventDefault();
      triggerVectorSearch();
    } else if (e.key === 'Escape') {
      setIsExpanded(false);
    }
  }, [searchQuery, triggerVectorSearch, setIsExpanded]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command/Ctrl + K to open command palette (disabled when Tiptap editor is active)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        // Don't open if Tiptap editor is active
        if (isTiptapEditorActive) {
          return;
        }
        e.preventDefault();
        setIsExpanded(!isExpanded);
      }
      // Escape to close
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
        setSearchQuery('');
        setSearchMode('keyword');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded, setIsExpanded, setSearchQuery, setSearchMode, isTiptapEditorActive]);

  // Close chat menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showChatMenu) {
        setShowChatMenu(null);
      }
    };

    if (showChatMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showChatMenu]);

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
      case 'home':
        // Home is active for /dashboard/home or just /dashboard
        return pathname === '/dashboard/home' || pathname === '/dashboard';
      case 'briefing-room':
        // This tab is active for briefing room routes
        return pathname.startsWith('/dashboard/briefing_room');
      case 'thinking-lab':
        // This tab is active for thinking lab routes
        return pathname.startsWith('/dashboard/thinking_lab');
      case 'chat':
      case 'notes':
      case 'admin':
      case 'blogger':
      case 'admin-emails':
        // These tabs are only active on their exact pages, not sub-pages
        return pathname === item.href;
      default:
        return false;
    }
  }, [pathname]);

  const handleToggleChatMenu = useCallback((chatId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowChatMenu(showChatMenu === chatId ? null : chatId);
  }, [showChatMenu]);

  const handleDeleteChatClick = useCallback((chatId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowChatMenu(null);
    openDeleteDialog(chatId, e);
  }, [openDeleteDialog]);

  return (
    <>
      {/* Backdrop with blur effect */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-md z-40 transition-all duration-300"
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
        <div className="w-[90vw] max-w-2xl bg-card/95 backdrop-blur-2xl border border-border/50 rounded-3xl shadow-2xl shadow-primary/10 overflow-hidden">
          
          {/* Header */}
          <CommandPaletteHeader
            onClose={() => setIsExpanded(false)}
            onSettingsClick={() => handleNavigate('/settings')}
            isSettingsActive={pathname === '/settings'}
          />

          {/* Search */}
          <CommandPaletteSearch
            ref={searchInputRef}
            value={searchQuery}
            onChange={setSearchQuery}
            onKeyDown={handleSearchKeyDown}
            placeholder={searchPlaceholder}
          />

          {/* Content */}
          <div className="max-h-[60vh] overflow-y-auto">
            
            {/* Show search results if searching */}
            {searchQuery.trim() ? (
              <SearchResults
                results={searchResults}
                isSearching={isSearching}
                searchMode={searchMode}
                onNavigate={handleNavigate}
              />
            ) : (
              <>
                {/* Navigation Items */}
                <SpacesGrid
                  items={filteredNavItems}
                  isItemActive={isItemActive}
                  onNavigate={handleNavigate}
                />

                {/* Recent Chats */}
                <RecentConversations
                  chats={filteredChats}
                  onNavigate={handleNavigate}
                  onViewAll={() => handleNavigate('/dashboard/history')}
                  formatTimestamp={formatRelativeTime}
                  showChatMenu={showChatMenu}
                  onToggleChatMenu={handleToggleChatMenu}
                  onDeleteChat={handleDeleteChatClick}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title={<T context="dialog.delete.conversation.title">Delete Conversation</T>}
        description={<T context="dialog.delete.conversation.description">Are you sure you want to delete this conversation? This action cannot be undone.</T>}
        isLoading={isDeleting}
      />
    </>
  )
});