import { useState } from 'react';
import { sendPlaygroundMessage } from '../utils/api';
import { Prompt } from '../usePromptPlayground';

export function usePromptTest(selectedPrompt: Prompt | null, instructions: string, selectedPersona: string) {
  const [testOutput, setTestOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTestPrompt = async () => {
    if (!selectedPrompt) return;
    setIsLoading(true);
    setError(null);
    setTestOutput('');
    try {
      const { output, error } = await sendPlaygroundMessage({
        description: selectedPrompt.description,
        instructions: instructions,
        message: `Test this prompt for ${selectedPrompt.platform} as persona: ${selectedPersona || 'None'}`
      });
      if (error) {
        setError(error);
        setTestOutput('');
      } else {
        setTestOutput(output || '');
      }
    } catch (err: any) {
      setError(err.message || 'Unknown error');
      setTestOutput('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestPromptFromLibrary = async (prompt: Prompt) => {
    if (!selectedPrompt || selectedPrompt.id !== prompt.id) {
      // handlePromptSelect(prompt); // Should be handled outside
      return;
    }
    setIsLoading(true);
    setError(null);
    setTestOutput('');
    try {
      const { output, error } = await sendPlaygroundMessage({
        description: prompt.description,
        instructions: prompt.instructions,
        message: `Test this prompt for ${prompt.platform} as persona: ${selectedPersona || 'None'}`
      });
      if (error) {
        setError(error);
        setTestOutput('');
      } else {
        setTestOutput(output || '');
      }
    } catch (err: any) {
      setError(err.message || 'Unknown error');
      setTestOutput('');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    testOutput,
    setTestOutput,
    isLoading,
    setIsLoading,
    error,
    setError,
    handleTestPrompt,
    handleTestPromptFromLibrary,
  };
} 