import { useState } from 'react';

export function usePromptEditor(initialInstructions: string) {
  const [instructions, setInstructions] = useState(initialInstructions);
  const [userMessage, setUserMessage] = useState('');

  const handleResetEditor = (resetValue: string) => {
    setInstructions(resetValue);
    setUserMessage('');
  };

  return {
    instructions,
    setInstructions,
    userMessage,
    setUserMessage,
    handleResetEditor,
  };
} 