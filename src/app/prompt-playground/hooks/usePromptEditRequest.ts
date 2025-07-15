import { useState } from 'react';
import { submitPlaygroundEditRequest, PlaygroundEditRequest } from '../utils/api';
import { useAuth } from '@/app/context/auth-context';
import { Prompt } from '../usePromptPlayground';

export function usePromptEditRequest() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { firebaseUser } = useAuth();

  const submitEditRequest = async (
    selectedPrompt: Prompt,
    requestTitle: string,
    justification: string,
    newDescription: string,
    newInstructions: string
  ) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const userName = firebaseUser?.displayName || firebaseUser?.email || 'Anonymous';
      if (!firebaseUser) {
        throw new Error('User not authenticated');
      }

      const editRequest: PlaygroundEditRequest = {
        name: userName,
        request_title: requestTitle,
        prompt_title: selectedPrompt.title,
        justification: justification,
        old_description: selectedPrompt.description || '',
        new_description: newDescription,
        old_instructions: selectedPrompt.instructions || '',
        new_instructions: newInstructions,
        status: 'Pending',
        synced: false,
      };

      const result = await submitPlaygroundEditRequest(editRequest);
      
      if (!result.ok) {
        throw new Error(result.error || 'Failed to submit edit request');
      }

      setSuccess(true);
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to submit edit request');
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
    submitEditRequest,
    openModal,
    closeModal,
  };
} 