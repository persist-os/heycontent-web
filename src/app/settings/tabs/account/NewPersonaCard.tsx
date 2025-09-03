import React from 'react';
import { PersonaData } from '../../../dashboard/chat/types';

interface NewPersonaCardProps {
  persona: PersonaData;
}

const PersonaField: React.FC<{
  label: string;
  value: string | string[];
  isArray?: boolean;
}> = ({ label, value, isArray = false }) => {
  if (!value || (Array.isArray(value) && value.length === 0)) {
    return null;
  }

  return (
    <div className="mb-8">
      <h4 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
        {label}
      </h4>
      {Array.isArray(value) ? (
        <div className="flex flex-wrap gap-2">
          {value.map((item, index) => (
            <span
              key={index}
              className="inline-block px-3 py-1.5 text-sm bg-muted/60 text-foreground rounded-full border border-border/50"
            >
              {item}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-base leading-relaxed text-foreground whitespace-pre-wrap">
          {value}
        </p>
      )}
    </div>
  );
};

export const NewPersonaCard: React.FC<NewPersonaCardProps> = ({ persona }) => {
  return (
    <div className="w-full">
      {/* Header Section */}
      <div className="mb-12 pb-8 border-b border-border/50">
        <h1 className="text-3xl font-semibold text-foreground mb-4">
          {persona.current_name}
        </h1>
        <p className="text-lg leading-relaxed text-muted-foreground">
          {persona.current_description}
        </p>
      </div>

      {/* Content Sections */}
      <div className="space-y-16">
        {/* How You Express Yourself */}
        <section>
          <h2 className="text-2xl font-medium text-foreground mb-8 pb-2 border-b border-border/30">
            How You Express Yourself
          </h2>
          <div className="space-y-8">
            <PersonaField label="Experience Level" value={persona.experience_level} />
            <PersonaField label="Content Formats" value={persona.content_formats} isArray={true} />
            <PersonaField label="Natural Tone" value={persona.content_tone} />
            <PersonaField label="Your Voice" value={persona.content_voice} />
            <PersonaField label="Unique Value" value={persona.unique_value} />
            <PersonaField label="Audience Type" value={persona.audience_type} />
          </div>
        </section>

        {/* How You're Growing */}
        <section>
          <h2 className="text-2xl font-medium text-foreground mb-8 pb-2 border-b border-border/30">
            How You're Growing
          </h2>
          <div className="space-y-8">
            <PersonaField label="Who You're Becoming" value={persona.future_name} />
            <PersonaField label="Your Vision" value={persona.future_description} />
            <PersonaField label="Desired Impact" value={persona.desired_impact} />
            <PersonaField label="Goals" value={persona.goals} isArray={true} />
          </div>
        </section>

        {/* What You Return To */}
        <section>
          <h2 className="text-2xl font-medium text-foreground mb-8 pb-2 border-b border-border/30">
            What You Return To
          </h2>
          <div className="space-y-8">
            <PersonaField label="Primary Topics" value={persona.primary_topics} isArray={true} />
            <PersonaField label="Secondary Topics" value={persona.secondary_topics} isArray={true} />
            <PersonaField label="Engagement Style" value={persona.engagement_style} />
            <PersonaField label="Content Pillars" value={persona.content_pillars} isArray={true} />
          </div>
        </section>

        {/* Your Personal Style */}
        <section>
          <h2 className="text-2xl font-medium text-foreground mb-8 pb-2 border-b border-border/30">
            Your Personal Style
          </h2>
          <div className="space-y-8">
            <PersonaField label="Tone Descriptors" value={persona.tone_descriptors} isArray={true} />
            <PersonaField label="Style Descriptors" value={persona.style_descriptors} isArray={true} />
          </div>
        </section>
      </div>
    </div>
  );
}; 