// File: app/(dashboard)/_components/settings-screen/tabs/AccountTab.tsx
import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getFirebaseAuth } from '@/app/lib/firebase'
import { authStateManager } from '@/app/lib/auth-state-manager'
import { handleResendVerification } from '../utils'
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Edit2, Save, X, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/app/context/auth-context'
import { ReadOnlyField, ReadOnlyTextArea } from './account/ReadOnlyField'
import { ProfileFields, ReferralFields, PersonaFields } from './account/FormSections'
import { Skeleton } from '@/components/ui/skeleton'
import LanguageSelector from '../components/LanguageSelector'

const MAX_PERSONA_LENGTH = 500
const MAX_VISION_LENGTH = 500

// Define the type for form data
interface AccountFormData {
  name: string;
  email: string;
  username: string;
  referralCode: string;
  referredBy: string;
  currentPersona: string;
  futureVision: string;
  image?: string;
}

interface AccountTabProps {
  formData: AccountFormData;
  setFormData: React.Dispatch<React.SetStateAction<AccountFormData>>;
  isUpdating: boolean;
  setIsUpdating: (val: boolean) => void;
  isResending: boolean;
  setIsResending: (val: boolean) => void;
  showPersonaFields: boolean;
  setShowPersonaFields: (val: boolean) => void;
}

// Handles profile update form submission
async function handleProfileUpdate(
  e: React.FormEvent,
  formData: AccountFormData,
  setIsUpdating: (val: boolean) => void,
  setFormData: React.Dispatch<React.SetStateAction<AccountFormData>>,
  updateUser: ReturnType<typeof useMutation>,
  userId: string | undefined,
  email: string | undefined,
  setIsEditMode: (val: boolean) => void,
  userPhotoURL?: string
) {
  e.preventDefault();
  setIsUpdating(true);
  try {
    if (!userId) {
      console.error('No user ID found. Cannot update profile.');
      setIsUpdating(false);
      return;
    }
    try {
      // Only update user profile, persona updates are handled by PersonaUpdateManager
      if (email) {
        const auth = getFirebaseAuth();
        await updateUser({
          userId,
          name: formData.name,
          email,
          username: formData.username,
          image: formData.image || userPhotoURL || undefined
        });
      }
      setIsEditMode(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsUpdating(false);
    }
  } catch (error) {
    console.error('Failed to update profile:', error);
    setIsUpdating(false);
  }
}

const AccountTab = ({ formData, setFormData, isUpdating, setIsUpdating, isResending, setIsResending, showPersonaFields, setShowPersonaFields }: AccountTabProps) => {
  const { firebaseUser } = useAuth();
  // Add state for edit mode
  const [isEditMode, setIsEditMode] = React.useState(false);
  const [originalFormData, setOriginalFormData] = React.useState<AccountFormData>(formData);
  
  // Properly fetch user data using the useQuery hook at component level
  const [userId, setUserId] = useState<string | undefined>()
  const [userEmail, setUserEmail] = useState<string | undefined>()
  useEffect(() => {
    // Use centralized auth state manager to prevent multiple listeners
    const unsubscribe = authStateManager.subscribe((firebaseUser) => {
      setUserId(firebaseUser?.uid)
      setUserEmail(firebaseUser?.email)
    })
    return () => unsubscribe()
  }, [])
  
  // Only run the queries if userId is available
  const userData = useQuery(
    api.userQueries.getUser,
    userId ? { userId } : "skip"
  );
  
  // Update form data with user information when it loads
  useEffect(() => {
    if (userData) {
      setFormData(prev => ({
        ...prev,
        name: userData?.name || '',
        email: userData?.email || '',
        username: userData?.username || '',
        referralCode: userData?.referralCode || '',
        referredBy: prev.referredBy || userData?.referredBy || '',
        image: userData?.image || firebaseUser?.photoURL || ''
      }));
      setOriginalFormData(prev => ({
        ...prev,
        name: userData?.name || '',
        email: userData?.email || '',
        username: userData?.username || '',
        referralCode: userData?.referralCode || '',
        referredBy: prev.referredBy || userData?.referredBy || '',
        image: userData?.image || firebaseUser?.photoURL || ''
      }));
    }
  }, [userData, firebaseUser?.photoURL, setFormData]);
  
  const updateUser = useMutation(api.userMutations.create_user);
  
  // Handle edit mode toggle
  const handleEdit = () => {
    setOriginalFormData(formData);
    setIsEditMode(true);
  };
  
  // Handle cancel edit
  const handleCancel = () => {
    setFormData(originalFormData);
    setIsEditMode(false);
  };
  
  // Always call the referrerQuery hook, passing 'skip' if referredBy is not present
  const referrerQuery = useQuery(
    api.userQueries.getUser,
    formData.referredBy ? { userId: formData.referredBy } : 'skip'
  );
  const referrerName = referrerQuery?.name || '';
  const referrerLoading = !!formData.referredBy && !referrerQuery;

  // Show loading if userId is not yet loaded
  if (!userId) {
    return <FormSkeleton />;
  }

  return (
    <div className="space-y-12">
      {/* Profile Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-light tracking-tight text-foreground">Profile</h2>
            <p className="text-muted-foreground">Your personal information and account details</p>
          </div>
          
          {!isEditMode ? (
            <Button
              variant="ghost"
              onClick={handleEdit}
              className="text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={handleCancel}
                disabled={isUpdating}
                className="text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={(e) => handleProfileUpdate(e, formData, setIsUpdating, setFormData, updateUser, userId, userEmail, setIsEditMode, firebaseUser?.photoURL)}
                disabled={isUpdating}
                className="bg-foreground text-background hover:bg-foreground/90 transition-colors duration-200"
              >
                <Save className="w-4 h-4 mr-2" />
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </div>

        {/* Status Indicator */}
        {isEditMode && (
          <div className="h-px bg-gradient-to-r from-transparent via-blue-400/60 to-transparent" />
        )}

        <form onSubmit={(e) => {
          if (!isEditMode) {
            e.preventDefault();
            return;
          }
          handleProfileUpdate(e, formData, setIsUpdating, setFormData, updateUser, userId, userEmail, setIsEditMode, firebaseUser?.photoURL);
        }}>
          <div className="space-y-8">
            <ProfileFields formData={formData} setFormData={setFormData} isEditMode={isEditMode} />
            
            <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
            
            <ReferralFields formData={formData} referrerName={referrerName} referrerLoading={referrerLoading} />
          </div>
        </form>
      </div>

      {/* Language Section */}
      <div className="space-y-6">
        <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
        <LanguageSelector />
      </div>

    </div>
  )
}

function FormSkeleton() {
  return (
    <div className="space-y-12">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-5 w-64" />
          </div>
          <Skeleton className="h-9 w-20" />
        </div>
        
        <div className="space-y-8">
          <div className="space-y-6">
            <div className="space-y-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
          
          <div className="h-px bg-gradient-to-r from-transparent via-border/30 to-transparent" />
          
          <div className="space-y-6">
            <div className="space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccountTab
