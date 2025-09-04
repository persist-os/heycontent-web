'use client'

import React, { useEffect, useState } from 'react';
import { PersonaTab } from './PersonaTab';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, X, RefreshCw } from 'lucide-react';
import { getCurrentUserId } from '@/app/lib/api-helpers';
import { useOptimizedPersonaManager } from '@/store/persona-store';
import { CentralizedHeader } from '@/components/ui/centralized-header';

export default function SelfHubPage() {
  const [userId, setUserId] = useState<string | undefined>();
  const [isEditMode, setIsEditMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentUserId = getCurrentUserId();
    setUserId(currentUserId || undefined);
  }, []);

  // Get persona data and actions
  const {
    currentPersona,
    allPersonas,
    updatePersona,
    deleteCurrentPersonaAndSelectNext,
  } = useOptimizedPersonaManager(userId || '');

  const handleEdit = () => {
    setIsEditMode(true);
  };

  const handleCancel = () => {
    setIsEditMode(false);
  };

  const handleSave = async () => {
    // This will be handled by the PersonaEditForm component
    setIsEditMode(false);
  };

  const handleDeleteClick = () => {
    if (allPersonas.length > 1) {
      setShowDeleteConfirm(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!currentPersona) return;
    
    setIsDeleting(true);
    try {
      const success = await deleteCurrentPersonaAndSelectNext();
      if (success) {
        setShowDeleteConfirm(false);
        setIsEditMode(false);
      }
    } catch (error) {
      console.error('Error deleting persona:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  const handleUpdatePersona = () => {
    window.location.href = '/dashboard/chat?ask=' + encodeURIComponent('hey content update persona');
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <CentralizedHeader
        title="Self"
        rightActions={[
          {
            id: 'edit',
            icon: Edit2,
            onClick: isEditMode ? handleSave : handleEdit,
            title: isEditMode ? 'Save' : 'Edit',
            variant: isEditMode ? 'default' : 'outline',
            size: 'sm'
          },
          ...(isEditMode ? [{
            id: 'cancel',
            icon: X,
            onClick: handleCancel,
            title: 'Cancel',
            variant: 'ghost' as const,
            size: 'sm' as const
          }] : []),
          ...(!isEditMode && allPersonas.length > 1 ? [{
            id: 'delete',
            icon: Trash2,
            onClick: handleDeleteClick,
            title: 'Delete',
            variant: 'destructive' as const,
            size: 'sm' as const
          }] : []),
          ...(!isEditMode ? [{
            id: 'update',
            icon: RefreshCw,
            onClick: handleUpdatePersona,
            title: 'Update Persona',
            variant: 'outline' as const,
            size: 'sm' as const
          }] : [])
        ]}
        variant="default"
      />

      {/* Only PersonaTab content */}
      <div className="flex-1 overflow-auto p-6" data-persona-content>
        <PersonaTab isEditMode={isEditMode} onEditModeChange={setIsEditMode} />
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-md w-full p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-foreground">
              Delete Current Persona?
            </h3>
            <p className="text-muted-foreground mb-6">
              This will permanently delete this understanding of how you work and automatically switch to your most recent self-reflection. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button 
                variant="ghost" 
                onClick={handleDeleteCancel}
                disabled={isDeleting}
                className="min-h-[44px]"
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="min-h-[44px]"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Persona
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 