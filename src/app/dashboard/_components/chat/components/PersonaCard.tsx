import React, { useEffect, useState } from 'react';
import { PersonaData } from '../types';
import { usePersonaManager } from '../utils/persona-utils';

interface PersonaCardProps {
  persona: PersonaData;
  userId: string;
}

export const PersonaCard: React.FC<PersonaCardProps> = ({ persona, userId }) => {
  console.log('PersonaCard rendered', { persona, userId });
  const { savePersonaFromResponse } = usePersonaManager();
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  useEffect(() => {
    let isMounted = true;
    const save = async () => {
      setStatus('saving');
      try {
        const result = await savePersonaFromResponse({ is_persona_complete: true, persona }, userId);
        if (isMounted) setStatus(result ? 'success' : 'error');
      } catch (e) {
        if (isMounted) setStatus('error');
      }
    };
    save();
    return () => { isMounted = false; };
  }, [persona, userId, savePersonaFromResponse]);

  return (
    <div className="rounded-lg border p-4 bg-purple-50 my-2 shadow-md max-w-xl mx-auto">
      <h2 className="font-bold text-lg mb-2 text-purple-700">{persona.current_name}</h2>
      <p className="mb-2 text-sm text-gray-700">{persona.current_description}</p>
      <div className="mb-1"><b>Experience:</b> {persona.experience_level}</div>
      <div className="mb-1"><b>Formats:</b> {persona.content_formats?.join(', ')}</div>
      <div className="mb-1"><b>Tone:</b> {persona.content_tone}</div>
      <div className="mb-1"><b>Voice:</b> {persona.content_voice}</div>
      <div className="mb-1"><b>Unique Value:</b> {persona.unique_value}</div>
      <div className="mb-1"><b>Audience:</b> {persona.audience_type}</div>
      <div className="mb-1"><b>Future Name:</b> {persona.future_name}</div>
      <div className="mb-1"><b>Future Description:</b> {persona.future_description}</div>
      <div className="mb-1"><b>Desired Impact:</b> {persona.desired_impact}</div>
      <div className="mb-1"><b>Primary Topics:</b> {persona.primary_topics?.join(', ')}</div>
      <div className="mb-1"><b>Secondary Topics:</b> {persona.secondary_topics?.join(', ')}</div>
      <div className="mb-1"><b>Tone Descriptors:</b> {persona.tone_descriptors?.join(', ')}</div>
      <div className="mb-1"><b>Style Descriptors:</b> {persona.style_descriptors?.join(', ')}</div>
      <div className="mb-1"><b>Engagement Style:</b> {persona.engagement_style?.join(', ')}</div>
      <div className="mt-3">
        {status === 'saving' && <span className="text-xs text-blue-500">Saving persona...</span>}
        {status === 'success' && <span className="text-xs text-green-600">Persona saved!</span>}
        {status === 'error' && <span className="text-xs text-red-500">Failed to save persona.</span>}
      </div>
    </div>
  );
}; 