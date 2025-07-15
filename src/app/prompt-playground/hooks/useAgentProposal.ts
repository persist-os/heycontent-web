import { useState } from 'react';
import { proposeAgent, AgentProposalRequest } from '../utils/api';
import { useAuth } from '@/app/context/auth-context';
import { Prompt } from '../usePromptPlayground';

export function useAgentProposal() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { firebaseUser } = useAuth();

  const submitAgentProposal = async (
    selectedPrompt: Prompt,
    agentName: string,
    useCases: string,
    targetUsers: string,
    description: string,
    instructions: string
  ) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const userName = firebaseUser?.displayName || firebaseUser?.email || 'Anonymous';
      if (!firebaseUser) {
        throw new Error('User not authenticated');
      }

      // Split target users by commas for multi-select in Notion
      const targetUsersList = targetUsers
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);

      const agentProposal: AgentProposalRequest = {
        title: agentName,
        name: userName, // This is now a string in the updated API interface
        use_cases: useCases,
        target_users: targetUsersList,
        description: description,
        instructions: instructions,
        status: 'Pending',
        submission_date: new Date().toISOString(),
      };

      const result = await proposeAgent(agentProposal);
      
      if (!result.ok) {
        throw new Error(result.error || 'Failed to submit agent proposal');
      }

      setSuccess(true);
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to submit agent proposal');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
    setError(null);
    setSuccess(false);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setError(null);
    setSuccess(false);
  };

  return {
    isModalOpen,
    isSubmitting,
    error,
    success,
    submitAgentProposal,
    openModal,
    closeModal,
  };
}
