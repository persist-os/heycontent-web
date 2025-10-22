'use client'

import { T } from '@/components/translation'
import { RecentConversationItem } from './RecentConversationItem'

interface ChatHistory {
  id: string;
  topic: string;
  preview?: string;
  createdAt?: number;
}

interface RecentConversationsProps {
  chats: ChatHistory[];
  onNavigate: (href: string) => void;
  onViewAll: () => void;
  formatTimestamp: (timestamp: number) => string;
  showChatMenu: string | null;
  onToggleChatMenu: (chatId: string, e: React.MouseEvent) => void;
  onDeleteChat: (chatId: string, e: React.MouseEvent) => void;
}

export function RecentConversations({
  chats,
  onNavigate,
  onViewAll,
  formatTimestamp,
  showChatMenu,
  onToggleChatMenu,
  onDeleteChat,
}: RecentConversationsProps) {
  if (chats.length === 0) return null;

  return (
    <div className="px-6 pb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-light text-muted-foreground/70 tracking-wide">
          <T context="dashboard_nav.section.recent_conversations">Recent Conversations</T>
        </h3>
        <button
          onClick={onViewAll}
          className="text-xs text-primary/70 hover:text-primary transition-colors font-light"
        >
          <T context="dashboard_nav.button.view_all">View All</T>
        </button>
      </div>
      <div className="space-y-2">
        {chats.map((chat) => (
          <RecentConversationItem
            key={chat.id}
            id={chat.id}
            topic={chat.topic}
            timestamp={chat.createdAt ? formatTimestamp(chat.createdAt) : 'No timestamp'}
            onClick={() => onNavigate(`/dashboard/thinking_lab?chatId=${chat.id}`)}
            onDelete={(e) => onDeleteChat(chat.id, e)}
            showMenu={showChatMenu === chat.id}
            onToggleMenu={(e) => onToggleChatMenu(chat.id, e)}
          />
        ))}
      </div>
    </div>
  );
}

