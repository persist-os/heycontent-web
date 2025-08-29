'use client'

import React, { useEffect, useState } from 'react';
import { PersonaTab } from './PersonaTab';
// import { TimelineScroller } from '../timeline/_components';
// import { UsageHeatmap } from './UsageHeatmap';
import { getCurrentUserId } from '@/app/lib/api-helpers';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"



export default function SelfHubPage() {
  const [userId, setUserId] = useState<string | undefined>();


  useEffect(() => {
    const currentUserId = getCurrentUserId();
    setUserId(currentUserId || undefined);
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-background">
        <div className="flex items-center justify-between mb-4">
          <div className="ml-12 md:ml-0">
            <h1 className="text-2xl font-bold text-foreground">
              Self
            </h1>
            <p className="text-sm text-muted-foreground">
              A private space to explore how you think and what works for you.
            </p>
          </div>

        </div>
        {/* Commented out tabs */}
        {/* <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="persona" data-persona-tab>Persona</TabsTrigger>
          <TabsTrigger value="timeline" data-timeline-tab>Timeline</TabsTrigger>
          <TabsTrigger value="usage" data-activity-tab>Activity</TabsTrigger>
        </TabsList> */}
      </div>

      {/* Only PersonaTab content */}
      <div className="flex-1 overflow-auto p-6" data-persona-content>
        <PersonaTab />
      </div>

      {/* Commented out other tab contents */}
      {/* <Tabs defaultValue="persona" className="h-full flex flex-col">
        <TabsContent value="timeline" className="flex-1 h-full overflow-hidden" data-timeline-content>
          <div data-timeline-filters className="absolute opacity-0 pointer-events-none -z-10 w-1 h-1">
            <p className="text-sm text-muted-foreground">Filter your content timeline by date, type, or performance.</p>
          </div>
          <TimelineScroller />
        </TabsContent>
        <TabsContent value="usage" className="flex-1 overflow-auto p-6" data-activity-content>
          {userId ? (
            <div className="space-y-6">
              <UsageHeatmap userId={userId} />
              <div data-goals-section className="absolute opacity-0 pointer-events-none -z-10 w-1 h-1">
                <h3 className="text-lg font-semibold mb-4">Content Goals & Milestones</h3>
                <p className="text-sm text-muted-foreground">Track your progress towards creator objectives.</p>
              </div>
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
      </Tabs> */}


    </div>
  );
} 