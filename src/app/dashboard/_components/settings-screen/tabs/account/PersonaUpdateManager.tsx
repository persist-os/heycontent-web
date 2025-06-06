import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PersonaCard } from '../../../chat/components/PersonaCard';
import { usePersonaManager } from '../../../chat/hooks/usePersonaData';
import { PersonaData } from '../../../chat/types';
import { Edit2, Plus } from 'lucide-react';
import { Id } from '@/convex/_generated/dataModel';
import { PersonaEditForm } from './PersonaEditForm';
import { PersonaHistoryItem } from './PersonaHistoryItem';

interface PersonaUpdateManagerProps {
  userId: string;
}

export const PersonaUpdateManager: React.FC<PersonaUpdateManagerProps> = ({ userId }) => {
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

  useEffect(() => {
    if (currentPersona && !editedPersona) {
      setEditedPersona(currentPersona);
    }
  }, [currentPersona, editedPersona]);

  const handleEdit = () => {
    if (currentPersona) {
      setEditedPersona({ ...currentPersona });
      setIsEditMode(true);
    }
  };

  const handleCancel = () => {
    setEditedPersona(currentPersona);
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
      setIsEditMode(false);
      return;
    }

    await updatePersona(changes);
    setIsEditMode(false);
  };

  const handleRestore = async (personaId: Id<"personas">) => {
    await activatePersona(personaId);
  };

  const handleDelete = async (personaId: Id<"personas">) => {
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
      <div className="text-center py-12 space-y-4">
        <div className="w-12 h-12 bg-gray-100 rounded-lg mx-auto flex items-center justify-center">
          <Plus className="w-6 h-6 text-gray-400" />
        </div>
        <div>
          <p className="font-medium text-gray-900">No persona yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Create your first persona in chat to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Persona */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Your Persona</h2>
            <p className="text-sm text-gray-500">Current active version</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={isEditMode ? "default" : "outline"}
              size="sm"
              onClick={isEditMode ? handleSave : handleEdit}
            >
              <Edit2 className="w-4 h-4 mr-1" />
              {isEditMode ? 'Save' : 'Edit'}
            </Button>
            {isEditMode && (
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                Cancel
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
          <div className="mb-4">
            <h3 className="font-medium text-gray-900">Previous Versions</h3>
            <p className="text-sm text-gray-500">
              {personaHistory.length} previous {personaHistory.length === 1 ? 'version' : 'versions'}
            </p>
          </div>

          <div className="space-y-3">
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