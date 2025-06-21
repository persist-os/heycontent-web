'use client'

import React, { useEffect, useState } from 'react';
import { PersonaUpdateManager } from '@/app/settings/tabs/account/PersonaUpdateManager';
import { getFirebaseAuth } from '@/app/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

const PersonaTabSkeleton = () => (
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
);

export const PersonaTab = () => {
  const [userId, setUserId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let auth;
    try {
      auth = getFirebaseAuth();
    } catch (e) {
      auth = null;
      setIsLoading(false);
    }
    if (!auth) return;
    
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUserId(firebaseUser?.uid);
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const handleNewPersona = () => {
    router.push('/dashboard/chat?ask=' + encodeURIComponent('hey content update persona'));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-start min-h-[400px] px-4 py-8">
        <PersonaTabSkeleton />
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="flex justify-center items-center min-h-[200px] px-4 group">
        <div className="text-center space-y-4 max-w-sm p-8 rounded-xl bg-muted/50 transition-all group-hover:shadow-lg">
          <p className="text-muted-foreground text-sm leading-relaxed">
            Please sign in to view your persona settings
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <PersonaUpdateManager userId={userId} renderNewPersonaButton={handleNewPersona} />
    </div>
  );
};

 