import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from '../types/command';
import { searchCommands, parseCommandString, createQuickAskCommand } from '../lib/commands';

const MAX_HISTORY = 50;

interface CommandHistory {
  timestamp: number;
  command: Command;
  input?: string;
}

export function useCommandPaletteState() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [history, setHistory] = useState<CommandHistory[]>([]);
  const [recentCommands, setRecentCommands] = useState<Command[]>([]);
  const [shortcutBuffer, setShortcutBuffer] = useState<string[]>([]);
  const [shortcutTimeout, setShortcutTimeout] = useState<NodeJS.Timeout | null>(null);

  // Search results based on input
  const searchResults = searchCommands(input);
  
  // Parse command if input starts with /
  const parsedCommand = parseCommandString(input);

  // Get suggestions if we have an AI command
  const suggestions = parsedCommand.command?.type === 'ai' 
    ? parsedCommand.command.generateSuggestions?.(parsedCommand.args)
    : Promise.resolve([]);

  // Add command to history
  const addToHistory = useCallback((command: Command, cmdInput?: string) => {
    setHistory(prev => {
      const newHistory = [
        { timestamp: Date.now(), command, input: cmdInput },
        ...prev,
      ].slice(0, MAX_HISTORY);
      return newHistory;
    });

    // Update recent commands based on frequency
    setRecentCommands(prev => {
      const commandCount = new Map<string, number>();
      [...history, { command }].forEach(item => {
        const count = commandCount.get(item.command.id) || 0;
        commandCount.set(item.command.id, count + 1);
      });

      // Filter to ensure we only get Command types
      return Array.from(commandCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id]) => {
          const result = searchCommands('').find(cmd => cmd.id === id);
          // Only include if it's a Command type and result exists
          return result && 'type' in result && (
            result.type === 'navigation' ||
            result.type === 'action' ||
            result.type === 'ai' ||
            result.type === 'search' ||
            result.type === 'quick_ask'
          ) ? result : null;
        })
        .filter((cmd): cmd is Command => cmd !== null);
    });
  }, [history]);

  // Execute a command
  const executeCommand = useCallback((command: Command, cmdInput?: string) => {
    switch (command.type) {
      case 'navigation':
        router.push(command.href);
        break;
      case 'action':
        command.action();
        break;
      case 'ai':
        command.action(cmdInput);
        break;
      case 'search':
        command.onSearch(cmdInput || '');
        break;
      case 'quick_ask':
        router.push(`/dashboard/chat?ask=${encodeURIComponent(command.question)}`);
        break;
    }
    addToHistory(command, cmdInput);
    setIsOpen(false);
    setInput('');
  }, [router, addToHistory]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    // Handle keyboard shortcuts
    if (e.key === 'g') {
      setShortcutBuffer(['g']);
      if (shortcutTimeout) {
        clearTimeout(shortcutTimeout);
      }
      setShortcutTimeout(setTimeout(() => {
        setShortcutBuffer([]);
      }, 2000));
      return;
    }

    if (shortcutBuffer.length === 1 && shortcutBuffer[0] === 'g') {
      const command = searchResults.find(cmd => 
        'shortcut' in cmd && 
        Array.isArray(cmd.shortcut) && 
        cmd.shortcut.length === 2 && 
        cmd.shortcut[0] === 'g' && 
        cmd.shortcut[1] === e.key &&
        'type' in cmd && (
          cmd.type === 'navigation' ||
          cmd.type === 'action' ||
          cmd.type === 'ai' ||
          cmd.type === 'search' ||
          cmd.type === 'quick_ask'
        )
      );
      
      if (command && 'type' in command) {
        e.preventDefault();
        executeCommand(command as Command);
        setShortcutBuffer([]);
        if (shortcutTimeout) {
          clearTimeout(shortcutTimeout);
        }
        return;
      }
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(i => (i + 1) % searchResults.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(i => (i - 1 + searchResults.length) % searchResults.length);
        break;
      case 'Enter':
        e.preventDefault();
        const selectedResult = searchResults[activeIndex];
        if (selectedResult && 'type' in selectedResult && (
          selectedResult.type === 'navigation' ||
          selectedResult.type === 'action' ||
          selectedResult.type === 'ai' ||
          selectedResult.type === 'search' ||
          selectedResult.type === 'quick_ask'
        )) {
          executeCommand(selectedResult, input);
        } else if (input.trim()) {
          executeCommand(createQuickAskCommand(input.trim()));
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  }, [isOpen, searchResults, activeIndex, input, executeCommand, shortcutBuffer, shortcutTimeout]);

  // Set up keyboard listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (shortcutTimeout) {
        clearTimeout(shortcutTimeout);
      }
    };
  }, [handleKeyDown, shortcutTimeout]);

  return {
    isOpen,
    setIsOpen,
    input,
    setInput,
    activeIndex,
    setActiveIndex,
    searchResults,
    recentCommands,
    history,
    executeCommand,
    parsedCommand,
    suggestions,
  };
} 