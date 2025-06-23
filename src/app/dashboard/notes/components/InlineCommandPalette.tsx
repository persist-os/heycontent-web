"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Bot, Brain, Lightbulb, Loader2, X, Sparkles, ArrowRight, List, Heading1, Heading2, Heading3, Link, ExternalLink } from 'lucide-react';

interface InlineCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  position: { top: number; left: number };
  onAskAI: (prompt: string) => Promise<void>;
  onRequestAnalysis: (noteType: string) => Promise<void>;
  onRequestIdeas: () => Promise<void>;
  onInsertBulletList: () => void;
  onInsertNumberedList: () => void;
  onInsertHeading: (level: number) => void;
  onInsertLink?: (url: string, text: string) => void;
  onInsertLinkEmbed?: (url: string) => void;
  noteType?: string;
}

interface CommandOption {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
  requiresInput?: boolean;
  category?: string;
}

const NOTE_TYPES = [
  { value: 'idea_bank', label: 'Idea Bank', description: 'Generate creative concepts and brainstorm new content ideas' },
  { value: 'content_script', label: 'Content Script', description: 'Structure your content with professional scripting techniques' },
  { value: 'analytics_insight', label: 'Analytics Insight', description: 'Deep dive into performance metrics and data analysis' },
  { value: 'collaboration_note', label: 'Collaboration Note', description: 'Organize team discussions and collaborative workflows' },
  { value: 'reflection_journal', label: 'Reflection Journal', description: 'Document insights and learning experiences' },
  { value: 'task_checklist', label: 'Task Checklist', description: 'Create actionable task lists and project management tools' },
];

export function InlineCommandPalette({
  isOpen,
  onClose,
  position,
  onAskAI,
  onRequestAnalysis,
  onRequestIdeas,
  onInsertBulletList,
  onInsertNumberedList,
  onInsertHeading,
  onInsertLink,
  onInsertLinkEmbed,
  noteType = 'idea_bank'
}: InlineCommandPaletteProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loadingCommand, setLoadingCommand] = useState<string | null>(null);
  const [showAIPrompt, setShowAIPrompt] = useState(false);
  const [showAnalysisTypes, setShowAnalysisTypes] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [showLinkEmbedInput, setShowLinkEmbedInput] = useState(false);
  const [aiPrompt, setAIPrompt] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
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

  const handleInsertLink = () => {
    setShowLinkInput(true);
    setSelectedIndex(0);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleInsertLinkEmbed = () => {
    setShowLinkEmbedInput(true);
    setSelectedIndex(0);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSubmitLink = () => {
    if (!linkUrl.trim()) return;
    
    if (onInsertLink) {
      onInsertLink(linkUrl, linkText || linkUrl);
    }
    onClose();
  };

  const handleSubmitLinkEmbed = () => {
    if (!linkUrl.trim()) return;
    
    if (onInsertLinkEmbed) {
      onInsertLinkEmbed(linkUrl);
    }
    onClose();
  };

  const mainCommands: CommandOption[] = [
    {
      id: 'ideas',
      label: 'Generate ideas',
      icon: <Lightbulb className="w-4 h-4" />,
      action: handleRequestIdeas,
      category: 'Write'
    },
    {
      id: 'analysis',
      label: 'Request analysis',
      icon: <Brain className="w-4 h-4" />,
      action: handleRequestAnalysis,
      category: 'Write'
    },
    {
      id: 'bullet-list',
      label: 'Bullet list',
      description: 'Insert bullet points',
      icon: <List className="w-4 h-4" />,
      action: () => { onInsertBulletList(); onClose(); },
      category: 'Format'
    },
    {
      id: 'numbered-list',
      label: 'Numbered list',
      description: 'Insert numbered list',
      icon: <List className="w-4 h-4" />,
      action: () => { onInsertNumberedList(); onClose(); },
      category: 'Format'
    },
    {
      id: 'heading-1',
      label: 'Heading 1',
      description: 'Large heading',
      icon: <Heading1 className="w-4 h-4" />,
      action: () => { onInsertHeading(1); onClose(); },
      category: 'Format'
    },
    {
      id: 'heading-2',
      label: 'Heading 2',
      description: 'Medium heading',
      icon: <Heading2 className="w-4 h-4" />,
      action: () => { onInsertHeading(2); onClose(); },
      category: 'Format'
    },
    {
      id: 'heading-3',
      label: 'Heading 3',
      description: 'Small heading',
      icon: <Heading3 className="w-4 h-4" />,
      action: () => { onInsertHeading(3); onClose(); },
      category: 'Format'
    },
    {
      id: 'link',
      label: 'Insert link',
      description: 'Add a hyperlink with custom text',
      icon: <Link className="w-4 h-4" />,
      action: handleInsertLink,
      category: 'Format'
    },
    {
      id: 'embed',
      label: 'Embed link',
      description: 'Insert rich link preview',
      icon: <ExternalLink className="w-4 h-4" />,
      action: handleInsertLinkEmbed,
      category: 'Format'
    }
  ];

  const analysisCommands: CommandOption[] = NOTE_TYPES.map(type => ({
    id: type.value,
    label: type.label,
    icon: <Brain className="w-4 h-4" />,
    action: () => handleAnalysisTypeSelect(type.value),
    category: 'Analysis'
  }));

  const currentOptions = showAnalysisTypes ? analysisCommands : mainCommands;

  // Calculate position to prevent cutoff
  const calculatePosition = () => {
    const menuWidth = 600;
    const menuHeight = 400;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let finalLeft = position.left;
    let finalTop = position.top;
    
    // Prevent horizontal cutoff
    if (finalLeft + menuWidth > viewportWidth - 20) {
      finalLeft = viewportWidth - menuWidth - 20;
    }
    if (finalLeft < 20) {
      finalLeft = 20;
    }
    
    // Prevent vertical cutoff
    if (finalTop + menuHeight > viewportHeight - 20) {
      finalTop = Math.max(20, viewportHeight - menuHeight - 20);
    }
    
    return { left: finalLeft, top: finalTop };
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          e.stopPropagation();
          setSelectedIndex(prev => 
            showAIPrompt ? prev : (prev + 1) % currentOptions.length
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          e.stopPropagation();
          setSelectedIndex(prev => 
            showAIPrompt ? prev : (prev - 1 + currentOptions.length) % currentOptions.length
          );
          break;
        case 'Enter':
          e.preventDefault();
          e.stopPropagation();
          if (showAIPrompt) {
            handleSubmitAIPrompt();
          } else if (showLinkInput) {
            handleSubmitLink();
          } else if (showLinkEmbedInput) {
            handleSubmitLinkEmbed();
          } else {
            currentOptions[selectedIndex]?.action();
          }
          break;
        case 'Escape':
          e.preventDefault();
          e.stopPropagation();
          if (showAIPrompt || showAnalysisTypes || showLinkInput || showLinkEmbedInput) {
            setShowAIPrompt(false);
            setShowAnalysisTypes(false);
            setShowLinkInput(false);
            setShowLinkEmbedInput(false);
            setAIPrompt('');
            setLinkUrl('');
            setLinkText('');
            setSelectedIndex(0);
          } else {
            onClose();
          }
          break;
        case 'k':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            e.stopPropagation();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
        }, [isOpen, selectedIndex, showAIPrompt, showAnalysisTypes, showLinkInput, showLinkEmbedInput, aiPrompt, linkUrl, currentOptions]);

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
      setShowLinkInput(false);
      setShowLinkEmbedInput(false);
      setAIPrompt('');
      setLinkUrl('');
      setLinkText('');
      setLoadingCommand(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const finalPosition = calculatePosition();

  // Group commands by category
  const groupedCommands = currentOptions.reduce((acc, command) => {
    const category = command.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(command);
    return acc;
  }, {} as Record<string, CommandOption[]>);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-background border border-border rounded-lg shadow-2xl overflow-hidden backdrop-blur-sm"
      style={{
        top: finalPosition.top + 'px',
        left: finalPosition.left + 'px',
        width: '600px',
        maxHeight: '400px'
      }}
    >
      {/* Search Input */}
      <div className="p-3 border-b border-border">
        {showLinkInput ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Link className="w-4 h-4 text-muted-foreground" />
              <input
                type="url"
                placeholder="Enter URL (e.g., https://www.example.com/page)"
                className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && linkUrl.trim()) {
                    if (!linkText) {
                      document.getElementById('link-text-input')?.focus();
                    } else {
                      handleSubmitLink();
                    }
                  }
                  if (e.key === 'Tab' && linkUrl.trim()) {
                    e.preventDefault();
                    document.getElementById('link-text-input')?.focus();
                  }
                }}
                autoFocus
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4" /> {/* Spacer */}
              <input
                id="link-text-input"
                type="text"
                placeholder="Display text (e.g., 'Ancient History Timeline')"
                className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && linkUrl.trim()) {
                    handleSubmitLink();
                  }
                }}
              />
            </div>
            {(linkUrl.trim() || linkText.trim()) && (
              <div className="flex items-center gap-2 px-2 py-1 bg-muted/30 rounded text-xs text-muted-foreground">
                <span className="font-mono">Preview:</span>
                <span className="font-mono text-blue-600 dark:text-blue-400">
                  [{linkText || linkUrl}]({linkUrl})
                </span>
              </div>
            )}
          </div>
        ) : showLinkEmbedInput ? (
          <div className="flex items-center gap-2">
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
            <input
              type="url"
              placeholder="Enter URL to embed (YouTube, images, etc.)"
              className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && linkUrl.trim()) {
                  handleSubmitLinkEmbed();
                }
              }}
              autoFocus
            />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Ask Content anything..."
              className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
              value={showAIPrompt ? aiPrompt : ''}
              onChange={(e) => setAIPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && showAIPrompt && aiPrompt.trim()) {
                  handleSubmitAIPrompt();
                }
              }}
              onFocus={() => {
                if (!showAIPrompt) {
                  setShowAIPrompt(true);
                }
              }}
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="max-h-80 overflow-y-auto">
        {showLinkInput && linkUrl.trim() ? (
          <div className="p-3">
            <button
              onClick={handleSubmitLink}
              className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted/50 rounded-md transition-colors"
            >
              <Link className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <div className="flex-1 text-left">
                <div className="text-sm font-medium">Insert aliased link</div>
                <div className="text-xs text-muted-foreground truncate">
                  Will insert: [{linkText || linkUrl}]({linkUrl})
                </div>
              </div>
            </button>
          </div>
        ) : showLinkEmbedInput && linkUrl.trim() ? (
          <div className="p-3">
            <button
              onClick={handleSubmitLinkEmbed}
              className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted/50 rounded-md transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <div className="flex-1 text-left">
                <div className="text-sm font-medium">Embed link</div>
                <div className="text-xs text-muted-foreground truncate">{linkUrl}</div>
              </div>
            </button>
          </div>
        ) : showAIPrompt && aiPrompt.trim() ? (
          <div className="p-3">
            <button
              onClick={handleSubmitAIPrompt}
              disabled={loadingCommand === 'ask-ai'}
              className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted/50 rounded-md transition-colors"
            >
              <Bot className="w-4 h-4 text-purple-500 dark:text-yellow-500" />
              <span className="text-sm">Ask: "{aiPrompt}"</span>
              {loadingCommand === 'ask-ai' && <Loader2 className="w-4 h-4 animate-spin ml-auto" />}
            </button>
          </div>
        ) : (
          <div className="py-2">
            {Object.entries(groupedCommands).map(([category, commands]) => (
              <div key={category} className="mb-3 last:mb-0">
                <div className="px-3 py-1">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {category}
                  </h3>
                </div>
                <div className="space-y-0.5">
                  {commands.map((option, index) => {
                    const globalIndex = currentOptions.indexOf(option);
                    const isOptionLoading = loadingCommand === option.id;
                    const isSelected = selectedIndex === globalIndex;
                    
                    return (
                      <button
                        key={option.id}
                        onClick={option.action}
                        disabled={isOptionLoading}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                          isSelected 
                            ? 'bg-purple-500/10 dark:bg-yellow-500/10 text-purple-600 dark:text-yellow-400' 
                            : 'hover:bg-muted/50 text-foreground'
                        } ${isOptionLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <div className="flex-shrink-0">
                          {isOptionLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <div className={isSelected ? 'text-purple-600 dark:text-yellow-400' : 'text-muted-foreground'}>
                              {option.icon}
                            </div>
                          )}
                        </div>
                        <span className="text-sm font-medium">{option.label}</span>
                                                  {isSelected && (
                            <ArrowRight className="w-3 h-3 ml-auto text-purple-600 dark:text-yellow-400" />
                          )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-border bg-muted/5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            {showLinkInput ? (
              <>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Tab</kbd>
                  to next field
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-muted rounded text-xs">↵</kbd>
                  to insert
                </span>
              </>
            ) : (
              <>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-muted rounded text-xs">↑↓</kbd>
                  to navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-muted rounded text-xs">↵</kbd>
                  to select
                </span>
              </>
            )}
          </div>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-muted rounded text-xs">esc</kbd>
            to close
          </span>
        </div>
      </div>
    </div>
  );
} 