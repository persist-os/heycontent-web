import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useOptimizedPersonaManager } from '@/store/persona-store';
import { PersonaData } from '../../../dashboard/chat/types';
import { Edit2, Plus } from 'lucide-react';
import { PersonaEditForm } from './PersonaEditForm';
import { NewPersonaCard } from './NewPersonaCard';

interface PersonaUpdateManagerProps {
  userId: string;
  renderNewPersonaButton?: () => void;
}

export const PersonaUpdateManager: React.FC<PersonaUpdateManagerProps> = ({ userId, renderNewPersonaButton }) => {
  const renderStartTime = performance.now();
  
  const {
    currentPersona,
    isLoading,
    hasPersona,
    updatePersona,
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
            {!isEditMode && renderNewPersonaButton && (
              <Button 
                onClick={renderNewPersonaButton} 
                variant="outline" 
                className="text-purple-500 border-purple-500 hover:bg-purple-50 dark:text-accent dark:border-accent dark:hover:bg-accent/10 min-h-[44px] w-full sm:w-auto" 
                size="sm"
              >
                New Persona
              </Button>
            )}
          </div>
        </div>

        {isEditMode ? (
          <PersonaEditForm persona={editedPersona!} onUpdate={updateField} />
        ) : (
          <NewPersonaCard persona={currentPersona!} />
        )}
      </div>


    </div>
  );
}; 