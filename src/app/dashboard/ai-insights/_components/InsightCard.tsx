import React from 'react';
import { Youtube, Instagram, Mail, ChevronRight, ArrowRight, MessageSquare } from 'lucide-react';
import { Card } from '@/components/ui/card';

export interface InsightCardProps {
  platform: 'youtube' | 'instagram' | 'gmail';
  title: string;
  impact: string;
  highlightColor?: string;
  whyNow: string[];
  actionSteps: string[];
  expectedOutcome: string;
  outcomeColor?: string;
  sourceDetails: string[];
  relatedItems?: Array<{ label: string; value: string }>;
  onDiscuss?: () => void;
  expanded?: boolean;
  onExpand?: () => void;
}

const platformIcon = {
  youtube: <Youtube className="w-5 h-5 text-[#FF0000]" />,
  instagram: <Instagram className="w-5 h-5 text-[#C13584]" />,
  gmail: <Mail className="w-5 h-5 text-[#EA4335]" />,
};

export const InsightCard: React.FC<InsightCardProps> = ({
  platform,
  title,
  impact,
  highlightColor = 'bg-heycontent-light-yellow',
  whyNow,
  actionSteps,
  expectedOutcome,
  outcomeColor = 'bg-heycontent-light-green',
  sourceDetails,
  relatedItems,
  onDiscuss,
  expanded = false,
  onExpand,
}) => {
  return (
    <Card className="overflow-hidden transition-shadow cursor-pointer hover:shadow-lg" onClick={onExpand}>
      {/* Collapsed Header */}
      <div
        className={`flex items-center justify-between p-4 ${highlightColor} ${expanded ? 'rounded-t-lg' : 'rounded-lg'}`}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-white/80 dark:bg-black/30">
            {platformIcon[platform]}
          </div>
          <div>
            <h3 className="font-medium text-text-dark dark:text-white">{title}</h3>
            <p className="text-sm text-text-gray dark:text-gray-400">{impact}</p>
          </div>
        </div>
        <ChevronRight
          className={`w-5 h-5 text-text-gray transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
        />
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="p-4 space-y-6" onClick={e => e.stopPropagation()}>
          {/* Why Now Section */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-3">
            <h4 className="font-medium dark:text-white">Why Now?</h4>
            <ul className="space-y-2">
              {whyNow.map((reason, idx) => (
                <li key={idx} className="text-sm text-text-gray dark:text-gray-400 flex items-start gap-2">
                  <span className="mt-1">•</span>
                  {reason}
                </li>
              ))}
            </ul>
          </div>

          {/* Action Steps */}
          <div>
            <h4 className="font-medium dark:text-white mb-3">Action Steps</h4>
            <div className="space-y-2">
              {actionSteps.map((step, idx) => (
                <button
                  key={idx}
                  className="w-full flex items-center justify-between p-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left group"
                >
                  <span className="text-sm dark:text-gray-300 group-hover:text-heycontent-purple dark:group-hover:text-heycontent-purple transition-colors">{step}</span>
                  <ArrowRight className="w-4 h-4 text-text-gray group-hover:text-heycontent-purple dark:group-hover:text-heycontent-purple transition-colors" />
                </button>
              ))}
            </div>
          </div>

          {/* Expected Outcome */}
          <div className={`${outcomeColor} p-4 rounded-lg`}>
            <h4 className="font-medium text-text-dark dark:text-heycontent-green mb-2">Expected Outcome</h4>
            <p className="text-sm text-text-dark dark:text-heycontent-green">{expectedOutcome}</p>
          </div>

          {/* Source Details Section */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h4 className="font-medium dark:text-white mb-2">Source Details</h4>
            {sourceDetails.map((detail, idx) => (
              <p key={idx} className="text-sm text-text-gray dark:text-gray-400 mb-1">{detail}</p>
            ))}
            {relatedItems && relatedItems.length > 0 && (
              <div className="mt-2">
                <h5 className="text-sm font-medium dark:text-white mb-1">Related Items</h5>
                <div className="max-h-32 overflow-y-auto">
                  {relatedItems.map((item, idx) => (
                    <div key={idx} className="text-xs text-text-gray dark:text-gray-400 mb-1">
                      • {item.label}: {item.value}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Discuss with Content */}
          {onDiscuss && (
            <button
              onClick={e => {
                e.stopPropagation();
                onDiscuss();
              }}
              className="flex items-center gap-2 text-sm text-heycontent-purple dark:text-heycontent-purple mt-2"
            >
              <MessageSquare className="w-4 h-4" />
              Discuss with Content
            </button>
          )}
        </div>
      )}
    </Card>
  );
}; 