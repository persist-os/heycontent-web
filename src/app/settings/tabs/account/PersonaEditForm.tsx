import React, { useState, useEffect } from 'react';
import { PersonaData } from '../../../dashboard/chat/types';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface PersonaEditFormProps {
  persona: PersonaData;
  onUpdate: (field: keyof PersonaData, value: string | string[]) => void;
}

const Section: React.FC<{ title: string; description: string; children: React.ReactNode }> = ({ title, description, children }) => (
    <div className="py-6 border-b border-gray-200 last:border-b-0">
        <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">{description}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {children}
        </div>
    </div>
);

const EditableField: React.FC<{
  label: string;
  value: string | string[];
  field: keyof PersonaData;
  onUpdate: (field: keyof PersonaData, value: string) => void;
  isArray?: boolean;
}> = ({ label, value, field, onUpdate, isArray = false }) => {
  const [inputValue, setInputValue] = useState(Array.isArray(value) ? value.join(', ') : value || '');

  useEffect(() => {
    setInputValue(Array.isArray(value) ? value.join(', ') : value || '');
  }, [value]);

  const handleBlur = () => {
    onUpdate(field, inputValue);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={String(field)} className="text-xs font-medium text-gray-500 uppercase tracking-wider">
        {label}
      </Label>
      <Input
        id={String(field)}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={handleBlur}
        placeholder={isArray ? 'Separate with commas' : `Enter ${label.toLowerCase()}`}
      />
      {isArray && Array.isArray(value) && value.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {value.map((item, index) => (
            <Badge key={index} variant="outline" className="font-normal">
              {item}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

const EditableTextarea: React.FC<{
  label: string;
  value: string;
  field: keyof PersonaData;
  onUpdate: (field: keyof PersonaData, value: string) => void;
}> = ({ label, value, field, onUpdate }) => {
    const [textValue, setTextValue] = useState(value || '');

    useEffect(() => {
        setTextValue(value || '');
    }, [value]);

    const handleBlur = () => {
        onUpdate(field, textValue);
    };

    return (
        <div className="space-y-2">
            <Label htmlFor={String(field)} className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                {label}
            </Label>
            <Textarea
                id={String(field)}
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                onBlur={handleBlur}
                placeholder={`Describe ${label.toLowerCase()}`}
                rows={4}
            />
        </div>
    );
};

export const PersonaEditForm: React.FC<PersonaEditFormProps> = ({ persona, onUpdate }) => {
  const handleUpdate = (field: keyof PersonaData, value: string | string[]) => {
    onUpdate(field, value);
  };

  const handleArrayUpdate = (field: keyof PersonaData, value: string) => {
    const items = value.split(',').map(item => item.trim()).filter(Boolean);
    onUpdate(field, items);
  };
  
  return (
    <div className="bg-white rounded-lg">
      <div className="p-6">
        <div className="space-y-2 mb-6">
            <Label htmlFor="current_name" className="text-xs font-medium text-gray-500 uppercase tracking-wider">Persona Name</Label>
            <Input
                id="current_name"
                value={persona.current_name}
                onChange={(e) => handleUpdate('current_name', e.target.value)}
                className="text-2xl font-bold h-auto p-0 border-none focus-visible:ring-0"
                placeholder="Persona Name"
            />
        </div>
        <div className="space-y-2">
            <Label htmlFor="current_description" className="text-xs font-medium text-gray-500 uppercase tracking-wider">Description</Label>
            <Textarea
                id="current_description"
                value={persona.current_description}
                onChange={(e) => handleUpdate('current_description', e.target.value)}
                placeholder="Describe your persona..."
                className="text-base border-none p-0 focus-visible:ring-0"
            />
        </div>
      </div>

      <div className="px-6">
        <Section title="Creator Identity" description="Current style and audience focus">
          <EditableField label="Experience Level" value={persona.experience_level} field="experience_level" onUpdate={handleUpdate} />
          <EditableField label="Content Formats" value={persona.content_formats} field="content_formats" onUpdate={handleArrayUpdate} isArray />
          <EditableField label="Tone" value={persona.content_tone} field="content_tone" onUpdate={handleUpdate} />
          <EditableField label="Voice" value={persona.content_voice} field="content_voice" onUpdate={handleUpdate} />
          <div className="md:col-span-2">
            <EditableTextarea label="Unique Value" value={persona.unique_value} field="unique_value" onUpdate={handleUpdate} />
          </div>
          <EditableField label="Audience Type" value={persona.audience_type} field="audience_type" onUpdate={handleUpdate} />
        </Section>

        <Section title="Future Vision" description="Where your content journey is heading">
          <EditableField label="Future Persona" value={persona.future_name} field="future_name" onUpdate={handleUpdate} />
          <div className="md:col-span-2">
            <EditableTextarea label="Vision Description" value={persona.future_description} field="future_description" onUpdate={handleUpdate} />
          </div>
          <div className="md:col-span-2">
            <EditableTextarea label="Desired Impact" value={persona.desired_impact} field="desired_impact" onUpdate={handleUpdate} />
          </div>
          <EditableField label="Goals" value={persona.goals} field="goals" onUpdate={handleArrayUpdate} isArray />
        </Section>

        <Section title="Content Strategy" description="Topic approach and audience engagement">
          <EditableField label="Primary Topics" value={persona.primary_topics} field="primary_topics" onUpdate={handleArrayUpdate} isArray />
          <EditableField label="Secondary Topics" value={persona.secondary_topics} field="secondary_topics" onUpdate={handleArrayUpdate} isArray />
          <EditableField label="Engagement Style" value={persona.engagement_style} field="engagement_style" onUpdate={handleUpdate} />
          <EditableField label="Content Pillars" value={persona.content_pillars} field="content_pillars" onUpdate={handleArrayUpdate} isArray />
        </Section>

        <Section title="Creative Signature" description="The unique fingerprint of your content">
          <EditableField label="Tone Descriptors" value={persona.tone_descriptors} field="tone_descriptors" onUpdate={handleArrayUpdate} isArray />
          <EditableField label="Style Descriptors" value={persona.style_descriptors} field="style_descriptors" onUpdate={handleArrayUpdate} isArray />
        </Section>
      </div>
    </div>
  );
}; 