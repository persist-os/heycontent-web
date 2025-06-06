'use client'

import React, { useEffect, useState } from 'react';
import { PersonaUpdateManager } from './account/PersonaUpdateManager';
import { getFirebaseAuth } from '@/app/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const PersonaTab = () => {
  const [userId, setUserId] = useState<string | undefined>();

  useEffect(() => {
    let auth;
    try {
      auth = getFirebaseAuth();
    } catch (e) {
      auth = null;
    }
    if (!auth) return;
    
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUserId(firebaseUser?.uid);
    });
    
    return () => unsubscribe();
  }, []);

  // Show loading if userId is not yet loaded
  if (!userId) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-pulse space-y-4 text-center">
          <div className="w-8 h-8 bg-purple-200 rounded-full mx-auto animate-spin"></div>
          <p className="text-gray-600">Loading your persona data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-none">
      <PersonaUpdateManager userId={userId} />
    </div>
  );
};

export default PersonaTab; 