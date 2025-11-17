import React, { useState } from 'react';
import { BaseModal } from '@/components/ui/base-modal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ShardData } from './types';
import { useShardMutations } from './hooks';

interface EditShardModalProps {
  shard: ShardData;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const EditShardModal: React.FC<EditShardModalProps> = ({
  shard,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { updateShard, isLoading } = useShardMutations();
  const [formData, setFormData] = useState({
    exact_quote: shard.exact_quote || '',
    what_it_reveals: shard.what_it_reveals || '',
    why_significant: shard.why_significant || '',
    dimension: shard.dimension || '',
    confidence_level: shard.confidence_level || 'low',
    source_type: shard.source_type || 'conversation',
  });

  const handleSave = async () => {
    const success = await updateShard(shard._id, formData);
    if (success) {
      // Small delay to prevent immediate re-renders causing UI freeze
      setTimeout(() => {
        onClose();
        onSuccess?.(); // Optional callback for parent components
      }, 100);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Shard"
      variant="edit-shard"
      maxWidth="lg"
      onConfirm={handleSave}
      onCancel={onClose}
      confirmText="Save Changes"
      cancelText="Cancel"
      isLoading={isLoading}
      loadingText="Saving..."
    >
      <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="exact_quote">Quote</Label>
            <Textarea
              id="exact_quote"
              value={formData.exact_quote}
              onChange={(e) => handleChange('exact_quote', e.target.value)}
              placeholder="The exact quote or observation"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dimension">Dimension</Label>
            <Input
              id="dimension"
              value={formData.dimension}
              onChange={(e) => handleChange('dimension', e.target.value)}
              placeholder="e.g., work_style, communication, creativity"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confidence_level">Confidence Level</Label>
            <Select
              value={formData.confidence_level}
              onValueChange={(value) => handleChange('confidence_level', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="source_type">Source Type</Label>
            <Select
              value={formData.source_type}
              onValueChange={(value) => handleChange('source_type', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="conversation">Conversation</SelectItem>
                <SelectItem value="note">Note</SelectItem>
                <SelectItem value="document">Document</SelectItem>
                <SelectItem value="behavior_observation">Behavior Observation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="what_it_reveals">What It Reveals</Label>
            <Textarea
              id="what_it_reveals"
              value={formData.what_it_reveals}
              onChange={(e) => handleChange('what_it_reveals', e.target.value)}
              placeholder="What this shard reveals about the person"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="why_significant">Why Significant</Label>
            <Textarea
              id="why_significant"
              value={formData.why_significant}
              onChange={(e) => handleChange('why_significant', e.target.value)}
              placeholder="Why this observation is significant"
              rows={2}
            />
          </div>
        </div>
    </BaseModal>
  );
};
