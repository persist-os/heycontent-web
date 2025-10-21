import React from 'react';
import { ReadOnlyField, ReadOnlyTextArea } from './ReadOnlyField';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { T } from '@/components/translation/T';

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
        <label htmlFor="name" className="text-sm font-medium">
          <T context="field.label.name">Name</T>
        </label>
        <Input
          type="text"
          value={formData.name}
          onChange={e => setFormData({...formData, name: e.target.value})}
          disabled={!isEditMode}
          className="w-full mt-1 p-3 border border-border rounded-lg text-base bg-card focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
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
        <label htmlFor="username" className="text-sm font-medium">
          <T context="field.label.username">Username</T>
        </label>
        <Input
          type="text"
          value={formData.username}
          onChange={e => setFormData({...formData, username: e.target.value})}
          disabled={!isEditMode}
          className="w-full mt-1 p-3 border border-border rounded-lg text-base bg-card focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
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
      value={formData.referralCode || "Loading..."} 
      showCopy={!!formData.referralCode}
      helperText={formData.referralCode ? "Share this code with friends to invite them" : "Your referral code is being generated..."}
      translateLabel={true}
      translateHelper={true}
    />
    {/* Referred By (always read-only) */}
    <ReadOnlyField 
      label="Referred By" 
      value={referrerLoading ? 'Loading...' : referrerName ? referrerName : ''}
      translateLabel={true}
    />
  </>
);

// Persona fields section
export const PersonaFields = ({ formData, setFormData, isEditMode, showPersonaFields, setShowPersonaFields }: PersonaFieldsProps) => (
  <div className="mt-6 space-y-4">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-muted/50 rounded-lg">
      <div>
        <h3 className="font-medium">
          <T context="settings.persona.title">Persona Information</T>
        </h3>
        <p className="text-sm text-muted-foreground">
          <T context="settings.persona.subtitle">Help Content understand your journey and goals</T>
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setShowPersonaFields(!showPersonaFields)}
        className="w-full sm:w-auto"
      >
        {showPersonaFields ? <T context="button.hide">Hide</T> : <T context="button.show">Show</T>} <T context="settings.persona.fields">Persona Fields</T>
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
            <label className="text-sm font-medium">
              <T context="field.label.current_persona">Current Persona</T>
            </label>
            <Textarea
              placeholder="Describe your current persona..."
              value={formData.currentPersona}
              onChange={e => setFormData({...formData, currentPersona: e.target.value})}
              disabled={!isEditMode}
              rows={4}
              className="w-full mt-1 p-3 border border-border rounded-lg resize-y min-h-[100px] text-base bg-card focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
            />
          </div>
        ) : (
          <ReadOnlyTextArea 
            label="Current Persona" 
            value={formData.currentPersona}
            characterCount={`${formData.currentPersona.length}/${MAX_PERSONA_LENGTH}`}
            translateLabel={true}
          />
        )}
        {/* Future Vision */}
        {isEditMode ? (
          <div>
            <label className="text-sm font-medium">
              <T context="field.label.future_vision">Future Vision</T>
            </label>
            <Textarea
              placeholder="Describe your future vision..."
              value={formData.futureVision}
              onChange={e => setFormData({...formData, futureVision: e.target.value})}
              disabled={!isEditMode}
              rows={4}
              className="w-full mt-1 p-3 border border-border rounded-lg resize-y min-h-[100px] text-base bg-card focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
            />
          </div>
        ) : (
          <ReadOnlyTextArea 
            label="Future Vision" 
            value={formData.futureVision}
            characterCount={`${formData.futureVision.length}/${MAX_VISION_LENGTH}`}
            translateLabel={true}
          />
        )}
      </div>
    )}
  </div>
); 