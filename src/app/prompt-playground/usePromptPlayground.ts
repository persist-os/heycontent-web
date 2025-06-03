import { usePromptFilters } from './hooks/usePromptFilters';
import { usePromptData } from './hooks/usePromptData';
import { usePromptEditor } from './hooks/usePromptEditor';
import { usePromptTest } from './hooks/usePromptTest';
import { usePromptFeedback } from './hooks/usePromptFeedback';
import { usePersonas } from './hooks/usePersonas';

export * from './hooks/usePromptFilters';
export * from './hooks/usePromptData';
export * from './hooks/usePromptEditor';
export * from './hooks/usePromptTest';
export * from './hooks/usePromptFeedback';
export * from './hooks/usePersonas';

export interface Platform {
  id: string;
  name: string;
  goals: string[];
}

export interface Prompt {
  id: string;
  title: string;
  description: string;
  instructions: string;
  platform: string;
  goal: string;
  rating?: number;
  lastTested?: string;
  agentType?: string;
}

export interface TestResult {
  id: string;
  promptId: string;
  output: string;
  rating: number;
  feedback: string;
  timestamp: string;
}

export function usePromptPlayground() {
  // Filters
  const filters = usePromptFilters();
  // Editor
  const editor = usePromptEditor('');
  // Prompt Data
  const data = usePromptData(filters.selectedPlatform, filters.selectedGoal, editor.setInstructions);
  // Personas
  const { personas } = usePersonas();
  // Test
  const test = usePromptTest(data.selectedPrompt, editor.instructions, filters.selectedPersona);
  // Feedback
  // TODO: Replace with actual user name from auth context if available
  const userName = 'Anonymous';
  const feedback = usePromptFeedback(data.selectedPrompt, test.testOutput, userName);

  // Full reset: clears all fields
  const handleFullReset = () => {
    // Reset editor fields
    editor.setInstructions('');
    editor.setUserMessage('');
    // Reset filters
    filters.setSelectedPersona('');
    filters.setSelectedPlatform('');
    filters.setSelectedGoal('');
    filters.setSearchQuery('');
    // Reset feedback
    feedback.setCurrentRating(0);
    feedback.setFeedback('');
    feedback.setTestResults([]);
    // Reset test output and error
    test.setTestOutput('');
    test.setError(null);
    // Reset selected prompt fields if possible
    if (data.selectedPrompt) {
      data.setSelectedPrompt(prev => prev ? {
        ...prev,
        title: '',
        description: '',
        instructions: '',
        platform: '',
        goal: '',
      } : prev);
    }
  };

  return {
    ...filters,
    ...editor,
    ...data,
    personas,
    ...test,
    ...feedback,
    feedbackLoading: feedback.loading,
    feedbackError: feedback.error,
    feedbackSuccess: feedback.success,
    handleSaveFeedback: async () => await feedback.handleSaveFeedback(),
    handleFullReset,
    filteredPrompts: data.filteredPrompts,
    handleLoadPromptContent: data.handleLoadPromptContent,
  };
}