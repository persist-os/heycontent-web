// File: app/(dashboard)/_components/settings-screen/tabs/AccountTab.tsx
import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getFirebaseAuth } from '@/app/lib/firebase'
import { handleResendVerification } from '../utils'
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { onAuthStateChanged } from 'firebase/auth';
import { Edit2, Save, X, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/app/context/auth-context'
import { ReadOnlyField, ReadOnlyTextArea } from './account/ReadOnlyField'
import { ProfileFields, ReferralFields, PersonaFields } from './account/FormSections'
import { PersonaData } from '../../chat/types';

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
  updatePersona: ReturnType<typeof useMutation>,
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
      await updatePersona({
        userId,
        preferredName: formData.name,
        currentPersona: formData.currentPersona,
        futureVision: formData.futureVision
      });
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
  
  // Properly fetch persona data using the useQuery hook at component level
  const [userId, setUserId] = useState<string | undefined>()
  const [userEmail, setUserEmail] = useState<string | undefined>()
  useEffect(() => {
    let auth
    try {
      auth = getFirebaseAuth()
    } catch (e) {
      auth = null
    }
    if (!auth) return
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUserId(firebaseUser?.uid)
      setUserEmail(firebaseUser?.email)
    })
    return () => unsubscribe()
  }, [])
  
  // Only run the queries if userId is available
  const personaData = useQuery(
    api.personas.getPersona,
    userId ? { userId } : "skip"
  );
  const userData = useQuery(
    api.userQueries.getUser,
    userId ? { userId } : "skip"
  );
  
  // Update form data when persona data and user data load
  useEffect(() => {
    if (personaData) {
      setPersonaDetails(personaData as PersonaData);
      setFormData(prev => ({
        ...prev,
        currentPersona: personaData.current_name || '',
        futureVision: personaData.future_description || ''
      }));
      setOriginalFormData(prev => ({
        ...prev,
        currentPersona: personaData.current_name || '',
        futureVision: personaData.future_description || ''
      }));
    }
  }, [personaData, setFormData]);
  
  // Add a new state to hold the full persona object
  const [personaDetails, setPersonaDetails] = useState<PersonaData | null>(null);
  
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
  
  const updatePersona = useMutation(api.personas.createPersona);
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
    return <div className="flex justify-center items-center min-h-[200px]">Loading user info...</div>;
  }

  return (
    <div className="grid gap-4 sm:gap-6 max-w-full">
      <Card className={cn(
        "transition-all duration-300 ease-in-out",
        isEditMode 
          ? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800" 
          : "bg-white dark:bg-gray-900"
      )}>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
            <div className="flex items-center gap-3">
              <CardTitle className="text-lg sm:text-xl">Profile Information</CardTitle>
              {isEditMode && (
                <Badge variant="default" className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                  <Edit2 className="w-3 h-3 mr-1" />
                  Editing
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {userEmail ? (
                <Badge variant="default" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                  Verified
                </Badge>
              ) : (
                <>
                  <Badge variant="destructive">Unverified</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResendVerification(setIsResending)}
                    disabled={isResending}
                    className="w-full sm:w-auto"
                  >
                    {isResending ? 'Sending...' : 'Resend Verification'}
                  </Button>
                </>
              )}
              
              {/* Edit/Save/Cancel Controls */}
              <div className="flex items-center gap-2 ml-2">
                {!isEditMode ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEdit}
                    className="flex items-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Edit</span>
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                      disabled={isUpdating}
                      className="flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      <span className="hidden sm:inline">Cancel</span>
                    </Button>
                    <Button
                      size="sm"
                      onClick={(e) => handleProfileUpdate(e, formData, setIsUpdating, setFormData, updatePersona, updateUser, userId, userEmail, setIsEditMode, firebaseUser?.photoURL)}
                      disabled={isUpdating}
                      className="flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      <span className="hidden sm:inline">{isUpdating ? 'Saving...' : 'Save'}</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className={cn(
            "transition-all duration-300 ease-in-out",
            isEditMode ? "opacity-100" : "opacity-100"
          )}>
            <form onSubmit={(e) => {
              if (!isEditMode) {
                e.preventDefault();
                return;
              }
              handleProfileUpdate(e, formData, setIsUpdating, setFormData, updatePersona, updateUser, userId, userEmail, setIsEditMode, firebaseUser?.photoURL);
            }}>
              <div className="grid grid-cols-1 gap-4">
                <ProfileFields formData={formData} setFormData={setFormData} isEditMode={isEditMode} />
                <ReferralFields formData={formData} referrerName={referrerName} referrerLoading={referrerLoading} />
                <PersonaFields formData={formData} setFormData={setFormData} isEditMode={isEditMode} showPersonaFields={showPersonaFields} setShowPersonaFields={setShowPersonaFields} />
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
      {personaDetails && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Your AI Persona</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(personaDetails).map(([key, value]) => (
                <div key={key} className="flex flex-col">
                  <span className="font-semibold text-sm capitalize">{key.replace(/_/g, ' ')}</span>
                  <span className="text-gray-800 dark:text-gray-200 text-base">
                    {Array.isArray(value) ? value.join(', ') : (value ?? '—')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default AccountTab
