'use client';

import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { NotesTreeHeader } from './NotesTreeHeader';
import type { NotesTreeHeaderProps } from './NotesTreeHeader';
import { useTranslation } from '@/hooks/useTranslation';

export function CollapsibleHeader(props: NotesTreeHeaderProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const { text: searchPlaceholder } = useTranslation('Search notes...', {
    sourceLang: 'en',
    context: 'notes.search.placeholder'
  });

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          setIsCollapsed(currentScrollY > 50 && currentScrollY > lastScrollY);
          lastScrollY = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    // Throttle scroll events (100ms)
    let scrollTimeout: NodeJS.Timeout;
    const throttledHandleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(handleScroll, 100);
    };

    window.addEventListener('scroll', throttledHandleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', throttledHandleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  return (
    <div
      className={`
        sticky top-0 z-50 transition-all duration-300
        ${isCollapsed ? 'bg-card/90 backdrop-blur-xl' : 'bg-card/95 backdrop-blur-xl'}
        border-b border-border/30 shadow-sm shadow-primary/5
      `}
    >
      {isCollapsed ? (
        <div className="px-4 py-2 safe-top">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary/40 w-4 h-4" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={props.searchTerm}
              onChange={(e) => props.onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gradient-to-r from-muted/20 via-primary/5 to-muted/20 border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:bg-primary/5 focus:border-primary/30 transition-all text-sm"
            />
          </div>
        </div>
      ) : (
        <NotesTreeHeader {...props} />
      )}
    </div>
  );
}

