"use client";

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/app/context/auth-context';

export function useUsernameRequired() {
  const { firebaseUser, authLoading } = useAuth();
  
  const userInfo = useQuery(
    api.userQueries.getUserInfo,
    firebaseUser?.uid ? { userId: firebaseUser.uid } : "skip"
  );

  const isLoading = authLoading || (firebaseUser && userInfo === undefined);
  const needsUsername = firebaseUser && userInfo && (!userInfo.username || userInfo.username.trim() === '');

  return {
    needsUsername: !!needsUsername,
    isLoading,
    userInfo
  };
}
