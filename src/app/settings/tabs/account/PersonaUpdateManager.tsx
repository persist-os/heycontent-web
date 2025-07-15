import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useOptimizedPersonaManager } from '@/store/persona-store';
import { PersonaData } from '../../../dashboard/chat/types';
import { Edit2, Plus, Trash2 } from 'lucide-react';
import { PersonaEditForm } from './PersonaEditForm';
import { NewPersonaCard } from './NewPersonaCard';

interface PersonaUpdateManagerProps {
  userId: string;
  renderNewPersonaButton?: () => React.ReactNode;
}

export const PersonaUpdateManager: React.FC<PersonaUpdateManagerProps> = ({ userId, renderNewPersonaButton }) => {
  const renderStartTime = performance.now();
  
  const {
    currentPersona,
    allPersonas,
    isLoading,
    hasPersona,
    updatePersona,
    deleteCurrentPersonaAndSelectNext,
  } = useOptimizedPersonaManager(userId);

  const managerDataTime = performance.now();
  console.log('🎨 [PERSONA UPDATE MANAGER] Data retrieved in:', Math.round(managerDataTime - renderStartTime), 'ms');
  console.log('🎨 [PERSONA UPDATE MANAGER] Component state:', {
    hasCurrentPersona: !!currentPersona,
    isLoading,
    hasPersona,
    userId,
    timestamp: new Date().toISOString()
  });

  const [isEditMode, setIsEditMode] = useState(false);
  const [editedPersona, setEditedPersona] = useState<PersonaData | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = () => {
    if (currentPersona) {
      setEditedPersona({ ...currentPersona });
      setIsEditMode(true);
    }
  };

  const handleCancel = () => {
    setEditedPersona(null);
    setIsEditMode(false);
  };

  const handleSave = async () => {
    if (!editedPersona || !currentPersona) return;

    const changes: Partial<PersonaData> = {};
    Object.keys(editedPersona).forEach(key => {
      const editedKey = key as keyof PersonaData;
      if (JSON.stringify(editedPersona[editedKey]) !== JSON.stringify(currentPersona[editedKey])) {
        changes[editedKey] = editedPersona[editedKey];
      }
    });

    if (Object.keys(changes).length === 0) {
      setEditedPersona(null);
      setIsEditMode(false);
      return;
    }

    await updatePersona(changes);
    setEditedPersona(null);
    setIsEditMode(false);
  };

  const handleDeleteClick = () => {
    // Only allow deletion if there are multiple personas
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
        // Reset edit mode if it was active
        setIsEditMode(false);
        setEditedPersona(null);
      } else {
        // Handle error - could show a toast or error message
        console.error('Failed to delete persona');
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



  const updateField = (field: keyof PersonaData, value: string | string[]) => {
    if (!editedPersona) return;
    setEditedPersona({ ...editedPersona, [field]: value });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0 mb-6">
          <div className="space-y-2">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-11 w-20 rounded-lg" />
            <Skeleton className="h-11 w-28 rounded-lg" />
          </div>
        </div>

        {/* NewPersonaCard Skeleton */}
        <div className="rounded-lg bg-card p-6">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="mt-4 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-3/4" />
          
          <div className="mt-8 space-y-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="py-6 border-b border-border">
                <div className="mb-4">
                  <Skeleton className="h-5 w-1/4" />
                  <Skeleton className="mt-2 h-4 w-1/2" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!hasPersona) {
    return (
      <div className="text-center py-12 px-4 space-y-6">
        <div className="w-12 h-12 bg-muted rounded-lg mx-auto flex items-center justify-center">
          <Plus className="w-6 h-6 text-muted-foreground" />
        </div>
        <div className="space-y-4">
          <div>
            <p className="font-medium text-foreground text-lg">No persona yet</p>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-sm mx-auto">
              Create your first persona in chat to get started
            </p>
          </div>
          <Button 
            onClick={() => window.location.href = '/dashboard/chat?ask=hey%20content%20persona'}
            className="w-full sm:w-auto min-h-[48px] px-6 bg-purple-500 hover:bg-purple-600 dark:bg-accent dark:hover:bg-accent/90 text-white"
          >
            Create Persona in Chat
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Persona */}
      <div>
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0 mb-6">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-purple-600 dark:text-accent">AI Content Persona</h2>
            <p className="text-sm text-muted-foreground">Your active persona profile for content generation</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-2">
            <Button
              variant={isEditMode ? 'default' : 'outline'}
              size="sm"
              onClick={isEditMode ? handleSave : handleEdit}
              className={`min-h-[44px] w-full sm:w-auto transition-colors ${
                isEditMode 
                  ? 'bg-purple-500 hover:bg-purple-600 dark:bg-accent dark:hover:bg-accent/90 text-white' 
                  : 'text-purple-500 border-purple-500 hover:bg-purple-50 dark:text-accent dark:border-accent dark:hover:bg-accent/10'
              }`}
            >
              <Edit2 className="w-4 h-4 mr-2" />
              {isEditMode ? 'Save' : 'Edit'}
            </Button>
            {isEditMode && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleCancel}
                className="min-h-[44px] w-full sm:w-auto text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                Cancel
              </Button>
            )}
            {!isEditMode && allPersonas.length > 1 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleDeleteClick}
                className="min-h-[44px] w-full sm:w-auto text-red-500 border-red-500 hover:bg-red-50 dark:text-red-400 dark:border-red-400 dark:hover:bg-red-400/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            )}
            {!isEditMode && renderNewPersonaButton && renderNewPersonaButton()}
          </div>
        </div>

        {isEditMode ? (
          <PersonaEditForm persona={editedPersona!} onUpdate={updateField} />
        ) : (
          <NewPersonaCard persona={currentPersona!} />
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-md w-full p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-foreground">
              Delete Current Persona?
            </h3>
            <p className="text-muted-foreground mb-6">
              This will permanently delete "{currentPersona?.current_name}" and automatically switch to your most recently created persona. This action cannot be undone.
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
                className="min-h-[44px] bg-red-500 hover:bg-red-600"
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
}; 