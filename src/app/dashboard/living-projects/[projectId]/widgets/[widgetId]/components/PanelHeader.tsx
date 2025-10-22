'use client';

import React from 'react';
import { FileText, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { T, TButton } from '@/components/translation';

interface PanelHeaderProps {
  onClose: () => void;
  onQuickNoteToggle: () => void;
}

export function PanelHeader({ onClose, onQuickNoteToggle }: PanelHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
          <FileText className="w-6 h-6 text-primary/70" />
        </div>
        <div>
          <h2 className="text-2xl font-light tracking-tight text-foreground">
            <T context="widget.manage_content">Manage Content</T>
          </h2>
          <p className="text-sm text-muted-foreground/60 font-light">
            <T context="widget.attach_content_description">Attach notes, conversations, and insights</T>
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button 
          variant="default" 
          size="sm"
          onClick={onQuickNoteToggle}
          className="rounded-xl"
        >
          <Plus className="w-4 h-4 mr-2" />
          <T context="button.quick_note">Quick Note</T>
        </Button>
        <div className="px-2 py-1 bg-muted/20 rounded-lg">
          <span className="text-xs font-mono text-muted-foreground/60">ESC</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-muted/30">
          <X className="w-5 h-5 text-muted-foreground/60" />
        </Button>
      </div>
    </div>
  );
}
