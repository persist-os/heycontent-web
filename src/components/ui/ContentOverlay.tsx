"use client";

import React from 'react';
import { X } from 'lucide-react';

interface ContentOverlayProps {
  children: React.ReactNode;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  className?: string;
}

export const ContentOverlay: React.FC<ContentOverlayProps> = ({
  children,
  onClose,
  title,
  subtitle,
  icon,
  className = ''
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`bg-background rounded-lg shadow-xl max-w-7xl w-full max-h-[95vh] flex flex-col overflow-hidden ${className}`}>
        {/* Header */}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {icon && (
                  <div className="flex items-center gap-3">
                    {icon}
                    <div>
                      <h1 className="text-2xl font-bold">{title}</h1>
                      <p className="text-muted-foreground">{subtitle}</p>
                    </div>
                  </div>
                )}
              </div>
              <button
                title="Close"
                onClick={onClose}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto p-6 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}; 