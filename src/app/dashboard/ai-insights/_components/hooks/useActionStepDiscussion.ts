import { useInsightNavigation } from './useInsightNavigation';

/**
 * Custom hook for handling action step discussions
 * Provides functionality to navigate to chat with proper context for action steps
 */
export const useActionStepDiscussion = () => {
  const { navigateWithActionStep } = useInsightNavigation();

  /**
   * Navigate to chat with the action step as context
   * @param actionStep The action step text to discuss
   * @param insightTitle The title of the insight that contains this action step
   * @param platform The platform the insight is related to (youtube, instagram, gmail)
   * @param additionalContext Optional additional context about the insight
   */
  const discussActionStep = (
    actionStep: string, 
    insightTitle: string,
    platform: 'youtube' | 'instagram' | 'gmail',
    additionalContext?: string
  ) => {
    navigateWithActionStep(actionStep, insightTitle, platform, additionalContext);
  };

  return { discussActionStep };
};
