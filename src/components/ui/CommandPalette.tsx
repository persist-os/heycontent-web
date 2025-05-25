'use client';

import { useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import {
  Search,
  Send,
  ChevronRight,
  Clock,
  History,
} from 'lucide-react';
import { useCommandPaletteState } from '../../app/hooks/useCommandPalette';
import { commandGroups, parseSearchQuery, SearchFilter, createQuickAskCommand } from '../../app/lib/commands';
import { Command as CommandType, NavigationCommand } from '../../app/types/command';
import { SearchResult } from '../../app/lib/commands';
import { format } from 'date-fns';

interface CommandHistory {
  timestamp: number;
  command: CommandType;
  input?: string;
}

function highlight(text: string, query: string) {
  if (!query) return text;
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <span key={i} className="bg-yellow-200 rounded px-1">{part}</span>
    ) : (
      part
    )
  );
}

interface CommandItemProps {
  command: CommandType;
  isActive?: boolean;
  onSelect: () => void;
  searchQuery?: string;
}

function CommandItem({ command, isActive, onSelect, searchQuery }: CommandItemProps) {
  const Icon = command.icon;
  const isNavigation = command.type === 'navigation';
  const navigationCommand = isNavigation ? command as NavigationCommand : null;
  
  return (
    <button
      className={`w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
        isActive ? 'bg-gray-50' : ''
      }`}
      onClick={onSelect}
    >
      {Icon && (
        <Icon 
          className={`w-5 h-5 ${
            navigationCommand?.color || 'text-gray-500'
          }`} 
        />
      )}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-base font-medium">
            {searchQuery ? highlight(command.label, searchQuery) : command.label}
          </span>
          {command.shortcut && (
            <span className="text-xs text-gray-500">
              {command.shortcut.map((key: string, i: number) => (
                <span key={i}>
                  {i > 0 && ' + '}
                  <kbd className="px-1 py-0.5 bg-gray-100 rounded">{key}</kbd>
                </span>
              ))}
            </span>
          )}
        </div>
        {command.description && (
          <p className="text-sm text-gray-500">
            {searchQuery ? highlight(command.description, searchQuery) : command.description}
          </p>
        )}
      </div>
      {command.type === 'navigation' && <ChevronRight className="w-4 h-4 text-gray-400" />}
    </button>
  );
}

function SearchResultItem({ result, isActive, onSelect, searchQuery }: { 
  result: SearchResult; 
  isActive?: boolean; 
  onSelect: () => void;
  searchQuery?: string;
}) {
  const Icon = result.icon;
  
  const renderPreview = () => {
    switch (result.type) {
      case 'conversation':
        return (
          <div className="text-sm text-gray-500">
            {searchQuery ? highlight(result.lastMessage, searchQuery) : result.lastMessage}
            <div className="text-xs text-gray-400 mt-1">
              with {result.participants.join(', ')}
            </div>
          </div>
        );
      case 'conversation_history':
        return (
          <div className="text-sm text-gray-500">
            {searchQuery ? highlight(result.preview, searchQuery) : result.preview}
            <div className="text-xs text-gray-400 mt-1">
              with {result.participants.join(', ')}
              <span className="ml-2">
                • {format(new Date(result.timestamp), 'MMM d, h:mm a')}
              </span>
            </div>
          </div>
        );
      case 'note':
        return (
          <div className="text-sm text-gray-500">
            {searchQuery ? highlight(result.preview, searchQuery) : result.preview}
            <div className="flex gap-2 mt-1">
              {result.tags.map(tag => (
                <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        );
      case 'analytics':
        return (
          <div className="text-sm text-gray-500">
            <span className="font-medium">{result.metric}:</span> {result.value}
            <span className={`ml-2 ${
              result.trend === 'up' ? 'text-green-500' : 
              result.trend === 'down' ? 'text-red-500' : 
              'text-gray-500'
            }`}>
              {result.trend === 'up' ? '↑' : result.trend === 'down' ? '↓' : '→'}
            </span>
          </div>
        );
      case 'insight':
        return (
          <div className="text-sm text-gray-500">
            {searchQuery ? highlight(result.summary, searchQuery) : result.summary}
            <div className="text-xs text-gray-400 mt-1">{result.category}</div>
          </div>
        );
      case 'audience':
        return (
          <div className="text-sm text-gray-500">
            <div>{result.segment}</div>
            <div className="flex gap-4 text-xs text-gray-400 mt-1">
              {result.metrics.map(metric => (
                <span key={metric.label}>
                  {metric.label}: <span className="text-gray-600">{metric.value}</span>
                </span>
              ))}
            </div>
          </div>
        );
      case 'partnership':
        return (
          <div className="text-sm text-gray-500">
            <div>{result.company} - {result.details}</div>
            <div className="text-xs mt-1">
              <span className={`
                px-2 py-0.5 rounded-full
                ${result.status === 'active' ? 'bg-green-100 text-green-700' :
                  result.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'}
              `}>
                {result.status}
              </span>
            </div>
          </div>
        );
    }
  };

  return (
    <button
      className={`w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
        isActive ? 'bg-gray-50' : ''
      }`}
      onClick={onSelect}
    >
      <div className="pt-1">
        <Icon className={`w-5 h-5 ${result.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-base font-medium">
            {searchQuery ? highlight(result.title, searchQuery) : result.title}
          </span>
          <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
            {format(new Date(
              result.type === 'conversation_history' ? result.timestamp : result.updatedAt
            ), 'MMM d')}
          </span>
        </div>
        {renderPreview()}
      </div>
    </button>
  );
}

function SearchHelp() {
  return (
    <div className="px-4 py-2 text-sm text-gray-500">
      <div className="mb-2">Search filters:</div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">type:note</code>
          <span className="ml-2">Filter by content type</span>
        </div>
        <div>
          <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">date:2024-01-01..2024-12-31</code>
          <span className="ml-2">Filter by date range</span>
        </div>
        <div>
          <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">tag:social</code>
          <span className="ml-2">Filter by tags</span>
        </div>
        <div>
          <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">status:active</code>
          <span className="ml-2">Filter by status</span>
        </div>
      </div>
    </div>
  );
}

function ActiveFilters({ filters }: { filters: SearchFilter }) {
  if (!filters.type && !filters.dateRange && !filters.tags?.length && !filters.status) {
    return null;
  }

  return (
    <div className="px-4 py-2 flex flex-wrap gap-2">
      {filters.type && (
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
          Type: {filters.type}
        </span>
      )}
      {filters.dateRange && (
        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
          Date: {format(filters.dateRange.start, 'MMM d')} - {format(filters.dateRange.end, 'MMM d')}
        </span>
      )}
      {filters.tags?.map(tag => (
        <span key={tag} className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
          Tag: {tag}
        </span>
      ))}
      {filters.status && (
        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
          Status: {filters.status}
        </span>
      )}
    </div>
  );
}

export function CommandPalette() {
  const {
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
  } = useCommandPaletteState();

  const inputRef = useRef<HTMLInputElement>(null);
  const isSlashCommand = input.startsWith('/');
  const router = useRouter();

  // Focus input when opened
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
      <div className="border-t border-gray-100">
        <div className="px-4 py-2 text-xs font-medium text-gray-500">
          Available Commands
        </div>
        {availableCommands.map((cmd, index) => (
          <button
            key={cmd.id}
            className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors ${
              activeIndex === index ? 'bg-gray-50' : ''
            }`}
            onClick={() => {
              setInput(`/${cmd.slashCommand} `);
              inputRef.current?.focus();
            }}
          >
            <div className="flex items-center gap-2">
              <code className="px-1 py-0.5 bg-gray-100 rounded text-sm">
                /{cmd.slashCommand}
              </code>
              <span className="text-gray-500">{cmd.description}</span>
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
        {/* Always show Ask Content option at the top */}
        <div className="mb-4">
          <div className="px-4 py-1 text-xs font-medium text-gray-500">
            Ask Content
          </div>
          <button
            className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
            onClick={() => {
              const quickAskCommand = createQuickAskCommand(input);
              executeCommand(quickAskCommand, input);
            }}
          >
            <Send className="w-5 h-5 text-purple-500" />
            <div className="flex-1">
              <div className="text-base font-medium text-purple-700">
                Ask Content "{input}"
              </div>
              <p className="text-sm text-gray-500">
                Start a conversation about your content
              </p>
            </div>
          </button>
        </div>

        {commands.length > 0 && (
          <div className="mb-4">
            <div className="px-4 py-1 text-xs font-medium text-gray-500">
              Commands
            </div>
            {commands.map((command, index) => (
              <CommandItem
                key={command.id}
                command={command}
                isActive={activeIndex === index + 1} // +1 because of the Ask Content option
                onSelect={() => executeCommand(command, input)}
                searchQuery={input}
              />
            ))}
          </div>
        )}
        
        {contentResults.length > 0 && (
          <div>
            <div className="px-4 py-1 text-xs font-medium text-gray-500">
              Content
            </div>
            {contentResults.map((result, index) => (
              <SearchResultItem
                key={result.id}
                result={result}
                isActive={activeIndex === index + commands.length + 1} // +1 for Ask Content option
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
      <DialogContent className="max-w-5xl min-h-[700px] max-h-[90vh] w-full p-0 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden">
        <div className="flex items-center px-4 pt-4 pb-2 border-b border-gray-100">
          <Search className="w-5 h-5 text-gray-400 mr-2" />
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
          <div className="text-sm text-gray-500">
            <kbd className="px-1 py-0.5 bg-gray-100 rounded">⌘</kbd>
            <span className="mx-1">+</span>
            <kbd className="px-1 py-0.5 bg-gray-100 rounded">K</kbd>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Show active filters */}
          <ActiveFilters filters={filters} />

          {/* Show search help when no results */}
          {input && searchResults.length === 0 && <SearchHelp />}

          {/* Slash Command Help */}
          {renderSlashCommandHelp()}

          {/* Recent Commands */}
          {!input && recentCommands.length > 0 && (
            <div className="py-2 border-b border-gray-100">
              <div className="px-4 py-1 text-xs font-medium text-gray-500 flex items-center gap-1">
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

          {/* Search Results or Default View */}
          {input ? (
            renderSearchResults()
          ) : (
            <>
              {/* Default View - All Commands */}
              <div className="py-2">
                {commandGroups.map((group) => (
                  <div key={group.category} className="mb-4">
                    <div className="px-4 py-1 text-xs font-medium text-gray-500">
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

              {/* Command History */}
              {!input && history.length > 0 && (
                <div className="py-2 border-t border-gray-100">
                  <div className="px-4 py-1 text-xs font-medium text-gray-500 flex items-center gap-1">
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

        {/* Footer */}
        <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-500">
          Type <kbd className="px-1 py-0.5 bg-gray-100 rounded">/</kbd> for commands •{' '}
          <kbd className="px-1 py-0.5 bg-gray-100 rounded">↑↓</kbd> to navigate •{' '}
          <kbd className="px-1 py-0.5 bg-gray-100 rounded">Enter</kbd> to select •{' '}
          <kbd className="px-1 py-0.5 bg-gray-100 rounded">type:</kbd> to filter
        </div>
      </DialogContent>
    </Dialog>
  );
} 