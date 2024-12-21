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
}

export class ShortcutManager {
  private shortcuts: Map<string, ShortcutCommand> = new Map();
  private commandMode: boolean = false;
  private currentInput: string = '';
  private handlers: CommandHandler;

  constructor(handlers: CommandHandler) {
    this.handlers = handlers;
  }

  handleKeyDown(event: globalThis.KeyboardEvent) {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const cmdKey = isMac ? event.metaKey : event.ctrlKey;

    // Save shortcut (⌘/Ctrl + S)
    if (cmdKey && event.key === 's') {
      event.preventDefault();
      this.handlers.onSave?.();
      return true;
    }

    // Quick capture shortcut (⌘/Ctrl + K)
    if (cmdKey && event.key === 'k') {
      event.preventDefault();
      this.handlers.onQuickCapture?.();
      return true;
    }

    // Command menu (/)
    if (event.key === '/' && !cmdKey) {
      event.preventDefault();
      this.handlers.onCommandMenu?.();
      return true;
    }

    // Mentions (@)
    if (event.key === '@' && !cmdKey) {
      event.preventDefault();
      this.handlers.onMention?.();
      return true;
    }

    // Tags (#)
    if (event.key === '#' && !cmdKey) {
      event.preventDefault();
      this.handlers.onTag?.();
      return true;
    }

    // Bold (⌘/Ctrl + B)
    if (cmdKey && event.key === 'b') {
      event.preventDefault();
      this.handlers.onBold?.();
      return true;
    }

    // Italic (⌘/Ctrl + I)
    if (cmdKey && event.key === 'i') {
      event.preventDefault();
      this.handlers.onItalic?.();
      return true;
    }

    // Underline (⌘/Ctrl + U)
    if (cmdKey && event.key === 'u') {
      event.preventDefault();
      this.handlers.onUnderline?.();
      return true;
    }

    // Indent (Tab)
    if (event.key === 'Tab' && !event.shiftKey) {
      event.preventDefault();
      this.handlers.onIndent?.();
      return true;
    }

    // Unindent (Shift + Tab)
    if (event.key === 'Tab' && event.shiftKey) {
      event.preventDefault();
      this.handlers.onUnindent?.();
      return true;
    }

    // Toggle shortcuts help (⌘/Ctrl + /)
    if (cmdKey && event.key === '/') {
      event.preventDefault();
      this.handlers.onToggleShortcuts?.();
      return true;
    }

    // Escape to cancel current command
    if (event.key === 'Escape') {
      this.commandMode = false;
      this.currentInput = '';
      return true;
    }

    return false;
  }
} 