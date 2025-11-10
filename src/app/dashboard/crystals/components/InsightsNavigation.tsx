import React from 'react';
import { ViewType } from './types';
import { T } from '@/components/translation';

interface InsightsNavigationProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export const InsightsNavigation: React.FC<InsightsNavigationProps> = ({ activeView, onViewChange }) => {
  const tabs = [
    { id: 'overview' as const, label: 'Overview', description: 'Summary and recent activity', labelContext: 'crystals.nav.overview', descContext: 'crystals.nav.overview_desc' },
    { id: 'crystals' as const, label: 'Cognitive Fields', description: 'Living intelligence patterns', labelContext: 'crystals.nav.cognitive_fields', descContext: 'crystals.nav.cognitive_fields_desc' },
    { id: 'shards' as const, label: 'Shards', description: 'Memory fragments', labelContext: 'crystals.nav.shards', descContext: 'crystals.nav.shards_desc' },
    { id: 'stardust' as const, label: 'Stardust', description: 'Emerging potentials', labelContext: 'crystals.nav.stardust', descContext: 'crystals.nav.stardust_desc' },
    { id: 'stars' as const, label: 'Stars', description: 'Your project organisms', labelContext: 'crystals.nav.stars', descContext: 'crystals.nav.stars_desc' }
  ];

  return (
    <div className="border-b border-border/30">
      <nav className="flex gap-8 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onViewChange(tab.id)}
            className={`group pb-4 px-1 text-left transition-colors duration-200 relative flex-shrink-0 ${
              activeView === tab.id 
                ? 'text-foreground' 
                : 'text-muted-foreground hover:text-foreground/70'
            }`}
          >
            <div className="space-y-1">
              <div className="font-medium text-sm">
                <T context={tab.labelContext}>{tab.label}</T>
              </div>
              <div className="text-xs text-muted-foreground group-hover:text-muted-foreground/80 transition-colors duration-200">
                <T context={tab.descContext}>{tab.description}</T>
              </div>
            </div>
            {activeView === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-px bg-foreground" />
            )}
          </button>
        ))}
      </nav>
    </div>
  );
};
