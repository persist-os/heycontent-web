import { useState, useEffect } from 'react';
import { getPlaygroundPrompts } from '../utils/api';
import { generateUniqueId, groupPromptsByAgentType } from '../utils';
import { Prompt } from '../usePromptPlayground';

export function usePromptData(selectedPlatform: string, selectedGoal: string, setInstructions: (v: string) => void) {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [isPromptsLoading, setIsPromptsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsPromptsLoading(true);
    getPlaygroundPrompts()
      .then((data) => {
        if (!isMounted) return;
        const loadedPrompts: Prompt[] = [];
        if (data.prompts && typeof data.prompts === 'object') {
          for (const agentType in data.prompts) {
            const promptGroup = data.prompts[agentType];
            if (promptGroup && typeof promptGroup === 'object') {
              if ('description' in promptGroup && 'instructions' in promptGroup) {
                loadedPrompts.push({
                  id: `${agentType}-main`,
                  title: agentType.replace(/_/g, ' '),
                  description: promptGroup.description || '',
                  instructions: promptGroup.instructions || '',
                  platform: '',
                  goal: '',
                  agentType,
                });
              } else if ('description' in promptGroup) {
                loadedPrompts.push({
                  id: `${agentType}-main`,
                  title: agentType.replace(/_/g, ' '),
                  description: promptGroup.description || '',
                  instructions: '',
                  platform: '',
                  goal: '',
                  agentType,
                });
              } else if ('instructions' in promptGroup) {
                loadedPrompts.push({
                  id: `${agentType}-main`,
                  title: agentType.replace(/_/g, ' '),
                  description: '',
                  instructions: promptGroup.instructions || '',
                  platform: '',
                  goal: '',
                  agentType,
                });
              } else if ('content' in promptGroup) {
                loadedPrompts.push({
                  id: `${agentType}-main`,
                  title: agentType.replace(/_/g, ' '),
                  description: '',
                  instructions: promptGroup.content || '',
                  platform: '',
                  goal: '',
                  agentType,
                });
              }
            }
          }
        }
        setPrompts(loadedPrompts);
        setIsPromptsLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Failed to load prompts');
        setIsPromptsLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  const handlePromptSelect = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
  };

  const handleNewPrompt = () => {
    const newPrompt: Prompt = {
      id: generateUniqueId(),
      title: 'New Prompt',
      description: 'Custom prompt',
      instructions: 'Write your instructions here...',
      platform: selectedPlatform || 'YouTube',
      goal: selectedGoal || 'grow audience'
    };
    setPrompts(prev => [...prev, newPrompt]);
    setSelectedPrompt(newPrompt);
  };

  const filteredPrompts = prompts.filter(prompt => {
    const matchesPlatform = !selectedPlatform || prompt.platform === selectedPlatform;
    const matchesGoal = !selectedGoal || prompt.goal === selectedGoal;
    return matchesPlatform && matchesGoal;
  });

  const groupedPrompts = groupPromptsByAgentType(filteredPrompts);

  const handleLoadPromptContent = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setInstructions(prompt.instructions);
  };

  return {
    prompts,
    setPrompts,
    selectedPrompt,
    setSelectedPrompt,
    handlePromptSelect,
    handleNewPrompt,
    groupedPrompts,
    isPromptsLoading,
    setIsPromptsLoading,
    error,
    setError,
    filteredPrompts,
    handleLoadPromptContent,
  };
} 