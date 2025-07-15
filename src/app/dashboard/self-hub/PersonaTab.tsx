'use client'

import React, { useMemo, Suspense, useEffect } from 'react';
import { useAuth } from '@/app/context/auth-context';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { usePersonaStore } from '@/store/persona-store';
import { useConvex, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { X } from 'lucide-react';

// Lazy load PersonaUpdateManager to reduce initial bundle size
const PersonaUpdateManager = React.lazy(() => 
  import('@/app/settings/tabs/account/PersonaUpdateManager').then(module => ({
    default: module.PersonaUpdateManager
  }))
);

const QuickLoadingIndicator = React.memo(() => (
  <div className="w-full min-h-[200px] flex items-center justify-center">
    <div className="flex items-center space-x-2 text-muted-foreground">
      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
      <span className="text-sm">Loading your persona...</span>
    </div>
  </div>
));

QuickLoadingIndicator.displayName = 'QuickLoadingIndicator';

const PersonaTabSkeleton = React.memo(() => (
  <div className="animate-pulse w-full space-y-10">
    {/* Header Skeleton */}
    <div>
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0 mb-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-11 w-24 rounded-lg" />
          <Skeleton className="h-11 w-28 rounded-lg" />
        </div>
      </div>

      {/* NewPersonaCard Skeleton */}
      <div className="rounded-xl bg-card/50 p-6 transition-all hover:shadow-md">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="mt-4 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-3/4" />
        
        <div className="mt-8 space-y-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="py-6 border-b border-border">
              <div className="mb-4">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="mt-2 h-4 w-1/2" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* PersonaTimeline Skeleton */}
    <div className="mt-8">
      <div className="mb-6">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>
      <div className="flex flex-col md:flex-row md:space-x-8 p-1">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="flex-1 p-4 rounded-lg transition-colors">
            <Skeleton className="h-32" />
          </div>
        ))}
      </div>
    </div>
  </div>
));

PersonaTabSkeleton.displayName = 'PersonaTabSkeleton';

export const PersonaTab = React.memo(() => {
  // Always declare hooks at the very top before any conditional return
  const [modalOpen, setModalOpen] = React.useState(true);
  console.log('[PERSONA TAB] Component rendering started at:', new Date().toISOString());
  const renderStartTime = performance.now();
  
  const { firebaseUser, authLoading } = useAuth();
  const router = useRouter();
  const convex = useConvex();
  
  // Get all the data we need from the store
  const isPersonaLoading = usePersonaStore(state => state.isLoading);
  const isPersonaInitialized = usePersonaStore(state => state.isInitialized);
  const currentPersona = usePersonaStore(state => state.currentPersona);
  const allPersonas = usePersonaStore(state => state.allPersonas);
  const isCacheValid = usePersonaStore(state => state.isCacheValid);
  const initializePersonaData = usePersonaStore(state => state.initializePersonaData);
  const refreshPersonaData = usePersonaStore(state => state.refreshPersonaData);
  const lastFetchedUserId = usePersonaStore(state => state.lastFetchedUserId);

  // Check persona generation eligibility for structured growth messaging
  // Personas can only be generated once every two weeks to:
  // 1. Track meaningful progress and goal evolution
  // 2. Maintain consistency in creator journey tracking
  // 3. Prevent content strategy confusion from too-frequent changes
  // 4. Encourage structured reflection and intentional growth
  const eligibility = useQuery(
    api.personas.checkPersonaGenerationEligibility,
    firebaseUser?.uid ? { userId: firebaseUser.uid } : "skip"
  );

  // Initialize persona data ONLY when PersonaTab is rendered and we have a user
  useEffect(() => {
    const effectStartTime = performance.now();
    console.log('[PERSONA TAB] useEffect triggered for persona initialization');
    
    if (firebaseUser?.uid) {
      // Always ensure we have fresh data for this user
      if (!isPersonaInitialized || lastFetchedUserId !== firebaseUser.uid || !currentPersona) {
        console.log('[PERSONA TAB] Initializing persona data - fresh fetch needed');
        initializePersonaData(firebaseUser.uid, convex).then(() => {
          const effectEndTime = performance.now();
          console.log('[PERSONA TAB] Persona initialization completed in:', Math.round(effectEndTime - effectStartTime), 'ms');
        }).catch((error) => {
          const effectErrorTime = performance.now();
          console.error('[PERSONA TAB] Persona initialization failed in:', Math.round(effectErrorTime - effectStartTime), 'ms, error:', error);
        });
      } else if (!isCacheValid()) {
        // If cache is stale, refresh the data
        console.log('[PERSONA TAB] Cache is stale - refreshing persona data');
        refreshPersonaData(firebaseUser.uid, convex);
      } else {
        console.log('[PERSONA TAB] Using valid cached data');
      }
    }
  }, [firebaseUser?.uid, isPersonaInitialized, lastFetchedUserId, currentPersona, isCacheValid, initializePersonaData, refreshPersonaData, convex]);

  // Memoize the new persona handler with eligibility check
  const handleNewPersona = React.useCallback(() => {
    if (eligibility?.canGenerate) {
      console.log('[PERSONA TAB] New persona button clicked');
      router.push('/dashboard/chat?ask=' + encodeURIComponent('hey content update persona'));
    }
  }, [router, eligibility?.canGenerate]);

  // Simplified loading state - prioritize showing persona when available
  const loadingState = useMemo(() => {
    // Always show persona if we have it, even if loading in background
    if (currentPersona) {
      console.log('[PERSONA TAB] Showing current persona');
      return 'ready';
    }
    
    // If we're still waiting for auth, show loading
    if (authLoading) return 'initializing';
    
    // If we have a user but no persona and we're loading, show loading
    if (firebaseUser && isPersonaLoading) return 'loading';
    
    // If we have a user but no persona and store isn't initialized, show loading
    if (firebaseUser && !isPersonaInitialized) return 'loading';
    
    // If we have a user but still no persona, we're ready (will show empty state)
    if (firebaseUser) return 'ready';
    
    return 'initializing';
  }, [authLoading, firebaseUser, isPersonaLoading, isPersonaInitialized, currentPersona]);
  
  React.useEffect(() => {
    if (eligibility?.mustUpdate) setModalOpen(true);
    else setModalOpen(false);
  }, [eligibility?.mustUpdate]);

  // ALL HOOKS ARE NOW DECLARED - CONDITIONAL RENDERING BELOW

  console.log('[PERSONA TAB] Auth state:', {
    authLoading,
    hasFirebaseUser: !!firebaseUser,
    firebaseUserUid: firebaseUser?.uid
  });

  console.log('[PERSONA TAB] Persona store state:', {
    isPersonaLoading,
    isPersonaInitialized,
    hasCurrentPersona: !!currentPersona,
    allPersonasCount: allPersonas.length,
    isCacheValid: isCacheValid(),
    lastFetchedUserId,
    eligibilityCanGenerate: eligibility?.canGenerate,
    daysRemaining: eligibility?.daysRemaining,
    timestamp: new Date().toISOString()
  });

  console.log('[PERSONA TAB] Loading state:', loadingState, {
    authLoading,
    isPersonaLoading,
    isPersonaInitialized,
    hasFirebaseUser: !!firebaseUser,
    hasCurrentPersona: !!currentPersona,
    hasCachedData: allPersonas.length > 0,
    canGeneratePersona: eligibility?.canGenerate,
    daysUntilNextGeneration: eligibility?.daysRemaining
  });

  // Show appropriate loading UI based on state
  if (loadingState === 'initializing' || loadingState === 'loading') {
    const skeletonStartTime = performance.now();
    console.log('[PERSONA TAB] Showing loading state at:', new Date().toISOString(), 'render time so far:', Math.round(skeletonStartTime - renderStartTime), 'ms');
    
    return (
      <div className="flex justify-center items-start min-h-[400px] px-4 py-8">
        <PersonaTabSkeleton />
      </div>
    );
  }

  // Always render PersonaUpdateManager when ready
  const finalRenderTime = performance.now();
  console.log('[PERSONA TAB] Rendering PersonaUpdateManager at:', new Date().toISOString(), 'total render time:', Math.round(finalRenderTime - renderStartTime), 'ms');

  // Debug logs for eligibility and currentPersona
  console.log('[PERSONA TAB] eligibility:', eligibility);
  console.log('[PERSONA TAB] currentPersona:', currentPersona);

  if (eligibility?.mustUpdate) {
    return (
      <>
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-md w-full mx-4 z-50">
            <DialogHeader>
              <DialogTitle>Time to Refresh Your Persona!</DialogTitle>
              <DialogDescription>
                It's been 14 days since your last persona update. To keep your creative journey on track and your insights fresh, please update your persona before continuing.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 mt-4">
              <Button
                onClick={handleNewPersona}
                variant="outline"
                size="sm"
                className="text-purple-500 border-purple-500 hover:bg-purple-50 dark:text-accent dark:border-accent dark:hover:bg-accent/10 min-h-[44px] w-full sm:w-auto"
              >
                Update Persona Now
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        {!modalOpen && (
          <div className="w-full">
            <Suspense fallback={<PersonaTabSkeleton />}>
              <PersonaUpdateManager 
                userId={firebaseUser?.uid} 
                renderNewPersonaButton={() => (
                  <Button
                    onClick={handleNewPersona}
                    disabled={!eligibility?.canGenerate}
                    variant="outline"
                    size="sm"
                    className="text-purple-500 border-purple-500 hover:bg-purple-50 dark:text-accent dark:border-accent dark:hover:bg-accent/10 min-h-[44px] w-full sm:w-auto"
                    aria-disabled={!eligibility?.canGenerate}
                  >
                    {eligibility?.canGenerate
                      ? (currentPersona ? 'Update Persona' : 'Create Persona')
                      : `Update available in ${eligibility?.daysRemaining ?? 'a few'} day${eligibility?.daysRemaining !== 1 ? 's' : ''}`}
                  </Button>
                )}
              />
            </Suspense>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="w-full">
      <Suspense fallback={<PersonaTabSkeleton />}>
        <PersonaUpdateManager 
          userId={firebaseUser?.uid} 
          renderNewPersonaButton={() => (
            <Button
              onClick={handleNewPersona}
              disabled={!eligibility?.canGenerate}
              variant="outline"
              size="sm"
              className="text-purple-500 border-purple-500 hover:bg-purple-50 dark:text-accent dark:border-accent dark:hover:bg-accent/10 min-h-[44px] w-full sm:w-auto"
              aria-disabled={!eligibility?.canGenerate}
            >
              {eligibility?.canGenerate
                ? (currentPersona ? 'Update Persona' : 'Create Persona')
                : `Update available in ${eligibility?.daysRemaining ?? 'a few'} day${eligibility?.daysRemaining !== 1 ? 's' : ''}`}
            </Button>
          )}
        />
      </Suspense>
    </div>
  );
});

PersonaTab.displayName = 'PersonaTab';

 