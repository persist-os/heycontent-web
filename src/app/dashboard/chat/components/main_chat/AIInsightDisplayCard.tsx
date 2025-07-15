import React from 'react';
import { Card } from '@/components/ui/card';
import { Instagram, Mail } from 'lucide-react';
import { YouTubeBrandIcon } from '../../../../../lib/YoutubeBrandIcon';
import { cleanImpactString } from '@/app/lib/utils/impact-utils';

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
    actionStep?: string;
  };
  showPlatformIcon?: boolean;
}

const platformIcon = {
  youtube: <YouTubeBrandIcon href="https://youtube.com/" className="w-8 h-8" />,
  instagram: <Instagram className="w-5 h-5 text-pink-500" />,
  gmail: <Mail className="w-5 h-5 text-blue-500" />,
};

export const AIInsightDisplayCard: React.FC<AIInsightDisplayCardProps> = ({ context, showPlatformIcon = true }) => {
  const { fullInsight, originalPlatform, isPersonaGeneration } = context;
  
  if (!fullInsight) return null;

  return (
    <Card className="p-4 bg-white dark:bg-gray-900 border border-[#D0ECFF] max-h-64 overflow-y-auto">
      {/* Header */}
      <div className="mb-2 relative flex items-center min-h-[48px]">
        {showPlatformIcon && originalPlatform && (
          <span className="flex items-center justify-center w-12 h-12 absolute left-0 top-1/2 -translate-y-1/2">
            {platformIcon[originalPlatform]}
          </span>
        )}
        <div className="flex-1 min-w-0 pl-12">
          <div className="flex flex-col gap-1">
            <span className="text-lg font-semibold text-[#4E87E3] truncate">{fullInsight.title}</span>
            {context.actionStep && (
              <span className="block text-base font-medium text-[#4E87E3] bg-[#EAF3FF] rounded px-2 py-1 mt-1">
                Action Item: {context.actionStep}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default AIInsightDisplayCard; 