'use client';

import { useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import { Search, Send, Clock, History } from 'lucide-react';
import { useCommandPaletteState } from '../../app/hooks/useCommandPalette';
import { commandGroups, parseSearchQuery, createQuickAskCommand } from '../../app/lib/commands';
import { Command as CommandType, NavigationCommand } from '../../app/types/command';
import { SearchResult } from '../../app/lib/commands';
import { CommandItem } from './command-palette/CommandItem';
import { SearchResultItem } from './command-palette/SearchResultItem';
import { SearchHelp } from './command-palette/SearchHelp';
import { ActiveFilters } from './command-palette/ActiveFilters';
import { CommandHistory } from './command-palette/types';

export function CommandPalette() {
  const {
    isOpen,
    setIsOpen,
    input,
    setInput,
    activeIndex,
    setActiveIndex,
    searchResults,
    isSearching,
    recentCommands,
    history,
    executeCommand,
    parsedCommand,
    suggestions,
  } = useCommandPaletteState();

  const inputRef = useRef<HTMLInputElement>(null);
  const isSlashCommand = input.startsWith('/');
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const renderSlashCommandHelp = () => {
    if (!isSlashCommand) return null;

    const availableCommands = searchResults
      .filter((result): result is CommandType => 
        'type' in result && 
        (result.type === 'navigation' || 
         result.type === 'action' || 
         result.type === 'ai' || 
         result.type === 'search' || 
         result.type === 'quick_ask')
      )
      .map(cmd => ({
        ...cmd,
        slashCommand: cmd.label.toLowerCase().replace(/\s+/g, '-'),
      }));

    return (
      <div className="border-t border-border">
        <div className="px-4 py-2 text-xs font-medium text-muted-foreground">
          Available Commands
        </div>
        {availableCommands.map((cmd, index) => (
          <button
            key={cmd.id}
            className={`w-full text-left px-4 py-2 hover:bg-accent/10 transition-colors ${
              activeIndex === index ? 'bg-accent/10' : ''
            }`}
            onClick={() => {
              setInput(`/${cmd.slashCommand} `);
              inputRef.current?.focus();
            }}
          >
            <div className="flex items-center gap-2">
              <code className="px-1 py-0.5 bg-muted rounded text-sm">
                /{cmd.slashCommand}
              </code>
              <span className="text-muted-foreground">{cmd.description}</span>
            </div>
          </button>
        ))}
      </div>
    );
  };

  const renderSearchResults = () => {
    if (!input || isSlashCommand) return null;

    const results = searchResults as (CommandType | SearchResult)[];
    const commands = results.filter((r): r is CommandType => 'type' in r && (
      r.type === 'navigation' || r.type === 'action' || r.type === 'ai' || r.type === 'search' || r.type === 'quick_ask'
    ));
    const contentResults = results.filter((r): r is SearchResult => 'type' in r && (
      r.type === 'conversation' || r.type === 'note' || r.type === 'analytics' || 
      r.type === 'insight' || r.type === 'audience' || r.type === 'partnership'
    ));

    return (
      <div className="py-2">
        <div className="mb-4">
          <div className="px-4 py-1 text-xs font-medium text-muted-foreground">
            Ask Content
          </div>
          <button
            className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-accent/10 transition-colors"
            onClick={() => {
              const quickAskCommand = createQuickAskCommand(input);
              executeCommand(quickAskCommand, input);
            }}
          >
            <Send className="w-5 h-5 text-primary" />
            <div className="flex-1">
              <div className="text-base font-medium text-primary">
                Ask Content "{input}"
              </div>
              <p className="text-sm text-muted-foreground">
                Start a conversation about your content
              </p>
            </div>
          </button>
        </div>

        {commands.length > 0 && (
          <div className="mb-4">
            <div className="px-4 py-1 text-xs font-medium text-muted-foreground">
              Commands
            </div>
            {commands.map((command, index) => (
              <CommandItem
                key={command.id}
                command={command}
                isActive={activeIndex === index + 1}
                onSelect={() => executeCommand(command, input)}
                searchQuery={input}
              />
            ))}
          </div>
        )}
        
        {contentResults.length > 0 && (
          <div>
            <div className="px-4 py-1 text-xs font-medium text-muted-foreground">
              Content
            </div>
            {contentResults.map((result, index) => (
              <SearchResultItem
                key={result.id}
                result={result}
                isActive={activeIndex === index + commands.length + 1}
                onSelect={() => {
                  setIsOpen(false);
                  router.push(result.path);
                }}
                searchQuery={input}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const { text, filters } = parseSearchQuery(input);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-5xl min-h-[700px] max-h-[90vh] w-full p-0 bg-background rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden">
        <DialogTitle className="sr-only">Command Palette</DialogTitle>
        <div className="flex items-center px-4 pt-4 pb-2 border-b border-border">
          <Search className="w-5 h-5 text-muted-foreground mr-2" />
          <input
            ref={inputRef}
            className="flex-1 bg-transparent outline-none text-lg py-2"
            placeholder="Type / for commands or search..."
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setActiveIndex(0);
            }}
          />
          <div className="text-sm text-muted-foreground">
            <kbd className="px-1 py-0.5 bg-muted rounded">⌘</kbd>
            <span className="mx-1">+</span>
            <kbd className="px-1 py-0.5 bg-muted rounded">K</kbd>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <ActiveFilters filters={filters} />

          {isSearching && input && (
            <div className="px-4 py-8 text-center">
              <div className="animate-spin w-6 h-6 border-2 border-accent border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Searching your content...</p>
            </div>
          )}

          {input && searchResults.length === 0 && !isSearching && <SearchHelp />}

          {renderSlashCommandHelp()}

          {!input && recentCommands.length > 0 && (
            <div className="py-2 border-b border-border">
              <div className="px-4 py-1 text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Recent
              </div>
              {recentCommands.map((command: CommandType, index: number) => (
                <CommandItem
                  key={command.id}
                  command={command}
                  isActive={activeIndex === index}
                  onSelect={() => executeCommand(command)}
                />
              ))}
            </div>
          )}

          {input ? (
            renderSearchResults()
          ) : (
            <>
              <div className="py-2">
                {commandGroups.map((group) => (
                  <div key={group.category} className="mb-4">
                    <div className="px-4 py-1 text-xs font-medium text-muted-foreground">
                      {group.title}
                    </div>
                    {group.commands.map((command: CommandType, index: number) => (
                      <CommandItem
                        key={command.id}
                        command={command}
                        isActive={activeIndex === index}
                        onSelect={() => executeCommand(command)}
                      />
                    ))}
                  </div>
                ))}
              </div>

              {!input && history.length > 0 && (
                <div className="py-2 border-t border-border">
                  <div className="px-4 py-1 text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <History className="w-3 h-3" />
                    History
                  </div>
                  {history.slice(0, 5).map((item: CommandHistory, index: number) => (
                    <CommandItem
                      key={`${item.command.id}-${item.timestamp}`}
                      command={item.command}
                      isActive={activeIndex === index + recentCommands.length}
                      onSelect={() => executeCommand(item.command, item.input)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground">
          Type <kbd className="px-1 py-0.5 bg-muted rounded">/</kbd> for commands •{' '}
          <kbd className="px-1 py-0.5 bg-muted rounded">↑↓</kbd> to navigate •{' '}
          <kbd className="px-1 py-0.5 bg-muted rounded">Enter</kbd> to select •{' '}
          <kbd className="px-1 py-0.5 bg-muted rounded">type:</kbd> to filter
        </div>
      </DialogContent>
    </Dialog>
  );
} 