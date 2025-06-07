import { AmbientInsight } from '../types';

export class AmbientInsightsActions {
  static handleInsightClick(action: string, insight: AmbientInsight, onSendMessage: (message: string) => void) {
    // Handle the insight click by sending the insight description as a message
    onSendMessage(insight.description);
  }

  static handleInsightHover(insight: AmbientInsight) {
    // Handle insight hover effects if needed
    console.log('Insight hovered:', insight.title);
  }

  static handleInsightFocus(insight: AmbientInsight) {
    // Handle insight focus for accessibility
    console.log('Insight focused:', insight.title);
  }
}

export const useAmbientInsightsActions = (onSendMessage: (message: string) => void) => {
  const handleClick = (action: string, insight: AmbientInsight) => {
    AmbientInsightsActions.handleInsightClick(action, insight, onSendMessage);
  };

  const handleHover = (insight: AmbientInsight) => {
    AmbientInsightsActions.handleInsightHover(insight);
  };

  const handleFocus = (insight: AmbientInsight) => {
    AmbientInsightsActions.handleInsightFocus(insight);
  };

  return {
    handleClick,
    handleHover,
    handleFocus
  };
}; 