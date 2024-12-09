import { KeyboardEvent } from 'react';

export interface ShortcutCommand {
  key: string;
  command: string;
  description: string;
  callback: () => void;
}

export class ShortcutManager {
  private shortcuts: Map<string, ShortcutCommand> = new Map();
  private commandMode: boolean = false;
  private currentInput: string = '';

  registerShortcut(shortcut: ShortcutCommand) {
    this.shortcuts.set(shortcut.key, shortcut);
  }

  handleKeyDown(event: globalThis.KeyboardEvent) {
    // Command mode shortcuts
    if (event.key === '/' || event.key === '@' || event.key === '#') {
      event.preventDefault();
      this.commandMode = true;
      this.currentInput = event.key;
      return true;
    }

    // Handle command mode input
    if (this.commandMode) {
      if (event.key === 'Escape') {
        this.commandMode = false;
        this.currentInput = '';
        return true;
      }

      if (event.key === 'Enter') {
        this.executeCommand(this.currentInput);
        this.commandMode = false;
        this.currentInput = '';
        return true;
      }

      this.currentInput += event.key;
      return true;
    }

    // Global shortcuts
    if (event.metaKey || event.ctrlKey) {
      const shortcut = this.shortcuts.get(event.key);
      if (shortcut) {
        event.preventDefault();
        shortcut.callback();
        return true;
      }
    }

    return false;
  }

  private executeCommand(input: string) {
    const command = input.charAt(0);
    const value = input.slice(1).trim();

    switch (command) {
      case '/':
        this.handleSlashCommand(value);
        break;
      case '@':
        this.handleMentionCommand(value);
        break;
      case '#':
        this.handleTagCommand(value);
        break;
    }
  }

  private handleSlashCommand(value: string) {
    switch (value) {
      case 'capture':
        // Capture current AI conversation
        break;
      case 'reference':
        // Add reference to previous note
        break;
      case 'save':
        // Save current note
        break;
    }
  }

  private handleMentionCommand(value: string) {
    // Handle mentions (@) of notes, insights, or conversations
  }

  private handleTagCommand(value: string) {
    // Handle hashtag categorization
  }
} 