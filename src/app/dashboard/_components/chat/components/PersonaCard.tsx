import React, { useEffect, useState } from 'react';
import { PersonaData } from '../types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface PersonaCardProps {
  persona: PersonaData;
  userId: string;
}

export const PersonaCard: React.FC<PersonaCardProps> = ({ persona, userId }) => {
  console.log('PersonaCard rendered', { persona, userId });

  const PersonaSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-[#4715C8] dark:text-[#4715C8] border-b border-[#BAA9FC]/20 pb-2">
        {title}
      </h3>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  );

  const InfoItem = ({ label, value }: { label: string; value: string | string[] | undefined }) => {
    if (!value || (Array.isArray(value) && value.length === 0)) return null;
    
    return (
      <div className="flex flex-col space-y-1">
        <span className="text-sm font-medium text-[#4715C8] uppercase tracking-wide">
          {label}
        </span>
        <div className="text-gray-700 dark:text-gray-300">
          {Array.isArray(value) ? (
            <div className="flex flex-wrap gap-1">
              {value.map((item, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="bg-[#4715C8]/10 text-[#4715C8] border-[#4715C8] hover:bg-[#4715C8]/20 rounded-full px-3 py-1"
                >
                  {item}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-base leading-relaxed">{value}</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-6">
      {/* Header Section */}
      <div className="text-center space-y-4 p-6 bg-gradient-to-br from-[#BAA9FC]/5 to-[#BAA9FC]/10 rounded-xl border border-[#BAA9FC]/20">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-[#4715C8] dark:text-[#4715C8]">
            {persona.current_name}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl mx-auto">
            {persona.current_description}
          </p>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Current Identity */}
        <PersonaSection title="Current Identity">
          <InfoItem label="Experience Level" value={persona.experience_level} />
          <InfoItem label="Content Formats" value={persona.content_formats} />
          <InfoItem label="Content Tone" value={persona.content_tone} />
          <InfoItem label="Content Voice" value={persona.content_voice} />
          <InfoItem label="Unique Value" value={persona.unique_value} />
          <InfoItem label="Audience Type" value={persona.audience_type} />
        </PersonaSection>

        {/* Future Vision */}
        <PersonaSection title="Future Vision">
          <InfoItem label="Future Name" value={persona.future_name} />
          <InfoItem label="Future Description" value={persona.future_description} />
          <InfoItem label="Desired Impact" value={persona.desired_impact} />
        </PersonaSection>

        {/* Content Strategy */}
        <PersonaSection title="Content Strategy">
          <InfoItem label="Primary Topics" value={persona.primary_topics} />
          <InfoItem label="Secondary Topics" value={persona.secondary_topics} />
          <InfoItem label="Engagement Style" value={persona.engagement_style} />
        </PersonaSection>

        {/* Style & Voice */}
        <PersonaSection title="Style & Voice">
          <InfoItem label="Tone Descriptors" value={persona.tone_descriptors} />
          <InfoItem label="Style Descriptors" value={persona.style_descriptors} />
        </PersonaSection>
      </div>
    </div>
  );
}; 