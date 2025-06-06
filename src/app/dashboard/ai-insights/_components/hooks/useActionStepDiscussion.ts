import { useRouter } from 'next/navigation';

/**
 * Custom hook for handling action step discussions
 * Provides functionality to navigate to chat with proper context for action steps
 */
export const useActionStepDiscussion = () => {
  const router = useRouter();

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
    // Create a rich context object with detailed information
    const context = {
      platform: 'ai-insights',
      contentId: `action-step-${Date.now()}`,
      title: insightTitle,
      actionStep: actionStep,
      source: 'AI Insights Dashboard',
      originalPlatform: platform,
      additionalContext: additionalContext || '',
      // Include a pre-formatted message to send
      messageToSend: actionStep
    };
    
    // Encode and navigate to chat
    const encodedContext = encodeURIComponent(JSON.stringify(context));
    router.push(`/dashboard/chat?contentContext=${encodedContext}&autoSend=true`);
  };

  return { discussActionStep };
};
