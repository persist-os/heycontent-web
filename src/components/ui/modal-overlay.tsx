"use client";

import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  maxWidth?: string;
  maxHeight?: string;
}

export const ModalOverlay: React.FC<ModalOverlayProps> = ({
  isOpen,
  onClose,
  children,
  className = "",
  maxWidth = "max-w-4xl",
  maxHeight = "max-h-[90vh]"
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className={cn(
        "bg-background rounded-lg shadow-xl w-full overflow-hidden relative",
        maxWidth,
        maxHeight,
        className
      )}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>
        
        {children}
      </div>
    </div>
  );
}; 