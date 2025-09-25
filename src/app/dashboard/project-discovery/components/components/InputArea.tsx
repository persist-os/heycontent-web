/**
 * Input Area Component
 * 
 * React component for message input, send button, and input validation
 * in the project discovery system. Handles user input and provides
 * input validation and keyboard shortcuts.
 * 
 * Used by: Main container component, input management components
 */

import React, { useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Props interface for the InputArea component
 */
interface InputAreaProps {
  /** Input value */
  inputValue: string;
  /** Callback for input value changes */
  onInputChange: (value: string) => void;
  /** Callback for sending messages */
  onSend: (message: string) => void;
  /** Whether input is disabled */
  disabled?: boolean;
  /** Whether message is being sent */
  isLoading?: boolean;
  /** Maximum input length */
  maxLength?: number;
  /** Input placeholder text */
  placeholder?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * InputArea Component
 * 
 * Provides a focused input area with text field, send button,
 * input validation, and keyboard shortcuts for the project discovery system.
 * 
 * @param props - Component props
 * @returns JSX element with input area functionality
 */
export function InputArea({
  inputValue,
  onInputChange,
  onSend,
  disabled = false,
  isLoading = false,
  maxLength = 5000,
  placeholder = "Ask about your project...",
  className = ''
}: InputAreaProps): JSX.Element {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (inputValue.trim() && !isLoading && inputValue.length <= maxLength) {
      onSend(inputValue.trim());
      onInputChange('');
    }
  }, [inputValue, isLoading, maxLength, onSend, onInputChange]);

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Allow new line with Shift+Enter
        return;
      } else {
        // Send message with Enter
        e.preventDefault();
        if (!inputValue.trim() || isLoading || inputValue.length >= maxLength) return;
        
        onSend(inputValue.trim());
        onInputChange('');
      }
    }
  }, [inputValue, isLoading, maxLength, onSend, onInputChange]);

  /**
   * Auto-resize textarea
   */
  useEffect(() => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = Math.min(textarea.scrollHeight, 120);
      textarea.style.height = `${scrollHeight}px`;
    }
  }, [inputValue]);

  const characterCount = inputValue.length;
  const isNearLimit = characterCount > maxLength * 0.8;
  const isAtLimit = characterCount >= maxLength;

  return (
    <div className={cn("flex-shrink-0 border-t border-border bg-background", className)}>
      <div className="max-w-4xl sm:max-w-6xl mx-auto px-2 sm:px-3 pt-1 pb-2">
        <form onSubmit={handleSubmit} className="p-2 sm:p-3">
          <div className="flex gap-2 items-end w-full relative">
            <div className="flex-1 relative rounded-xl transition-all duration-200 focus-within:bg-background">
              {/* Text input area */}
              <div className="flex items-center rounded-t-xl bg-muted/50 pl-3 py-2 pr-3">
                <Textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => onInputChange(e.target.value)}
                  placeholder={placeholder}
                  className="text-base leading-relaxed flex-1 bg-transparent border-0 outline-0 resize-none placeholder:text-muted-foreground chat-font"
                  disabled={isLoading || disabled}
                  onKeyDown={handleKeyDown}
                  maxLength={maxLength}
                />
              </div>

              {/* Bottom section - Character count and Send button */}
              <div className="flex items-center justify-between rounded-b-xl px-3 py-2 h-10">
                <div className="flex items-center">
                  {/* Left side empty for future features */}
                </div>

                <div className="flex items-center gap-2">
                  {/* Character count */}
                  {!isLoading && (
                    <div className={cn(
                      "text-xs transition-colors duration-200",
                      isAtLimit ? 'text-destructive font-medium' : '',
                      isNearLimit && !isAtLimit ? 'text-warning font-medium' : 'text-muted-foreground'
                    )}>
                      {characterCount.toLocaleString()}/{maxLength.toLocaleString()}
                    </div>
                  )}

                  {/* Send button */}
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isLoading || !inputValue.trim() || isAtLimit || disabled}
                    className="w-7 h-7 rounded-lg p-0"
                  >
                    {isLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-1.5 text-xs text-muted-foreground text-center">
            Press Enter to send, Shift+Enter for new line
          </div>
        </form>
      </div>
    </div>
  );
}

export default InputArea;
