'use client'

import { MessageSquare, MoreHorizontal, Trash2 } from 'lucide-react'
import { T } from '@/components/translation'

interface RecentConversationItemProps {
  id: string;
  topic: string;
  timestamp: string;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
  showMenu: boolean;
  onToggleMenu: (e: React.MouseEvent) => void;
}

export function RecentConversationItem({
  id,
  topic,
  timestamp,
  onClick,
  onDelete,
  showMenu,
  onToggleMenu,
}: RecentConversationItemProps) {
  return (
    <div className="group flex items-center gap-3 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 border border-border/30 transition-all">
      <button
        onClick={onClick}
        className="flex items-center gap-4 flex-1 min-w-0"
        title={topic}
      >
        <div className="w-10 h-10 rounded-xl bg-card border border-border/50 flex items-center justify-center flex-shrink-0 shadow-sm">
          <MessageSquare className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {topic}
          </p>
          <p className="text-xs text-muted-foreground/60 font-light mt-0.5">
            {timestamp}
          </p>
        </div>
      </button>
      <div className="relative">
        <button
          onClick={onToggleMenu}
          className="opacity-0 group-hover:opacity-100 p-2 hover:bg-muted/50 rounded-lg transition-all flex-shrink-0"
          title="More options"
        >
          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
        </button>
        {showMenu && (
          <div className="absolute right-0 top-full mt-2 w-40 bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-xl z-50">
            <div className="py-2">
              <button
                onClick={onDelete}
                className="w-full px-4 py-2.5 text-left text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex items-center gap-3 rounded-lg mx-1"
              >
                <Trash2 className="w-4 h-4" />
                <T context="dashboard_nav.button.delete_chat">Delete chat</T>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

