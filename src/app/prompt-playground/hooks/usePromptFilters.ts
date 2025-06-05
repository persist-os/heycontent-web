import { useState } from 'react';
import { Platform } from '../usePromptPlayground';

const platforms: Platform[] = [
  { id: 'youtube', name: 'YouTube', goals: ['grow audience', 'increase views', 'improve engagement', 'monetize'] },
  { id: 'instagram', name: 'Instagram', goals: ['boost followers', 'increase stories views', 'drive sales', 'brand awareness'] },
  { id: 'tiktok', name: 'TikTok', goals: ['go viral', 'increase followers', 'trending content', 'brand partnerships'] },
  { id: 'linkedin', name: 'LinkedIn', goals: ['professional growth', 'thought leadership', 'networking', 'lead generation'] },
];

export function usePromptFilters() {
  const [selectedPersona, setSelectedPersona] = useState<string>('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [selectedGoal, setSelectedGoal] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const availableGoals = selectedPlatform
    ? platforms.find(p => p.name === selectedPlatform)?.goals || []
    : [];

  return {
    selectedPersona,
    setSelectedPersona,
    selectedPlatform,
    setSelectedPlatform,
    selectedGoal,
    setSelectedGoal,
    searchQuery,
    setSearchQuery,
    availableGoals,
    platforms,
    showFilters,
    setShowFilters,
  };
} 