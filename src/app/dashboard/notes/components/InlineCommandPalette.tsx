"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Bot, Brain, Lightbulb, Loader2, X } from 'lucide-react';

interface InlineCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  position: { top: number; left: number };
  onAskAI: (prompt: string) => Promise<void>;
  onRequestAnalysis: (noteType: string) => Promise<void>;
  onRequestIdeas: () => Promise<void>;
  noteType?: string;
}

interface CommandOption {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  requiresInput?: boolean;
}

const NOTE_TYPES = [
  { value: 'idea_bank', label: 'Idea Bank' },
  { value: 'content_script', label: 'Content Script' },
  { value: 'analytics_insight', label: 'Analytics Insight' },
  { value: 'collaboration_note', label: 'Collaboration Note' },
  { value: 'reflection_journal', label: 'Reflection Journal' },
  { value: 'task_checklist', label: 'Task Checklist' },
];

export function InlineCommandPalette({
  isOpen,
  onClose,
  position,
  onAskAI,
  onRequestAnalysis,
  onRequestIdeas,
  noteType = 'idea_bank'
}: InlineCommandPaletteProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loadingCommand, setLoadingCommand] = useState<string | null>(null);
  const [showAIPrompt, setShowAIPrompt] = useState(false);
  const [showAnalysisTypes, setShowAnalysisTypes] = useState(false);
  const [aiPrompt, setAIPrompt] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleAskAI = async () => {
    setShowAIPrompt(true);
    setSelectedIndex(0);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleRequestAnalysis = async () => {
    setShowAnalysisTypes(true);
    setSelectedIndex(0);
  };

  const handleRequestIdeas = async () => {
    setLoadingCommand('ideas');
    try {
      await onRequestIdeas();
      onClose();
    } catch (error) {
      console.error('Failed to request ideas:', error);
    } finally {
      setLoadingCommand(null);
    }
  };

  const handleSubmitAIPrompt = async () => {
    if (!aiPrompt.trim()) return;
    
    setLoadingCommand('ask-ai');
    try {
      await onAskAI(aiPrompt);
      onClose();
    } catch (error) {
      console.error('Failed to ask AI:', error);
    } finally {
      setLoadingCommand(null);
    }
  };

  const handleAnalysisTypeSelect = async (selectedType: string) => {
    setLoadingCommand(selectedType);
    try {
      await onRequestAnalysis(selectedType);
      onClose();
    } catch (error) {
      console.error('Failed to request analysis:', error);
    } finally {
      setLoadingCommand(null);
    }
  };

  const mainCommands: CommandOption[] = [
    {
      id: 'ask-ai',
      label: 'Ask AI Anything',
      description: 'Continue writing or get help',
      icon: <Bot className="w-4 h-4" />,
      action: handleAskAI,
      requiresInput: true
    },
    {
      id: 'analysis',
      label: 'Request Analysis',
      description: 'Analyze with specialized agent',
      icon: <Brain className="w-4 h-4" />,
      action: handleRequestAnalysis
    },
    {
      id: 'ideas',
      label: 'Request Ideas',
      description: 'Get content suggestions',
      icon: <Lightbulb className="w-4 h-4" />,
      action: handleRequestIdeas
    }
  ];

  const currentOptions = showAnalysisTypes ? NOTE_TYPES.map(type => ({
    id: type.value,
    label: type.label,
    description: `Analyze as ${type.label}`,
    icon: <Brain className="w-4 h-4" />,
    action: () => handleAnalysisTypeSelect(type.value)
  })) : mainCommands;

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          e.stopPropagation(); // Prevent global handlers
          setSelectedIndex(prev => 
            showAIPrompt ? prev : (prev + 1) % currentOptions.length
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          e.stopPropagation(); // Prevent global handlers
          setSelectedIndex(prev => 
            showAIPrompt ? prev : (prev - 1 + currentOptions.length) % currentOptions.length
          );
          break;
        case 'Enter':
          e.preventDefault();
          e.stopPropagation(); // Prevent global handlers
          if (showAIPrompt) {
            handleSubmitAIPrompt();
          } else {
            currentOptions[selectedIndex]?.action();
          }
          break;
        case 'Escape':
          e.preventDefault();
          e.stopPropagation(); // Prevent global handlers
          if (showAIPrompt || showAnalysisTypes) {
            setShowAIPrompt(false);
            setShowAnalysisTypes(false);
            setAIPrompt('');
            setSelectedIndex(0);
          } else {
            onClose();
          }
          break;
        // Specifically handle Cmd/Ctrl + K to prevent global command palette
        case 'k':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            e.stopPropagation();
            // Do nothing - we're already open, just prevent global palette
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, showAIPrompt, showAnalysisTypes, aiPrompt, currentOptions]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(0);
      setShowAIPrompt(false);
      setShowAnalysisTypes(false);
      setAIPrompt('');
      setLoadingCommand(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-background border border-border rounded-lg shadow-lg overflow-hidden"
      style={{
        top: position.top + 'px',
        left: position.left + 'px',
        minWidth: '320px',
        maxWidth: '400px'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-muted/10">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">
            {showAIPrompt ? 'Ask AI' : showAnalysisTypes ? 'Select Analysis Type' : 'AI Assistant'}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted/50"
          title="Close AI Assistant"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="py-2">
        {showAIPrompt ? (
          <div className="p-3">
            <input
              ref={inputRef}
              type="text"
              value={aiPrompt}
              onChange={(e) => setAIPrompt(e.target.value)}
              placeholder="What would you like me to help you with?"
              className="w-full p-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              disabled={loadingCommand === 'ask-ai'}
            />
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => {
                  setShowAIPrompt(false);
                  setAIPrompt('');
                }}
                className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
                disabled={loadingCommand === 'ask-ai'}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitAIPrompt}
                disabled={!aiPrompt.trim() || loadingCommand === 'ask-ai'}
                className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loadingCommand === 'ask-ai' && <Loader2 className="w-3 h-3 animate-spin" />}
                Ask AI
              </button>
            </div>
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto">
            {currentOptions.map((option, index) => {
              const isOptionLoading = loadingCommand === option.id;
              return (
                <button
                  key={option.id}
                  onClick={option.action}
                  disabled={isOptionLoading}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-accent/10 transition-colors ${
                    selectedIndex === index ? 'bg-accent/10 text-accent-foreground' : 'text-foreground'
                  } ${isOptionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex-shrink-0 text-muted-foreground">
                    {isOptionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : option.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{option.label}</div>
                    <div className="text-xs text-muted-foreground">{option.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-border bg-muted/5 text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>
            {showAIPrompt ? 'Enter to submit' : '↑↓ to navigate • Enter to select'}
          </span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
} 