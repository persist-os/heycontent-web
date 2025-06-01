// File: app/(dashboard)/_components/settings-screen/tabs/AccountTab.tsx
import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
<<<<<<< HEAD
import { Switch } from '@/components/ui/switch'
import { getFirebaseAuth } from '@/app/lib/firebase' // Only call inside useEffect or event handlers
import { handleResendVerification } from '../utils'
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { User, onAuthStateChanged } from 'firebase/auth';
=======
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
>>>>>>> dc27aec84c6b547859451d75f2df78a7b1adf6a7

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
  const { user } = useAuth();
  // Add state for edit mode
  const [isEditMode, setIsEditMode] = React.useState(false);
<<<<<<< HEAD

  // State for Firebase user
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Properly fetch persona data using the useQuery hook at component level
  const userId = firebaseUser?.uid;

=======
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
  
>>>>>>> dc27aec84c6b547859451d75f2df78a7b1adf6a7
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
      setFormData(prev => ({
        ...prev,
        currentPersona: personaData?.currentPersona || '',
        futureVision: personaData?.futureVision || ''
      }));
      setOriginalFormData(prev => ({
        ...prev,
        currentPersona: personaData?.currentPersona || '',
        futureVision: personaData?.futureVision || ''
      }));
    }
  }, [personaData, setFormData]);
  
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
        image: userData?.image || user?.photoURL || ''
      }));
      setOriginalFormData(prev => ({
        ...prev,
        name: userData?.name || '',
        email: userData?.email || '',
        username: userData?.username || '',
        referralCode: userData?.referralCode || '',
        referredBy: prev.referredBy || userData?.referredBy || '',
        image: userData?.image || user?.photoURL || ''
      }));
    }
  }, [userData, user?.photoURL, setFormData]);
  
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
<<<<<<< HEAD
              <div className="flex items-center gap-2 ml-4">
                <span className="text-sm text-gray-500">{isEditMode ? 'Edit Mode' : 'View Mode'}</span>
                <Switch
                  checked={isEditMode}
                  onCheckedChange={setIsEditMode}
                />
              </div>
            </div>
            {firebaseUser ? (
              <Badge variant="success">Verified</Badge>
            ) : (
              <div className="flex items-center gap-2">
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
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
        <form onSubmit={(e) => handleProfileUpdate(e, formData, setIsUpdating, setFormData, updatePersona, updateUser, userId, formData.email)}>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label htmlFor="name" className="text-sm font-medium">Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  className="w-full mt-1 p-2 border rounded-lg text-base"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  disabled={!isEditMode}
                />
              </div>
              <div>
                <label htmlFor="email" className="text-sm font-medium">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="w-full mt-1 p-2 border rounded-lg text-base"
                  placeholder="your@email.com"
                  value={formData.email}
                  disabled
                />
              </div>
              <div>
                <label htmlFor="username" className="text-sm font-medium">Username</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  className="w-full mt-1 p-2 border rounded-lg text-base"
                  placeholder="Your username"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  disabled={!isEditMode}
                />
              </div>
              <div>
                <label htmlFor="referralCode" className="text-sm font-medium">Your Referral Code</label>
                <div className="relative">
                  <input
                    id="referralCode"
                    name="referralCode"
                    type="text"
                    className="w-full mt-1 p-2 border rounded-lg text-base pr-16"
                    value={formData.referralCode}
                    disabled
                  />
                  {formData.referralCode && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="absolute right-1 top-1 h-8 px-2"
                      onClick={() => {
                        navigator.clipboard.writeText(formData.referralCode);
                        // You could add a toast notification here
                      }}
                    >
                      Copy
                    </Button>
                  )}
                </div>
                {formData.referralCode && (
                  <p className="text-xs text-gray-500 mt-1">Share this code with friends to invite them</p>
                )}
              </div>
              <div>
                <label htmlFor="referredBy" className="text-sm font-medium">Referred By</label>
                <input
                  id="referredBy"
                  name="referredBy"
                  type="text"
                  className="w-full mt-1 p-2 border rounded-lg text-base"
                  value={formData.referredBy}
                  disabled
                />
              </div>
            </div>
            <div className="mt-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-medium">AI Persona Understanding</h3>
                  <p className="text-sm text-gray-600">Help Content understand your journey and goals</p>
                </div>
                <Switch
                  checked={showPersonaFields}
                  onCheckedChange={setShowPersonaFields}
                />
              </div>

              {showPersonaFields && (
                <>
                  <div>
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium">Current Persona</label>
                      <span className="text-sm text-gray-500">{formData.currentPersona.length}/{MAX_PERSONA_LENGTH}</span>
                    </div>
                    <textarea
                      className="w-full mt-1 p-2 border rounded-lg resize-y min-h-[100px] text-base"
                      placeholder="Describe who you are today..."
                      value={formData.currentPersona}
                      onChange={(e) => {
                        if (e.target.value.length <= MAX_PERSONA_LENGTH) {
                          setFormData(prev => ({ ...prev, currentPersona: e.target.value }))
                        }
                      }}
                      maxLength={MAX_PERSONA_LENGTH}
                      disabled={!isEditMode}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium">Future Vision</label>
                      <span className="text-sm text-gray-500">{formData.futureVision.length}/{MAX_VISION_LENGTH}</span>
                    </div>
                    <textarea
                      className="w-full mt-1 p-2 border rounded-lg resize-y min-h-[100px] text-base"
                      placeholder="Describe your goals and aspirations..."
                      value={formData.futureVision}
                      onChange={(e) => {
                        if (e.target.value.length <= MAX_VISION_LENGTH) {
                          setFormData(prev => ({ ...prev, futureVision: e.target.value }))
                        }
                      }}
                      maxLength={MAX_VISION_LENGTH}
                      disabled={!isEditMode}
                    />
                  </div>
                </>
=======
              {isEditMode && (
                <Badge variant="default" className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                  <Edit2 className="w-3 h-3 mr-1" />
                  Editing
                </Badge>
>>>>>>> dc27aec84c6b547859451d75f2df78a7b1adf6a7
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
                      onClick={(e) => handleProfileUpdate(e, formData, setIsUpdating, setFormData, updatePersona, updateUser, userId, userEmail, setIsEditMode, user?.photoURL)}
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
              handleProfileUpdate(e, formData, setIsUpdating, setFormData, updatePersona, updateUser, userId, userEmail, setIsEditMode, user?.photoURL);
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
    </div>
  )
}

export default AccountTab
