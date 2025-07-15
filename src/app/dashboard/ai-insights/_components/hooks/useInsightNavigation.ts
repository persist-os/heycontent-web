import { useRouter } from 'next/navigation';
import { useContentContextActions } from '@/store/content-context-store';
import { cleanImpactString } from '@/app/lib/utils/impact-utils';
import { InsightData } from '@/components/content/InsightCard';

// Utility function for comprehensive logging
const logInsightNavigation = (operation: string, data: any, additionalInfo?: string) => {
  console.group(`🔍 [INSIGHT NAVIGATION] ${operation}`);
  console.log('Platform:', data.platform);
  console.log('Content ID:', data.contentId);
  console.log('Title:', data.title);
  console.log('Has Action Step:', !!data.actionStep);
  console.log('Has Full Insight:', !!data.fullInsight);
  if (data.fullInsight) {
    console.log('Full Insight Structure:', {
      hasTitle: !!data.fullInsight.title,
      hasImpact: !!data.fullInsight.impact,
      whyNowCount: data.fullInsight.whyNow?.length || 0,
      actionStepsCount: data.fullInsight.actionSteps?.length || 0,
      hasExpectedOutcome: !!data.fullInsight.expectedOutcome,
      sourceDetailsCount: data.fullInsight.sourceDetails?.length || 0,
    });
  }
  console.log('Full Context Data:', data);
  if (additionalInfo) {
    console.log('Additional Info:', additionalInfo);
  }
  console.groupEnd();
};

// Utility function to validate insight data for navigation
const validateInsightForNavigation = (insight: InsightData, platform: string): { isValid: boolean; missingFields: string[] } => {
  const requiredFields = ['title', 'impact', 'whyNow', 'actionSteps', 'expectedOutcome', 'sourceDetails'];
  const missingFields: string[] = [];
  
  requiredFields.forEach(field => {
    if (!insight[field] || (Array.isArray(insight[field]) && insight[field].length === 0)) {
      missingFields.push(field);
    }
  });
  
  const isValid = missingFields.length === 0;
  
  if (!isValid) {
    console.warn(`⚠️ [INSIGHT NAVIGATION] Missing required fields for ${platform}:`, missingFields);
  }
  
  return { isValid, missingFields };
};

export const useInsightNavigation = () => {
  const router = useRouter();
  const { setAIInsightsContext } = useContentContextActions();

  /**
   * Navigate to chat with insight context
   */
  const navigateWithInsight = (insight: InsightData, platform: 'youtube' | 'instagram' | 'gmail') => {
    console.log('🔍 [INSIGHT NAVIGATION] navigateWithInsight called');
    
    // Validate the insight data
    const validation = validateInsightForNavigation(insight, platform);
    if (!validation.isValid) {
      console.error('❌ [INSIGHT NAVIGATION] Cannot navigate with insight - missing required fields:', validation.missingFields);
      return;
    }

    const cleanImpact = cleanImpactString(insight.impact);
    
    const context = {
      platform: 'ai-insights' as const,
      contentId: `insight-${Date.now()}`,
      title: insight.title,
      source: 'AI Insights Dashboard',
      originalPlatform: platform,
      analysis: cleanImpact,
      content: insight,
      convexData: insight,
      // Include all insight fields for backend access
      fullInsight: {
        title: insight.title,
        impact: cleanImpact,
        whyNow: insight.whyNow || [],
        actionSteps: insight.actionSteps || [],
        expectedOutcome: insight.expectedOutcome || '',
        sourceDetails: insight.sourceDetails || [],
        relatedItems: insight.relatedItems || [],
        threadDetails: insight.threadDetails || []
      }
    };

    logInsightNavigation('Setting AI Insights Context', context, 'Full insight navigation');
    setAIInsightsContext(context);
    router.push('/dashboard/chat');
  };

  /**
   * Navigate to chat with action step context
   */
  const navigateWithActionStep = (
    actionStep: string,
    insight: InsightData,
    platform: 'youtube' | 'instagram' | 'gmail',
    additionalContext?: string
  ) => {
    console.log('🔍 [INSIGHT NAVIGATION] navigateWithActionStep called');
    
    // Validate the insight data
    const validation = validateInsightForNavigation(insight, platform);
    if (!validation.isValid) {
      console.error('❌ [INSIGHT NAVIGATION] Cannot navigate with action step - missing required fields:', validation.missingFields);
      return;
    }

    const cleanImpact = cleanImpactString(insight.impact);
    
    // Create comprehensive fullInsight object with all required fields
    const fullInsight = {
      title: insight.title,
      impact: cleanImpact,
      whyNow: insight.whyNow || [],
      actionSteps: insight.actionSteps || [],
      expectedOutcome: insight.expectedOutcome || '',
      sourceDetails: insight.sourceDetails || [],
      relatedItems: insight.relatedItems || [],
      threadDetails: insight.threadDetails || []
    };

    const context = {
      platform: 'ai-insights' as const,
      contentId: `action-step-${Date.now()}`,
      title: insight.title,
      actionStep: actionStep,
      source: 'AI Insights Dashboard',
      originalPlatform: platform,
      additionalContext: additionalContext || '',
      analysis: actionStep,
      content: insight,
      convexData: insight,
      // Pass the complete fullInsight object
      fullInsight: fullInsight
    };

    logInsightNavigation('Setting AI Insights Context with Action Step', context, 
      `Action step: "${actionStep}" | Platform: ${platform}`);
    
    setAIInsightsContext(context);
    router.push('/dashboard/chat');
  };

  return { navigateWithInsight, navigateWithActionStep };
}; 