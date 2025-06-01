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

// Component for read-only field display
const ReadOnlyField: React.FC<{
  label: string;
  value: string;
  showCopy?: boolean;
  copyText?: string;
  helperText?: string;
}> = ({ label, value, showCopy = false, copyText, helperText }) => (
  <div className="space-y-1">
    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
    <div className="relative">
      <div className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-base border-0 min-h-[42px] flex items-center text-gray-900 dark:text-gray-100">
        {value || <span className="text-gray-400">Not provided</span>}
      </div>
      {showCopy && value && (
        <Button 
          type="button" 
          variant="ghost" 
          size="sm"
          className="absolute right-1 top-1 h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
          onClick={() => {
            navigator.clipboard.writeText(copyText || value);
            // You could add a toast notification here
          }}
        >
          <Copy className="h-3 w-3" />
        </Button>
      )}
    </div>
    {helperText && (
      <p className="text-xs text-gray-500 dark:text-gray-400">{helperText}</p>
    )}
  </div>
)

// Component for read-only textarea display
const ReadOnlyTextArea: React.FC<{
  label: string;
  value: string;
  characterCount?: string;
}> = ({ label, value, characterCount }) => (
  <div className="space-y-1">
    <div className="flex justify-between items-center">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      {characterCount && (
        <span className="text-sm text-gray-500">{characterCount}</span>
      )}
    </div>
    <div className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-base border-0 min-h-[100px] text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
      {value || <span className="text-gray-400">Not provided</span>}
    </div>
  </div>
)

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
      const newData = {
        ...formData,
        currentPersona: personaData?.currentPersona || '',
        futureVision: personaData?.futureVision || ''
      };
      setFormData(newData);
      setOriginalFormData(newData);
    }
  }, [personaData]);
  
  // Update form data with user information when it loads
  useEffect(() => {
    if (userData) {
      const newData = {
        ...formData,
        name: userData?.name || '',
        email: userData?.email || '',
        username: userData?.username || '',
        referralCode: userData?.referralCode || '',
        referredBy: userData?.referredBy || '',
        image: userData?.image || user?.photoURL || ''
      };
      setFormData(newData);
      setOriginalFormData(newData);
    }
  }, [userData]);
  
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
            <form onSubmit={(e) => handleProfileUpdate(e, formData, setIsUpdating, setFormData, updatePersona, updateUser, userId, userEmail, setIsEditMode, user?.photoURL)}>
              <div className="grid grid-cols-1 gap-4">
                {/* Name Field */}
                {isEditMode ? (
                  <div>
                    <label htmlFor="name" className="text-sm font-medium">Name</label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      className="w-full mt-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-base bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Your name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                ) : (
                  <ReadOnlyField label="Name" value={formData.name} />
                )}

                {/* Email Field (always read-only) */}
                <ReadOnlyField label="Email" value={formData.email} />

                {/* Username Field */}
                {isEditMode ? (
                  <div>
                    <label htmlFor="username" className="text-sm font-medium">Username</label>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      className="w-full mt-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-base bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Your username"
                      value={formData.username}
                      onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    />
                  </div>
                ) : (
                  <ReadOnlyField label="Username" value={formData.username} />
                )}

                {/* Referral Code (always read-only with copy) */}
                <ReadOnlyField 
                  label="Your Referral Code" 
                  value={formData.referralCode} 
                  showCopy={!!formData.referralCode}
                  helperText={formData.referralCode ? "Share this code with friends to invite them" : undefined}
                />

                {/* Referred By (always read-only) */}
                <ReadOnlyField label="Referred By" value={formData.referredBy} />
              </div>

              {/* AI Persona Section */}
              <div className="mt-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <h3 className="text-sm font-medium">AI Persona Understanding</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Help Content understand your journey and goals</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPersonaFields(!showPersonaFields)}
                    className="w-full sm:w-auto"
                  >
                    {showPersonaFields ? 'Hide' : 'Show'} Persona Fields
                  </Button>
                </div>

                {showPersonaFields && (
                  <div className={cn(
                    "space-y-4 transition-all duration-300 ease-in-out",
                    showPersonaFields ? "opacity-100 max-h-none" : "opacity-0 max-h-0 overflow-hidden"
                  )}>
                    {/* Current Persona */}
                    {isEditMode ? (
                      <div>
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-medium">Current Persona</label>
                          <span className="text-sm text-gray-500">{formData.currentPersona.length}/{MAX_PERSONA_LENGTH}</span>
                        </div>
                        <textarea
                          className="w-full mt-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-y min-h-[100px] text-base bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Describe who you are today..."
                          value={formData.currentPersona}
                          onChange={(e) => {
                            if (e.target.value.length <= MAX_PERSONA_LENGTH) {
                              setFormData(prev => ({ ...prev, currentPersona: e.target.value }))
                            }
                          }}
                          maxLength={MAX_PERSONA_LENGTH}
                        />
                      </div>
                    ) : (
                      <ReadOnlyTextArea 
                        label="Current Persona" 
                        value={formData.currentPersona}
                        characterCount={`${formData.currentPersona.length}/${MAX_PERSONA_LENGTH}`}
                      />
                    )}

                    {/* Future Vision */}
                    {isEditMode ? (
                      <div>
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-medium">Future Vision</label>
                          <span className="text-sm text-gray-500">{formData.futureVision.length}/{MAX_VISION_LENGTH}</span>
                        </div>
                        <textarea
                          className="w-full mt-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-y min-h-[100px] text-base bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Describe your goals and aspirations..."
                          value={formData.futureVision}
                          onChange={(e) => {
                            if (e.target.value.length <= MAX_VISION_LENGTH) {
                              setFormData(prev => ({ ...prev, futureVision: e.target.value }))
                            }
                          }}
                          maxLength={MAX_VISION_LENGTH}
                        />
                      </div>
                    ) : (
                      <ReadOnlyTextArea 
                        label="Future Vision" 
                        value={formData.futureVision}
                        characterCount={`${formData.futureVision.length}/${MAX_VISION_LENGTH}`}
                      />
                    )}
                  </div>
                )}
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AccountTab
