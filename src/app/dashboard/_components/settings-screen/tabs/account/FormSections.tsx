import React from 'react';
import { ReadOnlyField, ReadOnlyTextArea } from './ReadOnlyField';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const MAX_PERSONA_LENGTH = 500;
const MAX_VISION_LENGTH = 500;

// Explicit interfaces for props
export interface ProfileFieldsProps {
  formData: {
    name: string;
    email: string;
    username: string;
    referralCode: string;
    referredBy: string;
    currentPersona: string;
    futureVision: string;
    image?: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  isEditMode: boolean;
}

export interface ReferralFieldsProps {
  formData: {
    referralCode: string;
    referredBy: string;
  };
  referrerName?: string;
  referrerLoading?: boolean;
}

export interface PersonaFieldsProps {
  formData: {
    currentPersona: string;
    futureVision: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  isEditMode: boolean;
  showPersonaFields: boolean;
  setShowPersonaFields: (val: boolean) => void;
}

// Profile fields section
export const ProfileFields = ({ formData, setFormData, isEditMode }: ProfileFieldsProps) => (
  <>
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
          onChange={(e) => setFormData((prev: any) => ({ ...prev, name: e.target.value }))}
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
          onChange={(e) => setFormData((prev: any) => ({ ...prev, username: e.target.value }))}
        />
      </div>
    ) : (
      <ReadOnlyField label="Username" value={formData.username} />
    )}
  </>
);

// Referral fields section
export const ReferralFields = ({ formData, referrerName = '', referrerLoading = false }: ReferralFieldsProps) => (
  <>
    {/* Referral Code (always read-only with copy) */}
    <ReadOnlyField 
      label="Your Referral Code" 
      value={formData.referralCode} 
      showCopy={!!formData.referralCode}
      helperText={formData.referralCode ? "Share this code with friends to invite them" : undefined}
    />
    {/* Referred By (always read-only) */}
    <ReadOnlyField 
      label="Referred By" 
      value={referrerLoading ? 'Loading...' : referrerName ? referrerName : ''}
    />
  </>
);

// Persona fields section
export const PersonaFields = ({ formData, setFormData, isEditMode, showPersonaFields, setShowPersonaFields }: PersonaFieldsProps) => (
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
            <label className="text-sm font-medium">Current Persona</label>
            <textarea
              className="w-full mt-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-y min-h-[100px] text-base bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Describe who you are today..."
              value={formData.currentPersona}
              onChange={(e) => setFormData((prev: any) => ({ ...prev, currentPersona: e.target.value }))}
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
            <label className="text-sm font-medium">Future Vision</label>
            <textarea
              className="w-full mt-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-y min-h-[100px] text-base bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Describe your goals and aspirations..."
              value={formData.futureVision}
              onChange={(e) => setFormData((prev: any) => ({ ...prev, futureVision: e.target.value }))}
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
); 