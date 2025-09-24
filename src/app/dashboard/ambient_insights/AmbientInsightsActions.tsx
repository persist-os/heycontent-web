import { AmbientInsight } from '../chat/types';

export class AmbientInsightsActions {
  static handleClickAction(action: string, insight: AmbientInsight, onSendMessage: (message: string) => void) {
    // Send the action string (for bottom bar)
    onSendMessage(action);
  }

  static handleClickInsight(action: string, insight: AmbientInsight, onSendMessage: (message: string) => void) {
    // Send the insight description (for main screen)
    onSendMessage(insight.description);
  }

  static handleInsightHover(insight: AmbientInsight) {
    // Handle insight hover effects if needed
    // (no-op in production)
  }

  static handleInsightFocus(insight: AmbientInsight) {
    // Handle insight focus for accessibility
    // (no-op in production)
  }
}

export const useAmbientInsightsActions = (onSendMessage: (message: string) => void) => {
  const handleClickAction = (action: string, insight: AmbientInsight) => {
    AmbientInsightsActions.handleClickAction(action, insight, onSendMessage);
  };

  const handleClickInsight = (action: string, insight: AmbientInsight) => {
    AmbientInsightsActions.handleClickInsight(action, insight, onSendMessage);
  };

  const handleHover = (insight: AmbientInsight) => {
    AmbientInsightsActions.handleInsightHover(insight);
  };

  const handleFocus = (insight: AmbientInsight) => {
    AmbientInsightsActions.handleInsightFocus(insight);
  };

  return {
    handleClickAction,
    handleClickInsight,
    handleHover,
    handleFocus
  };
}; 