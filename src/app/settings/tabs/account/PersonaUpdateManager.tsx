import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PersonaCard } from '../../../dashboard/chat/components/PersonaCard';
import { usePersonaManager } from '../../../dashboard/chat/hooks/usePersonaData';
import { PersonaData } from '../../../dashboard/chat/types';
import { Edit2, Plus } from 'lucide-react';
import { Id } from '@/convex/_generated/dataModel';
import { PersonaEditForm } from './PersonaEditForm';
import { PersonaHistoryItem } from './PersonaHistoryItem';

interface PersonaUpdateManagerProps {
  userId: string;
  renderNewPersonaButton?: () => void;
}

export const PersonaUpdateManager: React.FC<PersonaUpdateManagerProps> = ({ userId, renderNewPersonaButton }) => {
  const {
    currentPersona,
    personaHistory,
    isLoading,
    hasPersona,
    hasHistory,
    updatePersona,
    activatePersona,
    deletePersona,
  } = usePersonaManager(userId);

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

  const handleRestore = async (personaId: Id<'personas'>) => {
    await activatePersona(personaId);
  };

  const handleDelete = async (personaId: Id<'personas'>) => {
    if (confirm('Delete this persona version permanently?')) {
      await deletePersona(personaId);
    }
  };

  const updateField = (field: keyof PersonaData, value: string | string[]) => {
    if (!editedPersona) return;
    setEditedPersona({ ...editedPersona, [field]: value });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
      </div>
    );
  }

  if (!hasPersona) {
    return (
      <div className="text-center py-12 px-4 space-y-6">
        <div className="w-12 h-12 bg-gray-100 rounded-lg mx-auto flex items-center justify-center">
          <Plus className="w-6 h-6 text-gray-400" />
        </div>
        <div className="space-y-4">
          <div>
            <p className="font-medium text-gray-900 text-lg">No persona yet</p>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed max-w-sm mx-auto">
              Create your first persona in chat to get started
            </p>
          </div>
          <Button 
            onClick={() => window.location.href = '/dashboard/chat?ask=hey%20content%20persona'}
            className="w-full sm:w-auto min-h-[48px] px-6"
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
            <h2 className="text-lg font-semibold text-gray-900">Your Persona</h2>
            <p className="text-sm text-gray-500">Current active version</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-2">
            <Button
              variant={isEditMode ? 'default' : 'outline'}
              size="sm"
              onClick={isEditMode ? handleSave : handleEdit}
              className="min-h-[44px] w-full sm:w-auto"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              {isEditMode ? 'Save' : 'Edit'}
            </Button>
            {isEditMode && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleCancel}
                className="min-h-[44px] w-full sm:w-auto"
              >
                Cancel
              </Button>
            )}
            {!isEditMode && renderNewPersonaButton && (
              <Button 
                onClick={renderNewPersonaButton} 
                variant="outline" 
                className="text-heycontent-purple border-heycontent-purple hover:bg-heycontent-purple/10 min-h-[44px] w-full sm:w-auto" 
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
          <PersonaCard persona={currentPersona} userId={userId} />
        )}
      </div>

      {/* History */}
      {hasHistory && (
        <div>
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 text-lg">Previous Versions</h3>
            <p className="text-sm text-gray-500 mt-1">
              {personaHistory.length} previous {personaHistory.length === 1 ? 'version' : 'versions'}
            </p>
          </div>

          <div className="space-y-4">
            {personaHistory.map((persona, index) => (
              <PersonaHistoryItem
                key={persona._id}
                persona={persona}
                version={personaHistory.length - index}
                onRestore={handleRestore}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 