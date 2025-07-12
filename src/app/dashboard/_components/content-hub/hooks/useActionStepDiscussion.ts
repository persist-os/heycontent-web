import { useRouter } from 'next/navigation';
import { useContentContextActions } from '@/store/content-context-store';

/**
 * Custom hook for handling action step discussions in Content Hub
 * Provides functionality to navigate to chat with proper context for content hub action steps
 */
export const useContentHubActionStepDiscussion = () => {
  const router = useRouter();
  const { setAIInsightsContext } = useContentContextActions();

  /**
   * Navigate to chat with the content hub action step as context
   * @param actionStep The action step text to discuss
   * @param insightTitle The title of the insight that contains this action step
   * @param platform The platform the insight is related to (youtube, instagram, gmail)
   * @param additionalContext Optional additional context about the insight
   * @param contentType The type of content (hook, format, cta)
   */
  const discussActionStep = (
    actionStep: string, 
    insightTitle: string,
    platform: 'youtube' | 'instagram' | 'gmail',
    contentType: 'hook' | 'format' | 'cta',
    additionalContext?: string
  ) => {
    console.log('🔍 [CONTENT HUB ACTION STEP] Function called with:', { actionStep, insightTitle, platform, contentType, additionalContext });
    
    // Create a rich context object with detailed information following AI insights pattern
    const context = {
      platform: 'ai-insights' as const, // Use ai-insights platform for compatibility
      contentId: `content-hub-action-step-${Date.now()}`,
      title: `${platform.charAt(0).toUpperCase() + platform.slice(1)} ${contentType.charAt(0).toUpperCase() + contentType.slice(1)}`,
      source: 'content-hub',
      originalPlatform: platform, // Add originalPlatform for proper display
      fullInsight: {
        title: `${platform.charAt(0).toUpperCase() + platform.slice(1)} ${contentType.charAt(0).toUpperCase() + contentType.slice(1)}`,
        platform: platform,
        contentType: contentType,
        actionStep: actionStep,
        impact: `Optimizing ${contentType} for ${platform} content strategy`,
        whyNow: [`Analyzing ${contentType} performance for ${platform}`, `Cross-platform content optimization opportunity`],
        actionSteps: [actionStep],
        expectedOutcome: `Improved ${contentType} strategy for ${platform}`,
        sourceDetails: [`Content Hub ${contentType} for ${platform}`],
        relatedItems: []
      },
      content: `## ${platform.charAt(0).toUpperCase() + platform.slice(1)} ${contentType.charAt(0).toUpperCase() + contentType.slice(1)}

${actionStep}

**Platform:** ${platform.charAt(0).toUpperCase() + platform.slice(1)}
**Content Type:** ${contentType.charAt(0).toUpperCase() + contentType.slice(1)}
**Source:** Content Hub Insights

${additionalContext ? `\n**Additional Context:**\n${additionalContext}` : ''}`,
      insight: actionStep, // Also set as insight for backwards compatibility
      analysis: `**${insightTitle}**\n\n**Platform:** ${platform}\n**Content Type:** ${contentType}\n\n**Action Step:**\n${actionStep}\n\nThis ${contentType} was identified as part of your cross-platform content strategy. You can discuss optimization strategies, A/B testing ideas, or implementation approaches with AI assistance.`,
      timestamp: Date.now(),
      type: 'content-hub-action-step',
      contentType: contentType,
      additionalContext: additionalContext || ''
    };
    
    console.log('🔍 [CONTENT HUB ACTION STEP] Setting AI insights context:', context);
    setAIInsightsContext(context);
    
    // Small delay to ensure context is set before navigation
    setTimeout(() => {
      console.log('🔍 [CONTENT HUB ACTION STEP] Navigating to chat');
      router.push('/dashboard/chat');
    }, 100);
  };

  /**
   * Navigate to chat with the full content hub insight as context
   * @param content The full content to discuss
   * @param title The title of the insight
   * @param normalizedInsight The normalized fullInsight object (from ContentHubInsights)
   */
  const discussFullInsight = (content: string, title: string, normalizedInsight?: any) => {
    console.log('[useActionStepDiscussion] discussFullInsight called with:', { content, title, normalizedInsight });
    let fullInsight;
    if (normalizedInsight) {
      fullInsight = normalizedInsight;
      console.log('[useActionStepDiscussion] Using normalized fullInsight:', fullInsight);
    } else {
      fullInsight = {
        title: title,
        impact: 'Cross-platform content remix opportunity',
        whyNow: ['Cross-platform content optimization', 'Strategic content repurposing'],
        actionSteps: [content],
        expectedOutcome: 'Improved cross-platform content strategy',
        sourceDetails: ['Content Hub Insights'],
        relatedItems: []
      };
      console.log('[useActionStepDiscussion] Using fallback fullInsight:', fullInsight);
    }

    const context = {
      platform: 'ai-insights' as const,
      contentId: `content-hub-insight-${Date.now()}`,
      title: fullInsight.title,
      source: 'content-hub',
      originalPlatform: normalizedInsight?.platform || 'cross-platform',
      fullInsight, // <-- CRITICAL: always set fullInsight
      content: `## ${fullInsight.title}\n\n${content}\n\n**Source:** Content Hub Insights\n**Type:** Cross-Platform Remix Opportunity\n\nThis insight was generated by analyzing your content across multiple platforms to identify strategic opportunities for content remixing and cross-platform growth.`,
      insight: content,
      timestamp: Date.now(),
      type: 'content-hub-insight'
    };
    console.log('[useActionStepDiscussion] FINAL context object to set:', context);
    console.log('[useActionStepDiscussion] FINAL fullInsight in context:', context.fullInsight);
    setAIInsightsContext(context);
    setTimeout(() => {
      console.log('[useActionStepDiscussion] Navigating to chat with context:', context);
      router.push('/dashboard/chat');
    }, 100);
  };

  return { discussActionStep, discussFullInsight };
}; 