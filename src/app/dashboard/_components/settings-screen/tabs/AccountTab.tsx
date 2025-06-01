// File: app/(dashboard)/_components/settings-screen/tabs/AccountTab.tsx
import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { getFirebaseAuth } from '@/app/lib/firebase'
import { handleResendVerification } from '../utils'
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { onAuthStateChanged } from 'firebase/auth';

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
  email: string | undefined
) {
  e.preventDefault();
  setIsUpdating(true);
  try {
    if (!userId) {
      console.error('No user ID found. Cannot update profile.');
      setIsUpdating(false);
      return;
    }
    
    // Update both persona and user information
    try {
      // Update persona data
      await updatePersona({
        userId,
        preferredName: formData.name,
        currentPersona: formData.currentPersona,
        futureVision: formData.futureVision
      });
      
      // Update user data (name, username)
      if (email) {
        await updateUser({
          userId,
          name: formData.name,
          email,
          username: formData.username,
          // Pass image if it exists in the current user object
          image: undefined
        });
      }
      
      // Optionally, you could show a success message here
    } catch (error) {
      // Handle error (show toast, etc.)
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
  // Add state for edit mode
  const [isEditMode, setIsEditMode] = React.useState(false);
  
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
      setFormData(prev => ({
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
        referredBy: userData?.referredBy || ''
      }));
    }
  }, [userData, setFormData]);
  const updatePersona = useMutation(api.personas.createPersona);
  const updateUser = useMutation(api.userMutations.create_user);
  // Show loading if userId is not yet loaded
  if (!userId) {
    return <div className="flex justify-center items-center min-h-[200px]">Loading user info...</div>;
  }

  return (
    <div className="grid gap-4 sm:gap-6 max-w-full">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg sm:text-xl">Profile Information</CardTitle>
              <div className="flex items-center gap-2 ml-4">
                <span className="text-sm text-gray-500">{isEditMode ? 'Edit Mode' : 'View Mode'}</span>
                <Switch
                  checked={isEditMode}
                  onCheckedChange={setIsEditMode}
                />
              </div>
            </div>
            {userEmail ? (
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
        <form onSubmit={(e) => handleProfileUpdate(e, formData, setIsUpdating, setFormData, updatePersona, updateUser, userId, userEmail)}>
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
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <Button type="submit" disabled={isUpdating || !isEditMode} className="w-full sm:w-auto">
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default AccountTab
