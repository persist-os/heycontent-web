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
  onBold?: () => void;
  onItalic?: () => void;
  onUnderline?: () => void;
  onIndent?: () => void;
  onUnindent?: () => void;
  onToggleShortcuts?: () => void;
  onEscape?: () => void;
}

export class ShortcutManager {
  private shortcuts: Map<string, ShortcutCommand> = new Map();
  private commandMode: boolean = false;
  private currentInput: string = '';
  private handlers: CommandHandler;
  private isMac: boolean;

  constructor(handlers: CommandHandler) {
    this.handlers = handlers;
    this.isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  }

  handleKeyDown(event: globalThis.KeyboardEvent): boolean {
    const cmdKey = this.isMac ? event.metaKey : event.ctrlKey;

    // Handle escape first
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.handlers.onEscape?.();
      this.commandMode = false;
      this.currentInput = '';
      return true;
    }

    // Handle command mode
    if (this.commandMode) {
      if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        this.commandMode = false;
        return true;
      }
      this.currentInput += event.key;
      return false;
    }

    // Handle shortcuts with command/ctrl key
    if (cmdKey) {
      switch (event.key.toLowerCase()) {
        case 's': // Save
          event.preventDefault();
          event.stopPropagation();
          this.handlers.onSave?.();
          return true;

        case 'k': // Quick capture
          event.preventDefault();
          event.stopPropagation();
          this.handlers.onQuickCapture?.();
          return true;

        case 'b': // Bold
          event.preventDefault();
          event.stopPropagation();
          this.handlers.onBold?.();
          return true;

        case 'i': // Italic
          event.preventDefault();
          event.stopPropagation();
          this.handlers.onItalic?.();
          return true;

        case 'u': // Underline
          event.preventDefault();
          event.stopPropagation();
          this.handlers.onUnderline?.();
          return true;

        case '/': // Toggle shortcuts help
          event.preventDefault();
          event.stopPropagation();
          this.handlers.onToggleShortcuts?.();
          return true;
      }
    }

    // Handle special characters without modifier keys
    if (!cmdKey && !event.altKey && !event.shiftKey) {
      switch (event.key) {
        case '/': // Command menu
          // Let NoteArea handle this to check if we're at start of line
          this.handlers.onCommandMenu?.();
          return false;

        case '@': // Mentions
          this.handlers.onMention?.();
          return false;

        case '#': // Tags
          this.handlers.onTag?.();
          return false;
      }
    }

    // Handle indentation
    if (event.key === 'Tab') {
      event.preventDefault();
      event.stopPropagation();
      if (event.shiftKey) {
        this.handlers.onUnindent?.();
      } else {
        this.handlers.onIndent?.();
      }
      return true;
    }

    return false;
  }

  isCommandMode(): boolean {
    return this.commandMode;
  }

  getCurrentInput(): string {
    return this.currentInput;
  }

  clearCommandMode(): void {
    this.commandMode = false;
    this.currentInput = '';
  }
} 