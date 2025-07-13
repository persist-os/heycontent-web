import { useRouter } from 'next/navigation';
import { useContentContextActions } from '@/store/content-context-store';
import { cleanImpactString } from '@/app/lib/utils/impact-utils';

/**
 * Custom hook for handling insight navigation to chat
 */
export const useInsightNavigation = () => {
  const router = useRouter();
  const { setAIInsightsContext } = useContentContextActions();

  /**
   * Navigate to chat with full insight context
   */
  const navigateWithInsight = (
    insight: {
      title: string;
      impact: string;
      whyNow: string[];
      actionSteps: string[];
      expectedOutcome: string;
      sourceDetails: string[];
      relatedItems?: Array<{ label: string; value: string }>;
    },
    originalPlatform: 'youtube' | 'instagram' | 'gmail',
    source: string = 'AI Insights Dashboard'
  ) => {
    const cleanImpact = cleanImpactString(insight.impact);
    
    const context = {
      platform: 'ai-insights',
      contentId: `insight-${Date.now()}`,
      title: insight.title,
      source: source,
      originalPlatform: originalPlatform,
      fullInsight: {
        title: insight.title,
        impact: cleanImpact,
        whyNow: insight.whyNow,
        actionSteps: insight.actionSteps,
        expectedOutcome: insight.expectedOutcome,
        sourceDetails: insight.sourceDetails,
        relatedItems: insight.relatedItems
      },
      analysis: `**Platform:** ${originalPlatform.toUpperCase()}
**Impact:** ${cleanImpact}

### Why Now?
${insight.whyNow.map(reason => `• ${reason}`).join('\n')}

### Action Steps
${insight.actionSteps.map((step, idx) => `${idx + 1}. ${step}`).join('\n')}

### Expected Outcome
${insight.expectedOutcome}

### Source Details
${insight.sourceDetails.join('\n')}

${insight.relatedItems && insight.relatedItems.length > 0 ? `### Related Items\n${insight.relatedItems.map(item => `• ${item.label}: ${item.value}`).join('\n')}` : ''}`
    };
    
    setAIInsightsContext(context);
    router.push('/dashboard/chat');
  };

  /**
   * Navigate to chat with action step context
   */
  const navigateWithActionStep = (
    actionStep: string,
    insightTitle: string,
    platform: 'youtube' | 'instagram' | 'gmail',
    additionalContext?: string
  ) => {
    const context = {
      platform: 'ai-insights',
      contentId: `action-step-${Date.now()}`,
      title: insightTitle,
      actionStep: actionStep,
      source: 'AI Insights Dashboard',
      originalPlatform: platform,
      additionalContext: additionalContext || '',
      analysis: actionStep
    };
    
    setAIInsightsContext(context);
    router.push('/dashboard/chat');
  };

  return {
    navigateWithInsight,
    navigateWithActionStep
  };
}; 