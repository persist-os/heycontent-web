import React, { useEffect, useState } from 'react';
import { PersonaData } from '../types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface PersonaCardProps {
  persona: PersonaData;
  userId: string;
  variant?: 'default' | 'compact';
}

export const PersonaCard: React.FC<PersonaCardProps> = ({ persona, userId, variant = 'default' }) => {
  // Safety check for required props
  if (!persona || !userId) {
    console.warn('PersonaCard: Missing required props', { hasPersona: !!persona, hasUserId: !!userId });
    return null;
  }

  const PersonaSection = ({ title, description, children }: { 
    title: string; 
    description?: string;
    children: React.ReactNode 
  }) => (
    <div className={`space-y-4 ${variant === 'compact' ? 'space-y-3' : 'space-y-4'}`}>
      <div className="space-y-1">
        <h3 className={`font-bold text-[#4715C8] dark:text-[#4715C8] border-b border-[#BAA9FC]/30 pb-2 ${
          variant === 'compact' ? 'text-base' : 'text-lg'
        }`}>
          {title}
        </h3>
        {description && (
          <p className={`text-gray-500 dark:text-gray-400 ${
            variant === 'compact' ? 'text-xs' : 'text-sm'
          }`}>
            {description}
          </p>
        )}
      </div>
      <div className={`space-y-3 ${variant === 'compact' ? 'space-y-2' : 'space-y-3'}`}>
        {children}
      </div>
    </div>
  );

  const InfoItem = ({ label, value }: { label: string; value: string | string[] | undefined }) => {
    if (!value || (Array.isArray(value) && value.length === 0)) return null;
    
    return (
      <div className="space-y-2">
        <span className={`block font-medium text-[#4715C8] uppercase tracking-wide leading-tight ${
          variant === 'compact' ? 'text-xs' : 'text-sm'
        }`}>
          {label}
        </span>
        <div className="text-gray-700 dark:text-gray-300">
          {Array.isArray(value) ? (
            <div className="flex flex-wrap gap-1.5">
              {value.map((item, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className={`bg-[#4715C8]/10 text-[#4715C8] border-[#4715C8]/30 hover:bg-[#4715C8]/20 rounded-full transition-colors ${
                    variant === 'compact' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
                  }`}
                >
                  {item}
                </Badge>
              ))}
            </div>
          ) : (
            <p className={`leading-relaxed text-gray-800 dark:text-gray-200 ${
              variant === 'compact' ? 'text-sm' : 'text-base'
            }`}>
              {value}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`w-full ${variant === 'compact' ? 'space-y-6' : 'space-y-8'}`}>
      {/* Header Section */}
      <div className={`text-center space-y-4 p-6 bg-gradient-to-br from-[#4715C8]/5 via-[#BAA9FC]/8 to-[#4715C8]/5 rounded-2xl border border-[#BAA9FC]/20 shadow-sm ${
        variant === 'compact' ? 'p-4 space-y-3' : 'p-6 space-y-4'
      }`}>
        <div className="space-y-3">
          <h2 className={`font-black text-[#4715C8] dark:text-[#4715C8] tracking-tight leading-tight ${
            variant === 'compact' ? 'text-xl' : 'text-3xl'
          }`}>
            {persona.current_name}
          </h2>
          <p className={`text-gray-600 dark:text-gray-400 leading-relaxed max-w-3xl mx-auto ${
            variant === 'compact' ? 'text-sm' : 'text-lg'
          }`}>
            {persona.current_description}
          </p>
        </div>
      </div>

      {/* Persona Details Grid */}
      <div className={`grid gap-8 ${
        variant === 'compact' 
          ? 'grid-cols-1 gap-6' 
          : 'grid-cols-1 lg:grid-cols-2 gap-8'
      }`}>
        {/* Identity & Audience */}
        <PersonaSection 
          title="Creator Identity" 
          description="Current style and audience focus"
        >
          <InfoItem label="Experience Level" value={persona.experience_level} />
          <InfoItem label="Content Formats" value={persona.content_formats} />
          <InfoItem label="Tone" value={persona.content_tone} />
          <InfoItem label="Voice" value={persona.content_voice} />
          <InfoItem label="Unique Value" value={persona.unique_value} />
          <InfoItem label="Audience Type" value={persona.audience_type} />
        </PersonaSection>

        {/* Content Pillars */}
        <PersonaSection 
          title="Content Pillars" 
          description="Core themes and recurring topics"
        >
          <InfoItem label="Pillars" value={persona.content_pillars} />
        </PersonaSection>

        {/* Future Vision */}
        <PersonaSection 
          title="Future Vision" 
          description="Where your content journey is heading"
        >
          <InfoItem label="Future Persona" value={persona.future_name} />
          <InfoItem label="Vision Description" value={persona.future_description} />
          <InfoItem label="Desired Impact" value={persona.desired_impact} />
          <InfoItem label="Goals" value={persona.goals} />
        </PersonaSection>

        {/* Content Strategy */}
        <PersonaSection 
          title="Content Strategy" 
          description="Topic approach and audience engagement"
        >
          <InfoItem label="Primary Topics" value={persona.primary_topics} />
          <InfoItem label="Secondary Topics" value={persona.secondary_topics} />
          <InfoItem label="Engagement Style" value={persona.engagement_style} />
        </PersonaSection>

        {/* Style & Voice - Full Width */}
        <div className={variant === 'compact' ? '' : 'lg:col-span-2'}>
          <PersonaSection 
            title="Creative Signature" 
            description="The unique fingerprint of your content"
          >
            <div className={`grid gap-6 ${variant === 'compact' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
              <InfoItem label="Tone Descriptors" value={persona.tone_descriptors} />
              <InfoItem label="Style Descriptors" value={persona.style_descriptors} />
            </div>
          </PersonaSection>
        </div>
      </div>
    </div>
  );
}; 