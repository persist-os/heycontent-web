import React, { useState, useEffect } from 'react';
import { PersonaData } from '../../../dashboard/chat/types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface PersonaEditFormProps {
  persona: PersonaData;
  onUpdate: (field: keyof PersonaData, value: string | string[]) => void;
}

const EditField: React.FC<{
  label: string;
  value: string | string[];
  field: keyof PersonaData;
  onUpdate: (field: keyof PersonaData, value: string | string[]) => void;
  isArray?: boolean;
}> = ({ label, value, field, onUpdate, isArray = false }) => {
  const [inputValue, setInputValue] = useState(Array.isArray(value) ? value.join(', ') : value || '');

  useEffect(() => {
    setInputValue(Array.isArray(value) ? value.join(', ') : value || '');
  }, [value]);

  const handleBlur = () => {
    if (isArray) {
      // For array fields, split by comma and trim
      const arrayValue = inputValue.split(',').map(item => item.trim()).filter(item => item.length > 0);
      onUpdate(field, arrayValue);
    } else {
      onUpdate(field, inputValue);
    }
  };

  return (
    <div className="mb-8">
      <Label htmlFor={String(field)} className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide block">
        {label}
      </Label>
      <Input
        id={String(field)}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={handleBlur}
        placeholder={isArray ? 'Separate with commas' : `Enter ${label.toLowerCase()}`}
        className="text-base h-12 px-4 border-border/50 focus:border-border transition-colors"
      />
      {isArray && Array.isArray(value) && value.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {value.map((item, index) => (
            <span 
              key={index} 
              className="inline-block px-3 py-1.5 text-sm bg-muted/60 text-foreground rounded-full border border-border/50"
            >
              {item}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

const EditTextarea: React.FC<{
  label: string;
  value: string;
  field: keyof PersonaData;
  onUpdate: (field: keyof PersonaData, value: string | string[]) => void;
}> = ({ label, value, field, onUpdate }) => {
  const [textValue, setTextValue] = useState(value || '');

  useEffect(() => {
    setTextValue(value || '');
  }, [value]);

  const handleBlur = () => {
    onUpdate(field, textValue);
  };

  return (
    <div className="mb-8">
      <Label htmlFor={String(field)} className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide block">
        {label}
      </Label>
      <Textarea
        id={String(field)}
        value={textValue}
        onChange={(e) => setTextValue(e.target.value)}
        onBlur={handleBlur}
        placeholder={`Describe ${label.toLowerCase()}`}
        rows={4}
        className="text-base px-4 py-3 border-border/50 focus:border-border transition-colors resize-none"
      />
    </div>
  );
};

export const PersonaEditForm: React.FC<PersonaEditFormProps> = ({ persona, onUpdate }) => {
  return (
    <div className="w-full">
      {/* Header Section */}
      <div className="mb-12 pb-8 border-b border-border/50">
        <EditField
          label="Current Name"
          value={persona.current_name}
          field="current_name"
          onUpdate={onUpdate}
        />
        <EditTextarea
          label="Current Description"
          value={persona.current_description}
          field="current_description"
          onUpdate={onUpdate}
        />
      </div>

      {/* Content Sections */}
      <div className="space-y-16">
        {/* How You Express Yourself */}
        <section>
          <h2 className="text-2xl font-medium text-foreground mb-8 pb-2 border-b border-border/30">
            How You Express Yourself
          </h2>
          <div className="space-y-8">
            <EditField 
              label="Experience Level" 
              value={persona.experience_level}
              field="experience_level"
              onUpdate={onUpdate}
            />
            <EditField 
              label="Content Formats" 
              value={persona.content_formats}
              field="content_formats"
              onUpdate={onUpdate}
              isArray={true}
            />
            <EditField 
              label="Natural Tone" 
              value={persona.content_tone}
              field="content_tone"
              onUpdate={onUpdate}
            />
            <EditField 
              label="Your Voice" 
              value={persona.content_voice}
              field="content_voice"
              onUpdate={onUpdate}
            />
            <EditField 
              label="Unique Value" 
              value={persona.unique_value}
              field="unique_value"
              onUpdate={onUpdate}
            />
            <EditField 
              label="Audience Type" 
              value={persona.audience_type}
              field="audience_type"
              onUpdate={onUpdate}
            />
          </div>
        </section>

        {/* How You're Growing */}
        <section>
          <h2 className="text-2xl font-medium text-foreground mb-8 pb-2 border-b border-border/30">
            How You're Growing
          </h2>
          <div className="space-y-8">
            <EditField 
              label="Who You're Becoming" 
              value={persona.future_name}
              field="future_name"
              onUpdate={onUpdate}
            />
            <EditTextarea 
              label="Your Vision" 
              value={persona.future_description}
              field="future_description"
              onUpdate={onUpdate}
            />
            <EditTextarea 
              label="Desired Impact" 
              value={persona.desired_impact}
              field="desired_impact"
              onUpdate={onUpdate}
            />
            <EditField 
              label="Goals" 
              value={persona.goals}
              field="goals"
              onUpdate={onUpdate}
              isArray={true}
            />
          </div>
        </section>

        {/* What You Return To */}
        <section>
          <h2 className="text-2xl font-medium text-foreground mb-8 pb-2 border-b border-border/30">
            What You Return To
          </h2>
          <div className="space-y-8">
            <EditField 
              label="Primary Topics" 
              value={persona.primary_topics}
              field="primary_topics"
              onUpdate={onUpdate}
              isArray={true}
            />
            <EditField 
              label="Secondary Topics" 
              value={persona.secondary_topics}
              field="secondary_topics"
              onUpdate={onUpdate}
              isArray={true}
            />
            <EditField 
              label="Engagement Style" 
              value={persona.engagement_style}
              field="engagement_style"
              onUpdate={onUpdate}
            />
            <EditField 
              label="Content Pillars" 
              value={persona.content_pillars}
              field="content_pillars"
              onUpdate={onUpdate}
              isArray={true}
            />
          </div>
        </section>

        {/* Your Personal Style */}
        <section>
          <h2 className="text-2xl font-medium text-foreground mb-8 pb-2 border-b border-border/30">
            Your Personal Style
          </h2>
          <div className="space-y-8">
            <EditField 
              label="Tone Descriptors" 
              value={persona.tone_descriptors}
              field="tone_descriptors"
              onUpdate={onUpdate}
              isArray={true}
            />
            <EditField 
              label="Style Descriptors" 
              value={persona.style_descriptors}
              field="style_descriptors"
              onUpdate={onUpdate}
              isArray={true}
            />
          </div>
        </section>
      </div>
    </div>
  );
}; 