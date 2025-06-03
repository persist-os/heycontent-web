import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AgentProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    agentName: string, 
    useCases: string, 
    targetUsers: string, 
    description: string,
    instructions: string
  ) => Promise<boolean>;
  isSubmitting: boolean;
  error: string | null;
  success: boolean;
  promptTitle: string;
  description: string;
  instructions: string;
}

export function AgentProposalModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  error,
  success,
  promptTitle,
  description,
  instructions,
}: AgentProposalModalProps) {
  const [agentName, setAgentName] = useState('');
  const [useCases, setUseCases] = useState('');
  const [targetUsers, setTargetUsers] = useState('');
  const [agentDescription, setAgentDescription] = useState('');
  const [agentInstructions, setAgentInstructions] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && !success) {
      setAgentName(promptTitle || '');
      setUseCases('');
      setTargetUsers('');
      setAgentDescription(description || '');
      setAgentInstructions(instructions || '');
      setIsDirty(false);
    }
  }, [isOpen, success, promptTitle, description, instructions]);

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
    
    if (!agentName.trim()) {
      return;
    }

    const wasSuccessful = await onSubmit(
      agentName.trim(),
      useCases.trim(),
      targetUsers.trim(),
      agentDescription.trim(),
      agentInstructions.trim()
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

  const isFormValid = agentName.trim().length > 0;

  if (success) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Agent Proposal Submitted!</h3>
            <p className="text-sm text-gray-600 text-center">
              Your agent proposal has been submitted successfully and will be reviewed by our team.
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
            Propose New Agent
          </DialogTitle>
          <DialogDescription>
            Suggest a new agent to be added to our platform. Your proposal will be reviewed by our team.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="agent-name" className="text-sm font-medium text-gray-900 block">
              Agent Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="agent-name"
              value={agentName}
              onChange={(e) => handleInputChange(setAgentName)(e.target.value)}
              placeholder="Name for your proposed agent (e.g., 'Email Subject Line Generator')"
              disabled={isSubmitting}
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              A clear, descriptive name that explains what the agent does.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="use-cases" className="text-sm font-medium text-gray-900 block">
              Use Cases
            </label>
            <Textarea
              id="use-cases"
              value={useCases}
              onChange={(e) => handleInputChange(setUseCases)(e.target.value)}
              placeholder="Describe specific scenarios where this agent would be useful..."
              disabled={isSubmitting}
              className="min-h-24 w-full"
            />
            <p className="text-xs text-gray-500">
              Explain how and when users would benefit from this agent.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="target-users" className="text-sm font-medium text-gray-900 block">
              Target Users
            </label>
            <Input
              id="target-users"
              value={targetUsers}
              onChange={(e) => handleInputChange(setTargetUsers)(e.target.value)}
              placeholder="Who would benefit most from this agent? (e.g., 'Content creators, Social media managers')"
              disabled={isSubmitting}
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              Specify the types of users who would find this agent most valuable.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="agent-description" className="text-sm font-medium text-gray-900 block">
              Agent Description
            </label>
            <Textarea
              id="agent-description"
              value={agentDescription}
              onChange={(e) => handleInputChange(setAgentDescription)(e.target.value)}
              placeholder="Provide a high-level description of the agent's purpose and capabilities..."
              disabled={isSubmitting}
              className="min-h-24 w-full"
            />
            <p className="text-xs text-gray-500">
              A summary of what the agent does and its overall purpose.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="agent-instructions" className="text-sm font-medium text-gray-900 block">
              Agent Instructions
            </label>
            <Textarea
              id="agent-instructions"
              value={agentInstructions}
              onChange={(e) => handleInputChange(setAgentInstructions)(e.target.value)}
              placeholder="Detailed instructions for how the agent should operate..."
              disabled={isSubmitting}
              className="min-h-24 w-full"
            />
            <p className="text-xs text-gray-500">
              Specific guidance for how the agent should process inputs and generate outputs.
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
                  Submit Proposal
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
