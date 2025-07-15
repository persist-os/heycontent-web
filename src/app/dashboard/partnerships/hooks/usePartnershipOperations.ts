import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { getCurrentUserId } from '@/app/lib/api-helpers';
import { Partnership } from '../types';

export const usePartnershipOperations = () => {
  const [statusLoading, setStatusLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  
  const deleteGmailThread = useMutation(api.gmailMutations.deleteGmailThread);
  const updateThreadStatus = useMutation(api.gmailMutations.updateGmailThreadStatus);
  const updateThreadCategory = useMutation(api.gmailMutations.updateGmailThreadCategory);

  const handleDeletePartnership = async (
    partnership: Partnership,
    userEmail: string | null,
    onSuccess?: () => void
  ) => {
    setDeleteLoading(true);
    try {
      const userId = getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');
      
      console.log('🗑️ [PARTNERSHIP DELETE] Deleting partnership:', {
        partnershipId: partnership.id,
        threadId: partnership.emailThreadId,
        brandName: partnership.brandName
      });

      await deleteGmailThread({
        userId,
        threadId: partnership.emailThreadId,
        email: userEmail || undefined
      });

      console.log('✅ [PARTNERSHIP DELETE] Partnership deleted successfully');
      onSuccess?.();
    } catch (error: any) {
      console.error('❌ [PARTNERSHIP DELETE] Error deleting partnership:', error);
      throw new Error(`Failed to delete partnership: ${error.message || 'Please try again'}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleUpdateStatus = async (
    partnership: Partnership,
    newStatus: Partnership['status'],
    onSuccess?: (updatedPartnership: Partial<Partnership>) => void
  ) => {
    setStatusLoading(true);
    try {
      const userId = getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');
      
      console.log('🔄 [PARTNERSHIP STATUS] Updating status:', {
        partnershipId: partnership.id,
        threadId: partnership.emailThreadId,
        oldStatus: partnership.status,
        newStatus,
        userId
      });

      const result = await updateThreadStatus({
        userId,
        threadId: partnership.emailThreadId,
        status: newStatus,
        estimatedValue: partnership.estimatedValue
      });

      console.log('✅ [PARTNERSHIP STATUS] Status updated successfully:', result);
      onSuccess?.({ 
        status: newStatus, 
        lastActivity: Date.now() 
      });
    } catch (error: any) {
      console.error('❌ [PARTNERSHIP STATUS] Error updating status:', error);
      throw new Error(`Failed to update status: ${error.message || 'Please try again'}`);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleUpdateCategory = async (
    partnership: Partnership,
    newCategory: Partnership['category'],
    onSuccess?: (updatedPartnership: Partial<Partnership>) => void
  ) => {
    setCategoryLoading(true);
    setCategoryError(null);
    try {
      const userId = getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');
      
      console.log('🏷️ [PARTNERSHIP CATEGORY] Updating category:', {
        partnershipId: partnership.id,
        threadId: partnership.emailThreadId,
        oldCategory: partnership.category,
        newCategory,
        userId
      });

      const result = await updateThreadCategory({
        userId,
        threadId: partnership.emailThreadId,
        category: newCategory
      });

      console.log('✅ [PARTNERSHIP CATEGORY] Category updated successfully:', result);
      onSuccess?.({ category: newCategory });
    } catch (error: any) {
      console.error('❌ [PARTNERSHIP CATEGORY] Error updating category:', error);
      setCategoryError(`Failed to update type: ${error.message || 'Please try again'}`);
      throw error;
    } finally {
      setCategoryLoading(false);
    }
  };

  return {
    handleDeletePartnership,
    handleUpdateStatus,
    handleUpdateCategory,
    statusLoading,
    deleteLoading,
    categoryLoading,
    categoryError
  };
}; 