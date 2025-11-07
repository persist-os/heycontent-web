import React from 'react';

interface WidgetPromptsProps {
  widgetOutputId: string;
  userId: string;
  onPromptClick?: (promptText: string) => void;
}

// Layout wrapper removed - component returns null

/**
 * WidgetPrompts Component
 * 
 * NOTE: This component was designed for widget outputs which had prompts and openingMessage.
 * Artifacts don't have these fields, so this component is deprecated.
 * If prompts are needed, they should come from the widget or conversation context instead.
 */
export const WidgetPrompts: React.FC<WidgetPromptsProps> = ({ 
  widgetOutputId,
  userId,
  onPromptClick
}) => {
  // NOTE: Artifacts don't have prompts or openingMessage fields
  // This component is deprecated - prompts should come from widget/conversation context
  // Return null to hide this component
  return null;
};
