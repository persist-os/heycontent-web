"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Bot, Brain, Lightbulb, Loader2, X, Sparkles, ArrowRight, FileText, Users, BarChart3, BookOpen, CheckSquare, List, Heading1, Heading2, Heading3, Link, ExternalLink, Table } from 'lucide-react';
import { useNotes } from '@/app/context/notes-context';

interface InlineCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  position: { top: number; left: number };
  onAskAI: (prompt: string) => Promise<void>;
  onRequestAnalysis: (noteType: string) => Promise<void>;
  onRequestIdeas: () => Promise<void>;
  onLinkNote?: (noteId: string) => void;
  onInsertBulletList: () => void;
  onInsertNumberedList: () => void;
  onInsertHeading: (level: number) => void;
  onInsertLink?: (url: string, text: string) => void;
  onInsertLinkEmbed?: (url: string) => void;
  onInsertTable?: (rows: number, cols: number) => void;
  onGenerateTableFromContent?: () => Promise<void>;
  noteType?: string;
  availableNotes?: Array<{ _id: string; title: string; type: string }>;
  currentNoteId?: string;
  showNoteLinks?: boolean;
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

interface NoteOption {
  id: string;
  title: string;
  type: string;
  icon: React.ReactNode;
  action: () => void;
}

// Unified interface for display
interface DisplayOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
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

// Note type icons mapping
const NOTE_TYPE_ICONS: Record<string, React.ReactNode> = {
  idea_bank: <Lightbulb className="w-4 h-4" />,
  content_script: <FileText className="w-4 h-4" />,
  analytics_insight: <BarChart3 className="w-4 h-4" />,
  collaboration_note: <Users className="w-4 h-4" />,
  reflection_journal: <BookOpen className="w-4 h-4" />,
  task_checklist: <CheckSquare className="w-4 h-4" />,
};

export function InlineCommandPalette({
  isOpen,
  onClose,
  position,
  onAskAI,
  onRequestAnalysis,
  onRequestIdeas,
  onLinkNote,
  onInsertBulletList,
  onInsertNumberedList,
  onInsertHeading,
  onInsertLink,
  onInsertLinkEmbed,
  onInsertTable,
  onGenerateTableFromContent,
  noteType = 'idea_bank',
  availableNotes = [],
  currentNoteId,
  showNoteLinks = false
}: InlineCommandPaletteProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loadingCommand, setLoadingCommand] = useState<string | null>(null);
  const [showAIPrompt, setShowAIPrompt] = useState(false);
  const [showAnalysisTypes, setShowAnalysisTypes] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [showLinkEmbedInput, setShowLinkEmbedInput] = useState(false);
  const [showTableInput, setShowTableInput] = useState(false);
  const [aiPrompt, setAIPrompt] = useState('');
  const [noteSearchTerm, setNoteSearchTerm] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const mainInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { setActiveNoteId } = useNotes();

  // Debug logging
  console.log('InlineCommandPalette props:', {
    isOpen,
    showNoteLinks,
    availableNotesCount: availableNotes.length,
    currentNoteId
  });

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

  const handleNoteLinkSelect = (noteId: string) => {
    if (onLinkNote) {
      onLinkNote(noteId);
    } else {
      setActiveNoteId(noteId);
    }
    onClose();
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

  const handleInsertTable = () => {
    setShowTableInput(true);
    setSelectedIndex(0);
  };

  const handleSubmitTable = () => {
    if (onInsertTable) {
      onInsertTable(tableRows, tableCols);
    }
    onClose();
  };

  const handleGenerateTableFromContent = async () => {
    setLoadingCommand('generate-table');
    try {
      if (onGenerateTableFromContent) {
        await onGenerateTableFromContent();
      }
      onClose();
    } catch (error) {
      console.error('Failed to generate table from content:', error);
    } finally {
      setLoadingCommand(null);
    }
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
      id: 'generate-table',
      label: 'Generate table',
      description: 'AI creates table from content',
      icon: <Table className="w-4 h-4" />,
      action: handleGenerateTableFromContent,
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
    },
    {
      id: 'table',
      label: 'Insert table',
      description: 'Create a data table',
      icon: <Table className="w-4 h-4" />,
      action: handleInsertTable,
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

  // Filter notes based on search term and exclude current note
  const filteredNotes = availableNotes
    .filter(note => 
      String(note._id) !== currentNoteId && 
      note.title.toLowerCase().includes(noteSearchTerm.toLowerCase())
    );

  const noteCommands: NoteOption[] = filteredNotes.map(note => ({
    id: String(note._id),
    title: note.title,
    type: note.type,
    icon: NOTE_TYPE_ICONS[note.type] || <Link className="w-4 h-4" />,
    action: () => handleNoteLinkSelect(String(note._id)),
  }));

  const currentOptions = showAnalysisTypes ? analysisCommands : showNoteLinks ? noteCommands : mainCommands;

  // Convert to display options for rendering
  const displayOptions: DisplayOption[] = currentOptions.map(option => {
    if ('label' in option) {
      // CommandOption
      return {
        id: option.id,
        label: option.label,
        icon: option.icon,
        action: option.action,
        category: option.category
      };
    } else {
      // NoteOption
      return {
        id: option.id,
        label: option.title,
        icon: option.icon,
        action: option.action,
        category: 'Notes'
      };
    }
  });

  // Calculate position to prevent cutoff
  const calculatePosition = () => {
    const menuWidth = 600;
    const menuHeight = 400;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = 20;
    
    // The position is already calculated by getCursorCoordinates with boundary checking
    // But we can do a final validation here
    let finalLeft = position.left;
    let finalTop = position.top;
    
    // Additional safety checks for extreme cases
    if (finalLeft + menuWidth > viewportWidth - margin) {
      finalLeft = Math.max(margin, viewportWidth - menuWidth - margin);
    }
    if (finalLeft < margin) {
      finalLeft = margin;
    }
    
    if (finalTop + menuHeight > viewportHeight - margin) {
      finalTop = Math.max(margin, viewportHeight - menuHeight - margin);
    }
    if (finalTop < margin) {
      finalTop = margin;
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
            showAIPrompt ? prev : (prev + 1) % displayOptions.length
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          e.stopPropagation();
          setSelectedIndex(prev => 
            showAIPrompt ? prev : (prev - 1 + displayOptions.length) % displayOptions.length
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
          } else if (showTableInput) {
            handleSubmitTable();
          } else {
            displayOptions[selectedIndex]?.action();
          }
          break;
        case 'Escape':
          e.preventDefault();
          e.stopPropagation();
          if (showAIPrompt || showAnalysisTypes || showNoteLinks || showLinkInput || showLinkEmbedInput || showTableInput) {
            setShowAIPrompt(false);
            setShowAnalysisTypes(false);
            setShowLinkInput(false);
            setShowLinkEmbedInput(false);
            setShowTableInput(false);
            setAIPrompt('');
            setNoteSearchTerm('');
            setLinkUrl('');
            setLinkText('');
            setTableRows(3);
            setTableCols(3);
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
        }, [isOpen, selectedIndex, showAIPrompt, showAnalysisTypes, showNoteLinks, showLinkInput, showLinkEmbedInput, showTableInput, aiPrompt, linkUrl, tableRows, tableCols, displayOptions]);

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
      setShowTableInput(false);
      setAIPrompt('');
      setNoteSearchTerm('');
      setLinkUrl('');
      setLinkText('');
      setTableRows(3);
      setTableCols(3);
      setLoadingCommand(null);
      // Focus the main input if not in a special input mode
      setTimeout(() => {
        if (!showAIPrompt && !showNoteLinks && !showLinkInput && !showLinkEmbedInput && !showTableInput) {
          mainInputRef.current?.focus();
        }
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const finalPosition = calculatePosition();

  // Group commands by category
  const groupedCommands = displayOptions.reduce((acc, command) => {
    const category = command.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(command);
    return acc;
  }, {} as Record<string, DisplayOption[]>);

  return (
    <div
      ref={menuRef}
      className="fixed z-[200] bg-background border border-border rounded-lg shadow-2xl overflow-hidden backdrop-blur-sm"
      style={{
        top: finalPosition.top + 'px',
        left: finalPosition.left + 'px',
        width: '600px',
        maxHeight: '400px',
        maxWidth: 'calc(100vw - 40px)' // Ensure it doesn't exceed viewport width
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
        ) : showTableInput ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Table className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Table size:</span>
            </div>
                         <div className="flex items-center gap-4 pl-6">
               <div className="flex items-center gap-2">
                 <label htmlFor="table-rows-input" className="text-xs text-muted-foreground">Rows:</label>
                 <input
                   id="table-rows-input"
                   type="number"
                   min="2"
                   max="10"
                   value={tableRows}
                   onChange={(e) => setTableRows(Math.max(2, Math.min(10, parseInt(e.target.value) || 2)))}
                   className="w-16 bg-transparent text-sm text-center border border-border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary/30"
                   autoFocus
                 />
               </div>
               <div className="flex items-center gap-2">
                 <label htmlFor="table-cols-input" className="text-xs text-muted-foreground">Cols:</label>
                 <input
                   id="table-cols-input"
                   type="number"
                   min="2"
                   max="8"
                   value={tableCols}
                   onChange={(e) => setTableCols(Math.max(2, Math.min(8, parseInt(e.target.value) || 2)))}
                   className="w-16 bg-transparent text-sm text-center border border-border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary/30"
                   onKeyDown={(e) => {
                     if (e.key === 'Enter') {
                       handleSubmitTable();
                     }
                   }}
                 />
               </div>
             </div>
            <div className="flex items-center gap-2 px-2 py-1 bg-muted/30 rounded text-xs text-muted-foreground">
              <span className="font-mono">Preview:</span>
              <span className="font-mono text-blue-600 dark:text-blue-400">
                {tableRows}×{tableCols} table with headers
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-muted-foreground" />
            <input
              ref={mainInputRef}
              type="text"
              placeholder={showNoteLinks ? "Search notes to link..." : "Ask Content anything..."}
              className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
              value={showAIPrompt ? aiPrompt : showNoteLinks ? noteSearchTerm : ''}
              onChange={(e) => {
              if (showAIPrompt) {
                setAIPrompt(e.target.value);
              } else if (showNoteLinks) {
                setNoteSearchTerm(e.target.value);
              }
            }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && showAIPrompt && aiPrompt.trim()) {
                  handleSubmitAIPrompt();
                }
              }}
              onFocus={() => {
                if (!showAIPrompt && !showNoteLinks) {
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
        ) : showTableInput ? (
          <div className="p-3">
            <button
              onClick={handleSubmitTable}
              className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted/50 rounded-md transition-colors"
            >
              <Table className="w-4 h-4 text-green-600 dark:text-green-400" />
              <div className="flex-1 text-left">
                <div className="text-sm font-medium">Create table</div>
                <div className="text-xs text-muted-foreground">
                  {tableRows} rows × {tableCols} columns with headers
                </div>
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
                    const globalIndex = displayOptions.indexOf(option);
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
            ) : showTableInput ? (
              <>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-muted rounded text-xs">↵</kbd>
                  to create table
                </span>
                <span className="flex items-center gap-1">
                  Min 2×2, Max 10×8
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