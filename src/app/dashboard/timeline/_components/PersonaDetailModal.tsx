import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, User, RotateCcw } from 'lucide-react';
import { NewPersonaCard } from '@/app/settings/tabs/account/NewPersonaCard';
import { useMutation, useConvex } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { getCurrentUserId } from '@/app/lib/api-helpers';
import { toast } from 'react-hot-toast';
import { usePersonaStore } from '@/store/persona-store';

interface PersonaDetailModalProps {
  persona: any;
  onClose: () => void;
  onViewFull: () => void;
}

export const PersonaDetailModal: React.FC<PersonaDetailModalProps> = ({ persona, onClose, onViewFull }) => {
  const [isRestoring, setIsRestoring] = React.useState(false);
  const activatePersona = useMutation(api.personas.activatePersona);
  const userId = getCurrentUserId();
  const convex = useConvex();
  const refreshPersonaData = usePersonaStore(state => state.refreshPersonaData);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Transform the raw persona data to match PersonaData interface for NewPersonaCard
  const transformedPersona = {
    current_name: persona.current_name || '',
    current_description: persona.current_description || '',
    experience_level: persona.experience_level || '',
    content_formats: persona.content_formats || [],
    content_tone: persona.content_tone || '',
    content_voice: persona.content_voice || '',
    content_pillars: persona.content_pillars || [],
    unique_value: persona.unique_value || '',
    future_name: persona.future_name || '',
    future_description: persona.future_description || '',
    goals: persona.goals || [],
    desired_impact: persona.desired_impact || '',
    primary_topics: persona.primary_topics || [],
    secondary_topics: persona.secondary_topics || [],
    tone_descriptors: persona.tone_descriptors || [],
    style_descriptors: persona.style_descriptors || [],
    audience_type: persona.audience_type || '',
    engagement_style: persona.engagement_style || [],
  };

  const handleRestore = async () => {
    if (!userId || !persona?._id) {
      toast.error('User or persona ID missing.');
      return;
    }
    setIsRestoring(true);
    try {
      await activatePersona({ personaId: persona._id, userId });
      // Ensure we see the latest data immediately
      await refreshPersonaData(userId, convex);
      toast.success('Persona restored as active!');
      onClose();
    } catch (err) {
      toast.error('Failed to restore persona.');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-card rounded-xl border border-border shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground">
                  {persona.current_name || 'Unnamed Persona'}
                </h3>
                <div className="flex items-center space-x-3 mt-1">
                  <Badge variant={persona.isActive ? "default" : "outline"} className="text-xs">
                    {persona.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Created {formatDate(persona.createdAt)}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground p-2 hover:bg-muted rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Full Persona Card */}
          <div className="mb-6">
            <NewPersonaCard persona={transformedPersona} />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-border">
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
            >
              Close
            </Button>
            <Button
              onClick={handleRestore}
              className="bg-primary hover:bg-primary/90"
              size="sm"
              disabled={persona.isActive || isRestoring}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              {isRestoring ? 'Restoring...' : persona.isActive ? 'Active' : 'Restore as Active'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}; 