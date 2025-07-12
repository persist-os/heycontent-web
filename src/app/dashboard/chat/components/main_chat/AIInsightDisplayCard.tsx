import React from 'react';
import { Card } from '@/components/ui/card';
import { Instagram, Mail } from 'lucide-react';
import { YouTubeBrandIcon } from '../../../../../lib/YoutubeBrandIcon';

interface AIInsightDisplayCardProps {
  context: {
    title?: string;
    originalPlatform?: 'youtube' | 'instagram' | 'gmail';
    fullInsight?: {
      title: string;
      impact: string;
      whyNow: string[];
      actionSteps: string[];
      expectedOutcome: string;
      sourceDetails: string[];
      relatedItems?: Array<{ label: string; value: string }>;
    };
    isPersonaGeneration?: boolean;
  };
  showPlatformIcon?: boolean;
}

const platformIcon = {
  youtube: <YouTubeBrandIcon href="https://youtube.com/" className="w-8 h-8" />,
  instagram: <Instagram className="w-5 h-5 text-pink-500" />,
  gmail: <Mail className="w-5 h-5 text-blue-500" />,
};

export const AIInsightDisplayCard: React.FC<AIInsightDisplayCardProps> = ({ context, showPlatformIcon = true }) => {
  console.log('[AIInsightDisplayCard] Received context:', context);
  console.log('[AIInsightDisplayCard] Received fullInsight:', context.fullInsight);
  const { fullInsight, originalPlatform, isPersonaGeneration } = context;
  
  if (!fullInsight) return null;

  // Check if this is a fallback Content Hub Insight (only whyNow is set, and all others are empty)
  const onlyWhyNow =
    fullInsight.whyNow &&
    fullInsight.whyNow.length === 1 &&
    !fullInsight.impact &&
    (!fullInsight.actionSteps || fullInsight.actionSteps.length === 0) &&
    !fullInsight.expectedOutcome &&
    (!fullInsight.sourceDetails || fullInsight.sourceDetails.length === 0) &&
    (!fullInsight.relatedItems || fullInsight.relatedItems.length === 0);

  if (onlyWhyNow) {
    return (
      <Card className="p-4 bg-white dark:bg-gray-900 border border-[#D0ECFF] max-h-64 overflow-y-auto">
        <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">{fullInsight.whyNow[0]}</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-white dark:bg-gray-900 border border-[#D0ECFF] max-h-64 overflow-y-auto">
      {/* Header */}
      <div className="mb-4 relative" style={{ minHeight: '48px' }}>
        {showPlatformIcon && originalPlatform && (
          <span className="flex items-center justify-center w-12 h-12 absolute left-0 top-1/2 -translate-y-1/2">
            {platformIcon[originalPlatform]}
          </span>
        )}
        <div className="flex-1 min-w-0">
          {fullInsight.impact && (
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <span>Impact: <span className="text-[#4E87E3] font-medium">{fullInsight.impact}</span></span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4 text-base">
        {/* Why Now */}
        {fullInsight.whyNow && fullInsight.whyNow.length > 0 && (
          <div>
            <h4 className="font-semibold text-base text-[#4E87E3] mb-1">Why Now</h4>
            <div className="space-y-1">
              {fullInsight.whyNow.map((reason, idx) => (
                <p key={idx} className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                  {reason}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Action Steps */}
        {fullInsight.actionSteps && fullInsight.actionSteps.length > 0 && (
          <div>
            <h4 className="font-semibold text-base text-[#4E87E3] mb-1">Action Steps</h4>
            <div className="space-y-1">
              {fullInsight.actionSteps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#4E87E3] text-white text-sm font-semibold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expected Outcome */}
        {fullInsight.expectedOutcome && (
          <div>
            <h4 className="font-semibold text-base text-[#4E87E3] mb-1">Expected Outcome</h4>
            <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
              {fullInsight.expectedOutcome}
            </p>
          </div>
        )}

        {/* Source Details - Collapsed by default */}
        {fullInsight.sourceDetails && fullInsight.sourceDetails.length > 0 && (
          <div>
            <h4 className="font-semibold text-base text-[#4E87E3] mb-1">Source Details</h4>
            <div className="space-y-1">
              {fullInsight.sourceDetails.map((detail, idx) => (
                <p key={idx} className="text-sm text-gray-700 dark:text-gray-400 leading-relaxed">{detail}</p>
              ))}
            </div>
          </div>
        )}

        {/* Related Items - Only show if they exist */}
        {fullInsight.relatedItems && fullInsight.relatedItems.length > 0 && (
          <div>
            <h4 className="font-semibold text-base text-[#4E87E3] mb-1">Related Items</h4>
            <div className="space-y-1">
              {fullInsight.relatedItems.map((item, idx) => (
                <div key={idx} className="text-sm text-gray-700 dark:text-gray-400">
                  <span className="font-semibold text-[#4E87E3]">{item.label}:</span> {item.value}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default AIInsightDisplayCard; 