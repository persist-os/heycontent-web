import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EditRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (requestTitle: string, justification: string, newDescription: string, newInstructions: string) => Promise<boolean>;
  isSubmitting: boolean;
  error: string | null;
  success: boolean;
  promptTitle: string;
  oldDescription?: string;
  oldInstructions?: string;
}

export function EditRequestModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  error,
  success,
  promptTitle,
  oldDescription = '',
  oldInstructions = '',
}: EditRequestModalProps) {
  const [requestTitle, setRequestTitle] = useState('');
  const [justification, setJustification] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newInstructions, setNewInstructions] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && !success) {
      setRequestTitle('');
      setJustification('');
      setNewDescription(oldDescription || '');
      setNewInstructions(oldInstructions || '');
      setIsDirty(false);
    }
  }, [isOpen, success, oldDescription, oldInstructions]);

  // Auto-close modal after successful submission
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!requestTitle.trim() || !justification.trim() || !newDescription.trim() || !newInstructions.trim()) {
      return;
    }

    const wasSuccessful = await onSubmit(
      requestTitle.trim(),
      justification.trim(),
      newDescription.trim(),
      newInstructions.trim()
    );
    if (wasSuccessful) {
      setIsDirty(false);
    }
  };

  const handleClose = () => {
    if (isDirty && !success) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to close?');
      if (!confirmed) return;
    }
    onClose();
  };

  const handleInputChange = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setIsDirty(true);
  };

  const isFormValid = requestTitle.trim().length > 0 && justification.trim().length > 0 && newDescription.trim().length > 0 && newInstructions.trim().length > 0;

  if (success) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Edit Request Submitted!</h3>
            <p className="text-sm text-gray-600 text-center">
              Your edit request has been submitted successfully and will be reviewed by our team.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Propose Edit Request
          </DialogTitle>
          <DialogDescription>
            Suggest improvements to the prompt "<strong>{promptTitle}</strong>". Your request will be reviewed by our team.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="request-title" className="text-sm font-medium text-gray-900 block">
              Request Title <span className="text-red-500">*</span>
            </label>
            <Input
              id="request-title"
              value={requestTitle}
              onChange={(e) => handleInputChange(setRequestTitle)(e.target.value)}
              placeholder="Brief title for your edit request (e.g., 'Improve tone for younger audience')"
              disabled={isSubmitting}
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              A short, descriptive title that summarizes your proposed changes.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="justification" className="text-sm font-medium text-gray-900 block">
              Justification <span className="text-red-500">*</span>
            </label>
            <Textarea
              id="justification"
              value={justification}
              onChange={(e) => handleInputChange(setJustification)(e.target.value)}
              placeholder="Explain why this edit would improve the prompt. Include specific details about what you'd like to change and the expected benefits..."
              disabled={isSubmitting}
              className="min-h-32 w-full"
            />
            <p className="text-xs text-gray-500">
              Provide detailed reasoning for your proposed changes. This helps our team understand your vision.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="new-description" className="text-sm font-medium text-gray-900 block">
              New Description <span className="text-red-500">*</span>
            </label>
            <Textarea
              id="new-description"
              value={newDescription}
              onChange={(e) => handleInputChange(setNewDescription)(e.target.value)}
              placeholder="Enter the updated description for the prompt..."
              disabled={isSubmitting}
              className="min-h-24 w-full"
            />
            <p className="text-xs text-gray-500">
              Provide the full new description as you want it to appear in the prompt.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="new-instructions" className="text-sm font-medium text-gray-900 block">
              New Instructions <span className="text-red-500">*</span>
            </label>
            <Textarea
              id="new-instructions"
              value={newInstructions}
              onChange={(e) => handleInputChange(setNewInstructions)(e.target.value)}
              placeholder="Enter the updated instructions for the prompt..."
              disabled={isSubmitting}
              className="min-h-24 w-full"
            />
            <p className="text-xs text-gray-500">
              Provide the full new instructions as you want them to appear in the prompt.
            </p>
          </div>

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Request
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 