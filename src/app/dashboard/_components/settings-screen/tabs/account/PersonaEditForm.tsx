import React, { useCallback } from 'react';
import { PersonaData } from '../../../chat/types';
import { Badge } from '@/components/ui/badge';

interface PersonaEditFormProps {
  persona: PersonaData;
  onUpdate: (field: keyof PersonaData, value: string | string[]) => void;
}

const PersonaSection = React.memo(({ title, description, children }: { 
  title: string; 
  description?: string;
  children: React.ReactNode 
}) => (
  <div className="space-y-4">
    <div className="space-y-1">
      <h3 className="font-bold text-[#4715C8] dark:text-[#4715C8] border-b border-[#BAA9FC]/30 pb-2 text-lg">
        {title}
      </h3>
      {description && (
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          {description}
        </p>
      )}
    </div>
    <div className="space-y-3">
      {children}
    </div>
  </div>
));

PersonaSection.displayName = 'PersonaSection';

const EditableField = React.memo(({ label, value, onChange, isArray = false }: { 
  label: string; 
  value: string | string[]; 
  onChange: (value: string) => void;
  isArray?: boolean;
}) => {
  const displayValue = isArray && Array.isArray(value) ? value.join(', ') : String(value || '');

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  return (
    <div className="space-y-2">
      <label className="block font-medium text-[#4715C8] uppercase tracking-wide leading-tight text-sm" htmlFor={label}>
        {label}
      </label>
      <div className="text-gray-700 dark:text-gray-300">
        {isArray ? (
          <div className="space-y-2">
            <input
              id={label}
              type="text"
              value={displayValue}
              onChange={handleChange}
              className="w-full px-4 py-3 text-base bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4715C8] focus:border-[#4715C8] transition-colors"
              placeholder="Separate items with commas"
              autoComplete="off"
              spellCheck={false}
            />
            {value && Array.isArray(value) && value.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {value.map((item, index) => (
                  <Badge 
                    key={index} 
                    variant="outline" 
                    className="bg-[#4715C8]/10 text-[#4715C8] border-[#4715C8]/30 hover:bg-[#4715C8]/20 rounded-full transition-colors px-3 py-1 text-sm"
                  >
                    {item}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        ) : (
          <input
            id={label}
            type="text"
            value={displayValue}
            onChange={handleChange}
            className="w-full px-4 py-3 text-base leading-relaxed text-gray-800 dark:text-gray-200 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4715C8] focus:border-[#4715C8] transition-colors"
            aria-label={label}
            autoComplete="off"
            spellCheck={false}
          />
        )}
      </div>
    </div>
  );
});

EditableField.displayName = 'EditableField';

const EditableTextArea = React.memo(({ label, value, onChange }: { 
  label: string; 
  value: string; 
  onChange: (value: string) => void;
}) => {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  return (
    <div className="space-y-2">
      <label className="block font-medium text-[#4715C8] uppercase tracking-wide leading-tight text-sm" htmlFor={label}>
        {label}
      </label>
      <textarea
        id={label}
        value={value || ''}
        onChange={handleChange}
        rows={4}
        className="w-full px-4 py-3 text-base leading-relaxed text-gray-800 dark:text-gray-200 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-[#4715C8] focus:border-[#4715C8] transition-colors resize-y"
        aria-label={label}
        autoComplete="off"
        spellCheck={false}
      />
    </div>
  );
});

EditableTextArea.displayName = 'EditableTextArea';

export const PersonaEditForm: React.FC<PersonaEditFormProps> = React.memo(({ persona, onUpdate }) => {
  const handleArrayUpdate = useCallback((field: keyof PersonaData, value: string) => {
    const items = value.split(',').map(item => item.trim()).filter(Boolean);
    onUpdate(field, items);
  }, [onUpdate]);

  return (
    <div className="w-full space-y-8">
      {/* Header Section - Editable */}
      <div className="text-center space-y-4 p-8 bg-gradient-to-br from-[#4715C8]/5 via-[#BAA9FC]/8 to-[#4715C8]/5 rounded-2xl border border-[#BAA9FC]/20 shadow-sm">
        <div className="space-y-3">
          <div>
            <input
              type="text"
              value={persona.current_name}
              onChange={(e) => onUpdate('current_name', e.target.value)}
              className="text-4xl font-black text-[#4715C8] dark:text-[#4715C8] tracking-tight leading-tight bg-transparent text-center border-none outline-none focus:ring-2 focus:ring-[#4715C8]/50 rounded px-3 py-2 w-full"
              placeholder="Persona Name"
              autoFocus
              spellCheck={false}
              autoComplete="off"
            />
          </div>
          <div>
            <textarea
              value={persona.current_description}
              onChange={(e) => onUpdate('current_description', e.target.value)}
              rows={3}
              className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed max-w-3xl mx-auto bg-transparent text-center border-none outline-none focus:ring-2 focus:ring-[#4715C8]/50 rounded px-4 py-3 w-full resize-y"
              placeholder="Describe your persona..."
              spellCheck={false}
              autoComplete="off"
            />
          </div>
        </div>
      </div>

      {/* Persona Details Grid */}
      <div className="grid gap-8 grid-cols-1 lg:grid-cols-2">
        {/* Identity & Audience */}
        <PersonaSection 
          title="Creator Identity" 
          description="Current style and audience focus"
        >
          <EditableField 
            label="Experience Level" 
            value={persona.experience_level} 
            onChange={(value) => onUpdate('experience_level', value)}
          />
          <EditableField 
            label="Content Formats" 
            value={persona.content_formats} 
            onChange={(value) => handleArrayUpdate('content_formats', value)}
            isArray
          />
          <EditableField 
            label="Tone" 
            value={persona.content_tone} 
            onChange={(value) => onUpdate('content_tone', value)}
          />
          <EditableField 
            label="Voice" 
            value={persona.content_voice} 
            onChange={(value) => onUpdate('content_voice', value)}
          />
          <EditableTextArea 
            label="Unique Value" 
            value={persona.unique_value} 
            onChange={(value) => onUpdate('unique_value', value)}
          />
          <EditableField 
            label="Audience Type" 
            value={persona.audience_type} 
            onChange={(value) => onUpdate('audience_type', value)}
          />
        </PersonaSection>

        {/* Content Pillars */}
        <PersonaSection 
          title="Content Pillars" 
          description="Core themes and recurring topics"
        >
          <EditableField 
            label="Pillars" 
            value={persona.content_pillars} 
            onChange={(value) => handleArrayUpdate('content_pillars', value)}
            isArray
          />
        </PersonaSection>

        {/* Future Vision */}
        <PersonaSection 
          title="Future Vision" 
          description="Where your content journey is heading"
        >
          <EditableField 
            label="Future Persona" 
            value={persona.future_name} 
            onChange={(value) => onUpdate('future_name', value)}
          />
          <EditableTextArea 
            label="Vision Description" 
            value={persona.future_description} 
            onChange={(value) => onUpdate('future_description', value)}
          />
          <EditableTextArea 
            label="Desired Impact" 
            value={persona.desired_impact} 
            onChange={(value) => onUpdate('desired_impact', value)}
          />
          <EditableField 
            label="Goals" 
            value={persona.goals} 
            onChange={(value) => handleArrayUpdate('goals', value)}
            isArray
          />
        </PersonaSection>

        {/* Content Strategy */}
        <PersonaSection 
          title="Content Strategy" 
          description="Topic approach and audience engagement"
        >
          <EditableField 
            label="Primary Topics" 
            value={persona.primary_topics} 
            onChange={(value) => handleArrayUpdate('primary_topics', value)}
            isArray
          />
          <EditableField 
            label="Secondary Topics" 
            value={persona.secondary_topics} 
            onChange={(value) => handleArrayUpdate('secondary_topics', value)}
            isArray
          />
          <EditableField 
            label="Engagement Style" 
            value={persona.engagement_style} 
            onChange={(value) => onUpdate('engagement_style', value)}
          />
        </PersonaSection>

        {/* Style & Voice - Full Width */}
        <div className="lg:col-span-2">
          <PersonaSection 
            title="Creative Signature" 
            description="The unique fingerprint of your content"
          >
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
              <EditableField 
                label="Tone Descriptors" 
                value={persona.tone_descriptors} 
                onChange={(value) => handleArrayUpdate('tone_descriptors', value)}
                isArray
              />
              <EditableField 
                label="Style Descriptors" 
                value={persona.style_descriptors} 
                onChange={(value) => handleArrayUpdate('style_descriptors', value)}
                isArray
              />
            </div>
          </PersonaSection>
        </div>
      </div>
    </div>
  );
});

PersonaEditForm.displayName = 'PersonaEditForm'; 