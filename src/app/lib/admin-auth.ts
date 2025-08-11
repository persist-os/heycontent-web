import { useAuth } from '@/app/context/auth-context';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export function useAdminAuth() {
  const { firebaseUser } = useAuth();
  
  // Always call these hooks in the same order, even if we skip them
  const userRole = useQuery(api.auth.getUserRole, 
    firebaseUser?.uid ? { userId: firebaseUser.uid } : "skip"
  );
  
  const canAccessAdmin = useQuery(api.auth.canAccessAdmin,
    firebaseUser?.uid ? { userId: firebaseUser.uid } : "skip"
  );
  
  // Return consistent structure regardless of auth state
  return {
    isAdmin: userRole?.role === 'admin' || userRole?.role === 'super_admin',
    isSuperAdmin: userRole?.role === 'super_admin',
    canAccessAdmin: canAccessAdmin || false,
    userRole: userRole?.role || 'user',
    userEmail: firebaseUser?.email,
    permissions: userRole?.permissions || [],
  };
}

export function usePermission(permission: string) {
  const { firebaseUser } = useAuth();
  
  const hasPermission = useQuery(api.auth.hasPermission,
    firebaseUser?.uid ? { userId: firebaseUser.uid, permission } : "skip"
  );
  
  return hasPermission || false;
}

export function requireAdmin() {
  const { isAdmin } = useAdminAuth();
  
  if (!isAdmin) {
    throw new Error('Admin access required');
  }
}
 