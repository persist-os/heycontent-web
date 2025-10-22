import { ChevronRight } from 'lucide-react';
import { NavigationCommand } from '@/app/types/command';
import { CommandItemProps } from './types';
import { T } from '@/components/translation';

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

export function CommandItem({ command, isActive, onSelect, searchQuery }: CommandItemProps) {
  const Icon = command.icon;
  const isNavigation = command.type === 'navigation';
  const navigationCommand = isNavigation ? command as NavigationCommand : null;
  
  return (
    <button
      className={`w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-accent/10 transition-colors ${
        isActive ? 'bg-accent/10' : ''
      }`}
      onClick={onSelect}
    >
      {Icon && (
        <Icon 
          className={`w-5 h-5 ${
            navigationCommand?.color || 'text-muted-foreground'
          }`} 
        />
      )}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-base font-medium">
            {searchQuery ? highlight(command.label, searchQuery) : (
              <T context={`command_palette.command.${command.id}.label`}>{command.label}</T>
            )}
          </span>
          {command.shortcut && (
            <span className="text-xs text-muted-foreground">
              {command.shortcut.map((key: string, i: number) => (
                <span key={i}>
                  {i > 0 && ' + '}
                  <kbd className="px-1 py-0.5 bg-muted rounded">{key}</kbd>
                </span>
              ))}
            </span>
          )}
        </div>
        {command.description && (
          <p className="text-sm text-muted-foreground">
            {searchQuery ? highlight(command.description, searchQuery) : (
              <T context={`command_palette.command.${command.id}.description`}>{command.description}</T>
            )}
          </p>
        )}
      </div>
      {command.type === 'navigation' && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
    </button>
  );
} 