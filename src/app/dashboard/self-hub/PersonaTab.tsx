'use client'

import React, { useEffect, useState } from 'react';
import { PersonaUpdateManager } from '@/app/settings/tabs/account/PersonaUpdateManager';
import { getFirebaseAuth } from '@/app/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';

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
      <div className="flex justify-center items-center min-h-[200px] px-4">
        <div className="animate-pulse space-y-4 text-center max-w-sm w-full">
          <div className="w-8 h-8 bg-purple-200 rounded-full mx-auto animate-spin"></div>
          <p className="text-gray-600 text-sm leading-relaxed">Loading your persona data...</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="flex justify-center items-center min-h-[200px] px-4">
        <div className="text-center space-y-4 max-w-sm">
          <p className="text-gray-600 text-sm leading-relaxed">
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

 