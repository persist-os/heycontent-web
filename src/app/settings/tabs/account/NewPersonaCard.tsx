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
    <div className="bg-card rounded-lg transition-all duration-300">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-foreground transition-colors">{persona.current_name}</h2>
        <p className="mt-2 text-base text-muted-foreground leading-relaxed">{persona.current_description}</p>
      </div>

      <div className="px-6">
        <Section title="How You Express Yourself" description="Your natural communication style and approach">
          <InfoItem label="Experience Level" value={persona.experience_level} />
          <InfoItem label="Formats You Gravitate To" value={persona.content_formats} />
          <InfoItem label="Your Natural Tone" value={persona.content_tone} />
          <InfoItem label="Your Voice" value={persona.content_voice} />
          <InfoItem label="What Makes You Unique" value={persona.unique_value} />
          <InfoItem label="Who You Connect With" value={persona.audience_type} />
        </Section>

        <Section title="How You're Growing" description="Where you see yourself heading and what matters to you">
          <InfoItem label="Who You're Becoming" value={persona.future_name} />
          <InfoItem label="Your Vision" value={persona.future_description} />
          <InfoItem label="Impact You Want to Make" value={persona.desired_impact} />
          <InfoItem label="What You're Working Toward" value={persona.goals} />
        </Section>

        <Section title="What You Return To" description="The themes and approaches that feel most natural to you">
          <InfoItem label="What You Think About Most" value={persona.primary_topics} />
          <InfoItem label="Other Things You Explore" value={persona.secondary_topics} />
          <InfoItem label="How You Connect" value={persona.engagement_style} />
          <InfoItem label="Your Core Themes" value={persona.content_pillars} />
        </Section>

        <Section title="Your Personal Style" description="The patterns that make your communication uniquely yours">
          <InfoItem label="How You Sound" value={persona.tone_descriptors} />
          <InfoItem label="Your Approach" value={persona.style_descriptors} />
        </Section>
      </div>
    </div>
  );
}; 