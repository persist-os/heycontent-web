import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
import { CrystalData } from './types';
import { useCrystalMutations } from './hooks';
import { T } from '@/components/translation/T';
import { useTranslation } from '@/hooks/useTranslation';

interface EditCrystalModalProps {
  crystal: CrystalData;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const EditCrystalModal: React.FC<EditCrystalModalProps> = ({
  crystal,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { updateCrystal, isLoading } = useCrystalMutations();
  const [formData, setFormData] = useState({
    name: crystal.name || '',
    description: crystal.description || '',
    dimension: crystal.dimension || '',
    confidence_score: crystal.confidence_score || 'developing',
    core_insight: crystal.core_insight || '',
  });

  // Translated placeholders
  const { text: namePlaceholder } = useTranslation('Crystal name', {
    context: 'input.crystal.name.placeholder'
  })
  const { text: dimensionPlaceholder } = useTranslation('e.g., work_style, communication, creativity', {
    context: 'input.crystal.dimension.placeholder'
  })
  const { text: descriptionPlaceholder } = useTranslation('Describe what this crystal represents', {
    context: 'input.crystal.description.placeholder'
  })
  const { text: insightPlaceholder } = useTranslation('The key insight this crystal provides', {
    context: 'input.crystal.insight.placeholder'
  })

  const handleSave = async () => {
    const success = await updateCrystal(crystal._id, formData);
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Crystal</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder={namePlaceholder}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dimension">Dimension</Label>
            <Input
              id="dimension"
              value={formData.dimension}
              onChange={(e) => handleChange('dimension', e.target.value)}
              placeholder={dimensionPlaceholder}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confidence">Confidence Score</Label>
            <Select
              value={formData.confidence_score}
              onValueChange={(value) => handleChange('confidence_score', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="developing">Developing</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="very_high">Very High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder={descriptionPlaceholder}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="core_insight">Core Insight</Label>
            <Textarea
              id="core_insight"
              value={formData.core_insight}
              onChange={(e) => handleChange('core_insight', e.target.value)}
              placeholder={insightPlaceholder}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            <T context="button.cancel">Cancel</T>
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? <T context="button.saving">Saving...</T> : <T context="button.save_changes">Save Changes</T>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
