import { useInsightNavigation } from './useInsightNavigation';
import { InsightData } from '@/components/content/InsightCard';

// Utility function for comprehensive logging
const logActionStepDiscussion = (operation: string, data: any, additionalInfo?: string) => {
  console.group(`🔍 [ACTION STEP DISCUSSION] ${operation}`);
  console.log('Action Step:', data.actionStep);
  console.log('Platform:', data.platform);
  console.log('Insight Data Structure:', {
    hasTitle: !!data.insight?.title,
    hasImpact: !!data.insight?.impact,
    whyNowCount: data.insight?.whyNow?.length || 0,
    actionStepsCount: data.insight?.actionSteps?.length || 0,
    hasExpectedOutcome: !!data.insight?.expectedOutcome,
    sourceDetailsCount: data.insight?.sourceDetails?.length || 0,
  });
  console.log('Full Insight Data:', data.insight);
  if (data.additionalContext) {
    console.log('Additional Context:', data.additionalContext);
  }
  if (additionalInfo) {
    console.log('Additional Info:', additionalInfo);
  }
  console.groupEnd();
};

// Utility function to validate insight data for action step discussion
const validateInsightForActionStep = (insight: InsightData, actionStep: string, platform: string): { isValid: boolean; missingFields: string[] } => {
  const requiredFields = ['title', 'impact', 'whyNow', 'actionSteps', 'expectedOutcome', 'sourceDetails'];
  const missingFields: string[] = [];
  
  requiredFields.forEach(field => {
    if (!insight[field] || (Array.isArray(insight[field]) && insight[field].length === 0)) {
      missingFields.push(field);
    }
  });
  
  // Validate that the action step exists in the actionSteps array
  if (!insight.actionSteps?.includes(actionStep)) {
    missingFields.push('actionStep (not found in actionSteps array)');
  }
  
  const isValid = missingFields.length === 0;
  
  if (!isValid) {
    console.warn(`⚠️ [ACTION STEP DISCUSSION] Missing required fields for ${platform}:`, missingFields);
  }
  
  return { isValid, missingFields };
};

export const useActionStepDiscussion = () => {
  const { navigateWithActionStep } = useInsightNavigation();

  /**
   * Navigate to chat with the action step as context
   * @param actionStep The action step text to discuss
   * @param insight The full insight object
   * @param platform The platform the insight is related to (youtube, instagram, gmail)
   * @param additionalContext Optional additional context about the insight
   */
  const discussActionStep = (
    actionStep: string, 
    insight: InsightData,
    platform: 'youtube' | 'instagram' | 'gmail',
    additionalContext?: string
  ) => {
    console.log('🔍 [ACTION STEP DISCUSSION] discussActionStep called');
    
    // Validate the insight data
    const validation = validateInsightForActionStep(insight, actionStep, platform);
    if (!validation.isValid) {
      console.error('❌ [ACTION STEP DISCUSSION] Cannot process action step - missing required fields:', validation.missingFields);
      return;
    }

    // Log the data being passed to navigation
    logActionStepDiscussion('Calling navigateWithActionStep', {
      actionStep,
      insight,
      platform,
      additionalContext
    }, 'All validation passed');

    // Call the navigation function with the full insight data
    navigateWithActionStep(actionStep, insight, platform, additionalContext);
  };

  return { discussActionStep };
};
