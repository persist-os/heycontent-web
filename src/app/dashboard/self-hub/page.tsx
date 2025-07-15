'use client'

import React, { useEffect, useState } from 'react';
import { PersonaTab } from './PersonaTab';
import { TimelineScroller } from '../timeline/_components';
import { UsageHeatmap } from './UsageHeatmap';
import { getCurrentUserId } from '@/app/lib/api-helpers';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Help system imports
import { HelpModal } from '@/components/ui/help-modal'
import { HelpIconButton } from '@/components/ui/help-icon-button'
import { selfHubHelp } from '@/helpContent'

export default function SelfHubPage() {
  const [userId, setUserId] = useState<string | undefined>();
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    const currentUserId = getCurrentUserId();
    setUserId(currentUserId || undefined);
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Tabs defaultValue="persona" className="h-full flex flex-col">
        {/* Header with tabs */}
        <div className="px-6 py-4 border-b bg-background">
          <div className="mb-4 text-center relative">
            <h1 className="text-base font-medium text-purple-600 dark:text-accent">
              Self
            </h1>
            <p className="text-muted-foreground text-sm">
              Manage your persona and activity.
            </p>
            <div className="absolute top-0 right-0">
              <HelpIconButton onClick={() => setHelpOpen(true)} />
            </div>
          </div>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="persona">Persona</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="usage">Activity</TabsTrigger>
          </TabsList>
        </div>

        {/* Tab content - full height for timeline */}
        <TabsContent value="persona" className="flex-1 overflow-auto p-6">
          <PersonaTab />
        </TabsContent>
        <TabsContent value="timeline" className="flex-1 h-full overflow-hidden">
          <TimelineScroller />
        </TabsContent>
        <TabsContent value="usage" className="flex-1 overflow-auto p-6">
          {userId ? (
            <UsageHeatmap userId={userId} />
          ) : (
            <div className="flex justify-center items-center min-h-[200px] px-4 rounded-lg border border-dashed">
              <p className="text-gray-600 text-sm">Please sign in to view your activity.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Help Modal */}
      <HelpModal 
        open={helpOpen} 
        onClose={() => setHelpOpen(false)} 
        pages={selfHubHelp}
      />
    </div>
  );
} 