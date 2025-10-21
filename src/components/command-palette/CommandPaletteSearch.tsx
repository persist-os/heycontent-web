'use client'

import { Search } from 'lucide-react'
import { forwardRef } from 'react'

interface CommandPaletteSearchProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
}

export const CommandPaletteSearch = forwardRef<HTMLInputElement, CommandPaletteSearchProps>(
  function CommandPaletteSearch({ value, onChange, onKeyDown, placeholder }, ref) {
    return (
      <div className="relative px-6 pb-4 pt-2">
        <Search className="absolute left-10 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40" />
        <input
          ref={ref}
          type="text"
          placeholder={placeholder || "Search or press Enter for semantic search..."}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          className="w-full pl-14 pr-4 py-3.5 bg-muted/40 border border-border/40 rounded-xl text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-muted/50 focus:border-primary/30 transition-all font-light"
        />
      </div>
    );
  }
);

