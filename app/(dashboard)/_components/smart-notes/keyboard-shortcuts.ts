import { KeyboardEvent } from 'react';

export interface ShortcutCommand {
  key: string;
  command: string;
  description: string;
  callback: () => void;
}

export interface CommandHandler {
  onSave?: () => void;
  onQuickCapture?: () => void;
  onCommandMenu?: () => void;
  onMention?: () => void;
  onTag?: () => void;
}

export class ShortcutManager {
  private shortcuts: Map<string, ShortcutCommand> = new Map();
  private commandMode: boolean = false;
  private currentInput: string = '';
  private handlers: CommandHandler;

  constructor(handlers: CommandHandler) {
    this.handlers = handlers;
  }

  registerShortcut(shortcut: ShortcutCommand) {
    this.shortcuts.set(shortcut.key, shortcut);
  }

  handleKeyDown(event: globalThis.KeyboardEvent) {
    // Save shortcut (⌘/Ctrl + S)
    if ((event.metaKey || event.ctrlKey) && event.key === 's') {
      event.preventDefault();
      this.handlers.onSave?.();
      return true;
    }

    // Quick capture shortcut (⌘/Ctrl + K)
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      this.handlers.onQuickCapture?.();
      return true;
    }

    // Command menu (/)
    if (event.key === '/' && !event.metaKey && !event.ctrlKey) {
      event.preventDefault();
      this.handlers.onCommandMenu?.();
      return true;
    }

    // Mentions (@)
    if (event.key === '@' && !event.metaKey && !event.ctrlKey) {
      event.preventDefault();
      this.handlers.onMention?.();
      return true;
    }

    // Tags (#)
    if (event.key === '#' && !event.metaKey && !event.ctrlKey) {
      event.preventDefault();
      this.handlers.onTag?.();
      return true;
    }

    return false;
  }
} 