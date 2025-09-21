import { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { getFirebaseAuth } from '@/app/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { CrystalStats, FormationStatus, FormationEligibility } from './types';

export const useAuth = () => {
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

  return userId;
};

export const useCrystalData = (userId: string | undefined) => {
  const crystalStats = useQuery(
    api.crystalQueries.getCrystalStats,
    userId ? { userId } : "skip"
  ) as CrystalStats | undefined;

  const recentCrystals = useQuery(
    api.crystalQueries.getPersonaData,
    userId ? { userId, operation: "crystals", limit: 5 } : "skip"
  ) as any[] | undefined;

  const recentShards = useQuery(
    api.crystalQueries.getPersonaData,
    userId ? { userId, operation: "shards", limit: 8 } : "skip"
  ) as any[] | undefined;

  return {
    crystalStats,
    recentCrystals,
    recentShards
  };
};

export const useFormationData = (userId: string | undefined) => {
  const formationStatus = useQuery(
    api.formationQueries.queryFormation,
    userId ? { 
      operation: "status", 
      userId, 
      includeHistory: true, 
      limit: 3 
    } : "skip"
  ) as FormationStatus | undefined;

  const formationEligibility = useQuery(
    api.formationQueries.queryFormation,
    userId ? { 
      operation: "eligibility", 
      userId,
      minShards: 25,
      minDaysSinceLastRun: 0.25
    } : "skip"
  ) as FormationEligibility | undefined;

  return {
    formationStatus,
    formationEligibility
  };
};

export const formatTimeSince = (ms: number): string => {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ago`;
  } else {
    return `${minutes}m ago`;
  }
};
