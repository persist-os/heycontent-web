import { Message } from '@/app/types/chat';

export interface InteractiveOption {
  text: string;
  type: 'suggestion' | 'detail' | 'action' | 'explore';
  action?: string;
}

export interface EnhancedResponse {
  content: string;
  options?: InteractiveOption[];
  followUp?: {
    question: string;
    choices?: string[];
  };
  contextualSuggestions?: string[];
}

export class InteractiveResponseHandler {
  static generateInteractiveResponse(
    content: string,
    context: any
  ): EnhancedResponse {
    const baseResponse: EnhancedResponse = {
      content
    };

    // Add relevant follow-up options based on content and context
    baseResponse.options = this.generateContextualOptions(content, context);
    
    // Add follow-up question if appropriate
    const followUp = this.generateFollowUp(content, context);
    if (followUp) {
      baseResponse.followUp = followUp;
    }

    // Add contextual suggestions
    baseResponse.contextualSuggestions = this.generateSuggestions(content, context);

    return baseResponse;
  }

  private static generateContextualOptions(content: string, context: any): InteractiveOption[] {
    const options: InteractiveOption[] = [];

    // Add detail options based on content and context
    if (content.includes('metrics') || content.includes('analytics')) {
      options.push({
        text: "Show detailed metrics",
        type: "detail",
        action: "show_metrics"
      });
    }

    // Add platform-specific options based on available features
    if (context.availableFeatures?.includes('partnerships')) {
      options.push({
        text: "View partnership opportunities",
        type: "action",
        action: "view_partnerships"
      });
    }

    // Get enhanced context from either direct property or nested property
    const enhancedContext = context.enhancedContext || context;

    // Add content-specific options
    if (enhancedContext.content?.length > 0) {
      options.push({
        text: "View content insights",
        type: "detail",
        action: "view_content_insights"
      });
    }

    // Add audience-specific options
    if (enhancedContext.audience?.length > 0) {
      options.push({
        text: "View audience insights",
        type: "detail",
        action: "view_audience_insights"
      });
    }

    // Add user persona based options
    if (context.userPersona || enhancedContext.userPersona) {
      options.push({
        text: "Personalize recommendations",
        type: "action",
        action: "personalize"
      });
    }

    // Add conversation state based options
    if (context.conversationState?.pendingActions?.length > 0) {
      options.push({
        text: "View pending actions",
        type: "action",
        action: "view_pending_actions"
      });
    }

    // Add general suggestions
    options.push({
      text: "Tell me more",
      type: "suggestion"
    });

    return options;
  }

  private static generateFollowUp(content: string, context: any): { question: string; choices?: string[] } | null {
    // Generate relevant follow-up based on content and context
    if (content.includes('strategy')) {
      const choices = ["Content strategy", "Growth strategy", "Partnership strategy"];
      
      // Add persona-specific strategies if available
      if (context.userPersona?.currentPersona) {
        choices.push(`${context.userPersona.currentPersona} strategy`);
      }

      return {
        question: "Would you like to focus on:",
        choices
      };
    }

    if (content.includes('analytics')) {
      const choices = ["Audience growth", "Engagement rates", "Content performance"];
      
      // Add platform-specific metrics if available
      if (context.availableFeatures?.includes('metrics')) {
        choices.push("Platform metrics");
      }

      return {
        question: "Which metrics would you like to explore?",
        choices
      };
    }

    // Add follow-up based on conversation state
    if (context.conversationState?.topicDepth > 2) {
      return {
        question: "Would you like to:",
        choices: [
          "Dive deeper into this topic",
          "Explore related topics",
          "Summarize what we've discussed",
          "Take action on insights"
        ]
      };
    }

    return null;
  }

  private static generateSuggestions(content: string, context: any): string[] {
    const suggestions: string[] = [];

    // Add relevant next steps based on content
    if (content.includes('performance')) {
      suggestions.push(
        "Show performance breakdown",
        "Compare with previous period",
        "View top-performing content"
      );
    }

    // Add suggestions based on available features
    if (context.availableFeatures?.includes('smartNotes')) {
      suggestions.push("Save insights to Smart Notes");
    }

    // Add suggestions based on user persona
    if (context.userPersona?.futureVision) {
      suggestions.push(`Align with your ${context.userPersona.futureVision} goals`);
    }

    // Add suggestions based on conversation state
    if (context.conversationState?.emotionalState?.primary === 'uncertain') {
      suggestions.push(
        "Get step-by-step guidance",
        "See similar success stories",
        "Break down the process"
      );
    }

    // Add suggestions based on ambient insights
    if (context.ambientInsights) {
      suggestions.push("Explore related insights");
    }

    // Add suggestions based on enhanced context
    if (context.enhancedContext?.conversationMetrics?.contextQuality < 0.7) {
      suggestions.push("Get more detailed explanation");
    }

    return suggestions;
  }
} 