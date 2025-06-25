'use client'

import React from 'react';
import { useAuth } from '@/app/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { useOptimizedPersonaManager } from '@/store/persona-store';
import { PersonaTimeline } from '@/app/settings/tabs/account/PersonaTimeline';
import { Id } from '@/convex/_generated/dataModel';
import { History } from 'lucide-react';

const TimelineTabSkeleton = () => (
  <div className="animate-pulse w-full space-y-6">
    {/* Header Skeleton */}
    <div className="space-y-2">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-64" />
    </div>

    {/* Timeline Items Skeleton */}
    <div className="space-y-8">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-start space-x-4">
          <Skeleton className="h-6 w-6 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="p-4 rounded-lg border">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="mt-2 h-4 w-24" />
              <Skeleton className="mt-3 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-3/4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const TimelineTab: React.FC = () => {
  const { firebaseUser, authLoading } = useAuth();

  const {
    personaHistory,
    isLoading,
    hasHistory,
    activatePersona,
    deletePersona,
  } = useOptimizedPersonaManager(firebaseUser?.uid);

  const handleRestore = async (personaId: Id<'personas'>) => {
    await activatePersona(personaId);
  };

  const handleDelete = async (personaId: Id<'personas'>) => {
    if (confirm('Delete this persona version permanently?')) {
      await deletePersona(personaId);
    }
  };

  if (authLoading || !firebaseUser?.uid) {
    return (
      <div className="flex justify-center items-center min-h-[200px] px-4 rounded-lg border border-dashed">
        <p className="text-gray-600 text-sm">Please sign in to view your timeline.</p>
      </div>
    );
  }

  if (isLoading) {
    return <TimelineTabSkeleton />;
  }

  if (!hasHistory) {
    return (
      <div className="text-center py-12 px-4 space-y-4">
        <History className="w-12 h-12 text-muted-foreground mx-auto" />
        <div>
          <p className="font-medium text-foreground text-lg">No Timeline History</p>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-md mx-auto">
            Your persona changes and updates will appear here as you evolve your content identity.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-purple-600 dark:text-accent">Persona Timeline</h2>
        <p className="text-sm text-muted-foreground">
          Track the evolution of your content persona over time.
        </p>
      </div>

      {/* Timeline */}
      <PersonaTimeline
        history={personaHistory}
        onRestore={handleRestore}
        onDelete={handleDelete}
      />
    </div>
  );
}; 