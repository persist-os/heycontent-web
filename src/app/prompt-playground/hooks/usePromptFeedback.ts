import { useState } from 'react';
import { TestResult, Prompt } from '../usePromptPlayground';

export function usePromptFeedback(selectedPrompt: Prompt | null, testOutput: string, userName: string = 'Anonymous') {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [currentRating, setCurrentRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Map numeric rating to Notion string
  const ratingToNotion = (num: number) => {
    switch (num) {
      case 1: return '⭐ 1 - Poor';
      case 2: return '⭐⭐ 2 - Below Average';
      case 3: return '⭐⭐⭐ 3 - Average';
      case 4: return '⭐⭐⭐⭐ 4 - Good';
      case 5: return '⭐⭐⭐⭐⭐ 5 - Excellent';
      default: return '';
    }
  };

  const handleSaveFeedback = async () => {
    setError(null);
    setSuccess(false);
    if (!selectedPrompt || currentRating === 0) {
      setError('Please select a prompt and rating.');
      return;
    }
    if (!feedback || feedback.trim().length === 0) {
      setError('Feedback is required.');
      return;
    }
    setLoading(true);
    try {
      // Use shared API utility
      const { submitPlaygroundFeedback } = await import('../utils/api');
      const result = await submitPlaygroundFeedback({
        name: userName || 'Anonymous',
        prompt_title: selectedPrompt.title,
        feedback,
        model_output: testOutput,
        rating: ratingToNotion(currentRating),
      });
      if (!result.ok) {
        setError(result.error || 'Failed to submit feedback.');
      } else {
        setSuccess(true);
        setTestResults(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            promptId: selectedPrompt.id,
            output: testOutput,
            rating: currentRating,
            feedback,
            timestamp: new Date().toISOString(),
          },
        ]);
        setCurrentRating(0);
        setFeedback('');
      }
    } catch (e) {
      setError('Failed to submit feedback.');
    } finally {
      setLoading(false);
    }
  };

  return {
    testResults,
    setTestResults,
    currentRating,
    setCurrentRating,
    feedback,
    setFeedback,
    handleSaveFeedback,
    loading,
    error,
    success,
  };
} 