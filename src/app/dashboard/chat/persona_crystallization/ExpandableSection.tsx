import React from 'react';
import { ChevronDown, ChevronRight, Copy } from 'lucide-react';
import type { SectionProps, ExpandableContentProps } from './types';

/**
 * Reusable expandable section header with enhanced styling and copy functionality
 */
export function ExpandableSection({ 
  isExpanded, 
  onToggle, 
  onCopy, 
  title, 
  count,
  copyTitle 
}: SectionProps) {
  return (
    <button
      onClick={onToggle}
      className="w-full px-4 py-3 bg-muted/20 hover:bg-muted/30 transition-colors flex items-center justify-between text-left border-b border-border/10"
    >
      <div className="flex items-center gap-3">
        {isExpanded ? (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        )}
        <span className="font-semibold text-sm text-foreground">{title}</span>
        <span className="text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full font-medium border border-border/20">
          {count.toLocaleString()}
        </span>
      </div>
      {onCopy && count > 0 && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onCopy();
          }}
          className="p-1.5 hover:bg-muted/40 rounded transition-colors cursor-pointer"
          title={copyTitle || 'Copy to clipboard'}
        >
          <Copy className="h-4 w-4 text-muted-foreground hover:text-foreground" />
        </div>
      )}
    </button>
  );
}

/**
 * Expandable content container with enhanced styling for larger displays
 */
export function ExpandableContent({ 
  isExpanded, 
  children, 
  maxHeight = "max-h-80" // Increased default height for larger display
}: ExpandableContentProps) {
  if (!isExpanded) return null;

  return (
    <div className={`p-4 bg-background/50 ${maxHeight} overflow-y-auto space-y-4`}>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
}
