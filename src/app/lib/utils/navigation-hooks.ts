import { useRouter } from 'next/navigation';
import { useContentContextActions } from '@/store/content-context-store';
import {
  navigateToChatWithInsight as navigateToChatWithInsightUtil,
  navigateToChatWithActionStep as navigateToChatWithActionStepUtil,
  navigateToChatWithContentHubInsight as navigateToChatWithContentHubInsightUtil
} from './navigation-utils';

/**
 * Custom hook that provides navigation functions with hooks already connected
 * Use this in React components for easy access to navigation utilities
 */
export function useNavigationUtils() {
  const contextActions = useContentContextActions();
  const router = useRouter();

  const navigateToChatWithInsight = (
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
    return navigateToChatWithInsightUtil(insight, originalPlatform, contextActions, router, source);
  };

  const navigateToChatWithActionStep = (
    actionStep: string,
    insightTitle: string,
    platform: 'youtube' | 'instagram' | 'gmail',
    additionalContext?: string
  ) => {
    return navigateToChatWithActionStepUtil(actionStep, insightTitle, platform, contextActions, router, additionalContext);
  };

  const navigateToChatWithContentHubInsight = (
    content: string,
    title: string
  ) => {
    return navigateToChatWithContentHubInsightUtil(content, title, contextActions, router);
  };

  return {
    navigateToChatWithInsight,
    navigateToChatWithActionStep,
    navigateToChatWithContentHubInsight
  };
} 