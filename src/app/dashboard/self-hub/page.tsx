'use client'

import React, { useEffect, useState } from 'react';
import { PersonaTab } from './PersonaTab';
import { TimelineScroller } from '../timeline/_components';
import { UsageHeatmap } from './UsageHeatmap';
import { getCurrentUserId } from '@/app/lib/api-helpers';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Help system imports
import { EnhancedHelpButton } from '@/components/ui/enhanced-help-button'
import { InteractiveTooltip } from '@/components/ui/interactive-tooltip'
import { interactiveTours } from '@/helpContent/interactiveTours'

export default function SelfHubPage() {
  const [userId, setUserId] = useState<string | undefined>();
  const [interactiveTourOpen, setInteractiveTourOpen] = useState(false);

  useEffect(() => {
    const currentUserId = getCurrentUserId();
    setUserId(currentUserId || undefined);
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Tabs defaultValue="persona" className="h-full flex flex-col">
        {/* Header with tabs */}
        <div className="px-6 py-4 border-b bg-background">
          <div className="flex items-center justify-between mb-4">
            <div className="text-center ml-12 md:ml-0">
              <h1 className="text-base font-medium text-purple-600 dark:text-accent">
                Self
              </h1>
              <p className="text-muted-foreground text-sm">
                Manage your persona and activity.
              </p>
            </div>
            <div>
              <EnhancedHelpButton 
                onInteractiveTour={() => setInteractiveTourOpen(true)}
              />
            </div>
          </div>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="persona" data-persona-tab>Persona</TabsTrigger>
            <TabsTrigger value="timeline" data-timeline-tab>Timeline</TabsTrigger>
            <TabsTrigger value="usage" data-activity-tab>Activity</TabsTrigger>
          </TabsList>
        </div>

        {/* Tab content - full height for timeline */}
        <TabsContent value="persona" className="flex-1 overflow-auto p-6" data-persona-content>
          <PersonaTab />
        </TabsContent>
        <TabsContent value="timeline" className="flex-1 h-full overflow-hidden" data-timeline-content>
          {/* Timeline Filters - Placeholder for tour */}
          <div data-timeline-filters className="absolute opacity-0 pointer-events-none -z-10 w-1 h-1">
            <p className="text-sm text-muted-foreground">Filter your content timeline by date, type, or performance.</p>
          </div>
          <TimelineScroller />
        </TabsContent>
        <TabsContent value="usage" className="flex-1 overflow-auto p-6" data-activity-content>
          {userId ? (
            <div className="space-y-6">
              <UsageHeatmap userId={userId} />
              {/* Goals Section - Placeholder for tour */}
              <div data-goals-section className="absolute opacity-0 pointer-events-none -z-10 w-1 h-1">
                <h3 className="text-lg font-semibold mb-4">Content Goals & Milestones</h3>
                <p className="text-sm text-muted-foreground">Track your progress towards creator objectives.</p>
              </div>
              {/* Performance Trends - Placeholder for tour */}
              <div data-performance-trends className="absolute opacity-0 pointer-events-none -z-10 w-1 h-1">
                <h3 className="text-lg font-semibold mb-4">Performance Trends</h3>
                <p className="text-sm text-muted-foreground">Analyze your content performance over time.</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center items-center min-h-[200px] px-4 rounded-lg border border-dashed">
              <p className="text-gray-600 text-sm">Please sign in to view your activity.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>



      {/* Interactive Tour */}
      <InteractiveTooltip
        isOpen={interactiveTourOpen}
        onClose={() => setInteractiveTourOpen(false)}
        steps={interactiveTours.selfHub}
        title="Self Hub Features Tour"
        autoPlay={false}
      />
    </div>
  );
} 