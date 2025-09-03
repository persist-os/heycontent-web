import React, { useState, useEffect } from 'react';
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
  isEditMode?: boolean;
  onEditModeChange?: (isEditMode: boolean) => void;
}

export const PersonaUpdateManager: React.FC<PersonaUpdateManagerProps> = ({ 
  userId, 
  renderNewPersonaButton,
  isEditMode = false,
  onEditModeChange
}) => {
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

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Use external edit mode state if provided, otherwise use internal state
  const [internalEditMode, setInternalEditMode] = useState(false);
  const actualEditMode = onEditModeChange ? isEditMode : internalEditMode;
  const setActualEditMode = onEditModeChange ? onEditModeChange : setInternalEditMode;

  const [editedPersona, setEditedPersona] = useState(currentPersona);

  useEffect(() => {
    setEditedPersona(currentPersona);
  }, [currentPersona]);

  const handleEdit = () => {
    setActualEditMode(true);
  };

  const handleCancel = () => {
    setActualEditMode(false);
    setEditedPersona(currentPersona);
  };

  const handleSave = async () => {
    if (editedPersona && currentPersona) {
      try {
        await updatePersona(editedPersona);
        setActualEditMode(false);
      } catch (error) {
        console.error('Error updating persona:', error);
      }
    }
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
        setActualEditMode(false);
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

  const updateField = (field: keyof typeof editedPersona, value: string | string[]) => {
    if (editedPersona) {
      // Handle array fields properly
      let processedValue = value;
      if (typeof value === 'string') {
        // Check if this field should be an array
        const arrayFields = ['content_formats', 'primary_topics', 'secondary_topics', 'content_pillars', 'tone_descriptors', 'style_descriptors'];
        if (arrayFields.includes(field as string)) {
          // Split by comma and trim whitespace
          processedValue = value.split(',').map(item => item.trim()).filter(item => item.length > 0);
        }
      }
      
      setEditedPersona({
        ...editedPersona,
        [field]: processedValue
      });
    }
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

  if (!currentPersona) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="max-w-md">
          <h3 className="text-lg font-semibold mb-2 text-foreground">
            No Persona Found
          </h3>
          <p className="text-muted-foreground mb-6">
            Create your first persona to get started with personalized insights.
          </p>
          {renderNewPersonaButton && renderNewPersonaButton()}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Persona Content */}
      <div>
        {actualEditMode ? (
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
}; 