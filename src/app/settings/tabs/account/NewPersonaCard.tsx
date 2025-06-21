import React from 'react';
import { PersonaData } from '../../../dashboard/chat/types';
import { Badge } from '@/components/ui/badge';

interface NewPersonaCardProps {
  persona: PersonaData;
}

const Section: React.FC<{ title: string; description: string; children: React.ReactNode }> = ({ title, description, children }) => (
  <div className="py-6 border-b border-border">
    <div className="mb-4">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
      {children}
    </div>
  </div>
);

const InfoItem: React.FC<{ label: string; value: string | string[] | undefined }> = ({ label, value }) => {
  if (!value || (Array.isArray(value) && value.length === 0)) return null;

  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider dark:group-hover:text-accent group-hover:text-purple-500 transition-colors duration-300">{label}</p>
      {Array.isArray(value) ? (
        <div className="flex flex-wrap gap-2 mt-2">
          {value.map((item, index) => (
            <Badge 
              key={index} 
              variant="outline" 
              className="font-normal border-border group-hover:text-purple-500 group-hover:border-purple-500/50 dark:group-hover:text-accent dark:group-hover:border-accent/50 transition-colors"
            >
              {item}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-sm text-foreground/90 mt-1">{value}</p>
      )}
    </div>
  );
};


export const NewPersonaCard: React.FC<NewPersonaCardProps> = ({ persona }) => {
  if (!persona) return null;

  return (
    <div className="bg-card rounded-lg group transition-all duration-300 
      hover:ring-2 hover:ring-purple-500 dark:hover:ring-accent hover:ring-offset-2 hover:ring-offset-background">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-foreground group-hover:text-purple-500 dark:group-hover:text-accent transition-colors">{persona.current_name}</h2>
        <p className="mt-2 text-base text-muted-foreground leading-relaxed">{persona.current_description}</p>
      </div>

      <div className="px-6">
        <Section title="Creator Identity" description="Current style and audience focus">
          <InfoItem label="Experience Level" value={persona.experience_level} />
          <InfoItem label="Content Formats" value={persona.content_formats} />
          <InfoItem label="Tone" value={persona.content_tone} />
          <InfoItem label="Voice" value={persona.content_voice} />
          <InfoItem label="Unique Value" value={persona.unique_value} />
          <InfoItem label="Audience Type" value={persona.audience_type} />
        </Section>

        <Section title="Future Vision" description="Where your content journey is heading">
          <InfoItem label="Future Persona" value={persona.future_name} />
          <InfoItem label="Vision Description" value={persona.future_description} />
          <InfoItem label="Desired Impact" value={persona.desired_impact} />
          <InfoItem label="Goals" value={persona.goals} />
        </Section>

        <Section title="Content Strategy" description="Topic approach and audience engagement">
          <InfoItem label="Primary Topics" value={persona.primary_topics} />
          <InfoItem label="Secondary Topics" value={persona.secondary_topics} />
          <InfoItem label="Engagement Style" value={persona.engagement_style} />
          <InfoItem label="Content Pillars" value={persona.content_pillars} />
        </Section>

        <Section title="Creative Signature" description="The unique fingerprint of your content">
          <InfoItem label="Tone Descriptors" value={persona.tone_descriptors} />
          <InfoItem label="Style Descriptors" value={persona.style_descriptors} />
        </Section>
      </div>
    </div>
  );
}; 