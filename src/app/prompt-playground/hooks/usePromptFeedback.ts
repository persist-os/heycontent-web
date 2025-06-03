import { useState } from 'react';
import { TestResult, Prompt } from '../usePromptPlayground';

export function usePromptFeedback(selectedPrompt: Prompt | null, testOutput: string) {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [currentRating, setCurrentRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  const handleSaveFeedback = () => {
    if (!selectedPrompt || currentRating === 0) return;
    const newTestResult: TestResult = {
      id: Date.now().toString(),
      promptId: selectedPrompt.id,
      output: testOutput,
      rating: currentRating,
      feedback,
      timestamp: new Date().toISOString()
    };
    setTestResults(prev => [...prev, newTestResult]);
    setCurrentRating(0);
    setFeedback('');
  };

  return {
    testResults,
    setTestResults,
    currentRating,
    setCurrentRating,
    feedback,
    setFeedback,
    handleSaveFeedback,
  };
} 