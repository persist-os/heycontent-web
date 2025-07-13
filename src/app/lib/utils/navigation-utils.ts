import { useRouter } from 'next/navigation';
import { useContentContextActions } from '@/store/content-context-store';

/**
 * Navigate to chat with AI insights context using Zustand store
 */
export function navigateToChatWithInsight(
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
) {
  const { setAIInsightsContext } = useContentContextActions();
  const router = useRouter();
  
  const cleanImpact = insight.impact.replace(/^Impact:\s*/i, '');
  
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
}

/**
 * Navigate to chat with action step context using Zustand store
 */
export function navigateToChatWithActionStep(
  actionStep: string,
  insightTitle: string,
  platform: 'youtube' | 'instagram' | 'gmail',
  additionalContext?: string
) {
  const { setAIInsightsContext } = useContentContextActions();
  const router = useRouter();
  
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
}

/**
 * Navigate to chat with content hub insight context using Zustand store
 */
export function navigateToChatWithContentHubInsight(
  content: string,
  title: string
) {
  const { setAIInsightsContext } = useContentContextActions();
  const router = useRouter();
  
  const context = {
    title: title,
    content: content,
    insight: content,
    source: 'Content Hub Insights',
    timestamp: Date.now(),
    type: 'content-hub-insight'
  };
  
  setAIInsightsContext(context);
  router.push('/dashboard/chat');
} 