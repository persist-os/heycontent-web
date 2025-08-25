import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/app/context/auth-context';

export interface PlatformConnections {
  gmail: boolean;
  youtube: boolean;
  instagram: boolean;
}

export function usePlatformConnections(): PlatformConnections {
  const { firebaseUser } = useAuth();
  
  // Query platform connections using Convex
  const youtubeData = useQuery(
    api.youtubeQueries.getYouTubeChannelData, 
    firebaseUser?.uid ? { userId: firebaseUser.uid } : 'skip'
  );
  
  const instagramData = useQuery(
    api.instagramQueries.getInstagramAccount, 
    firebaseUser?.uid ? { userId: firebaseUser.uid } : 'skip'
  );
  
  const gmailAccounts = useQuery(
    api.gmailQueries.getGmailAccounts, 
    firebaseUser?.uid ? { userId: firebaseUser.uid } : 'skip'
  );

  // Determine connection status
  const connections: PlatformConnections = {
    gmail: !!(gmailAccounts && gmailAccounts.length > 0),
    youtube: !!(youtubeData && youtubeData !== null),
    instagram: !!(instagramData && instagramData !== null),
  };

  return connections;
}
