import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Zap, Users, Settings, PlayCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { fetchWithAuth } from '@/app/lib/api-helpers';
import { FormationStatus, FormationEligibility } from './types';

interface FormationActionsProps {
  userId: string;
  formationStatus?: FormationStatus;
  formationEligibility?: FormationEligibility;
}

export const FormationActions: React.FC<FormationActionsProps> = ({ 
  userId, 
  formationStatus, 
  formationEligibility 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleManualCrystalGeneration = async () => {
    if (!userId || isGenerating) return;

    if (formationStatus?.isRunning) {
      toast.error('Formation is already running. Please wait for it to complete.', {
        duration: 5000,
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const response = await fetchWithAuth('/api/crystal-formation/manual', {
        method: 'POST',
        body: JSON.stringify({ force: false })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        if (result.triggered) {
          toast.success(result.message || 'Crystal generation completed successfully!', {
            duration: 5000,
          });
          window.location.reload();
        } else {
          toast(result.message || 'Crystal generation not triggered - requirements not met', {
            duration: 5000,
            icon: 'ℹ️',
          });
        }
      } else {
        throw new Error(result.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Crystal generation error:', error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : 'Failed to generate crystals. Please try again.',
        { duration: 5000 }
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBackgroundFormationCycle = async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    
    try {
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const response = await fetchWithAuth(`${BACKEND_URL}/api/v1/background-tasks/crystal-formation-cycle`, {
        method: 'POST'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success(
          `Background cycle completed: ${result.formations_triggered}/${result.users_processed} formations triggered`, 
          { duration: 6000 }
        );
        window.location.reload();
      } else {
        throw new Error(result.error || 'Background cycle failed');
      }
    } catch (error) {
      console.error('Background formation cycle error:', error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : 'Failed to run background formation cycle.',
        { duration: 5000 }
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFormationMaintenance = async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    
    try {
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const response = await fetchWithAuth(`${BACKEND_URL}/api/v1/background-tasks/formation-maintenance`, {
        method: 'POST'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success('Formation maintenance completed successfully!', { duration: 5000 });
      } else {
        throw new Error(result.error || 'Formation maintenance failed');
      }
    } catch (error) {
      console.error('Formation maintenance error:', error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : 'Failed to run formation maintenance.',
        { duration: 5000 }
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleActiveUserFormations = async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    
    try {
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const response = await fetchWithAuth(`${BACKEND_URL}/api/v1/background-tasks/active-user-formations`, {
        method: 'POST'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success(
          `Active user check completed: ${result.formations_triggered}/${result.users_processed} formations triggered`, 
          { duration: 6000 }
        );
        window.location.reload();
      } else {
        throw new Error(result.error || 'Active user formations failed');
      }
    } catch (error) {
      console.error('Active user formations error:', error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : 'Failed to run active user formations.',
        { duration: 5000 }
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Primary Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Button
          onClick={handleManualCrystalGeneration}
          disabled={isGenerating || formationStatus?.isRunning}
          variant="outline"
          size="sm"
          className="gap-2 justify-start"
        >
          {isGenerating || formationStatus?.isRunning ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              {formationStatus?.isRunning ? 'Running...' : 'Generating...'}
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" />
              Manual Generation
            </>
          )}
        </Button>
        
        <Button
          onClick={handleBackgroundFormationCycle}
          disabled={isGenerating || formationStatus?.isRunning}
          variant="outline"
          size="sm"
          className="gap-2 justify-start"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <PlayCircle className="h-4 w-4" />
              Background Cycle
            </>
          )}
        </Button>
      </div>
      
      {/* Advanced Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Button
          onClick={handleActiveUserFormations}
          disabled={isGenerating || formationStatus?.isRunning}
          variant="ghost"
          size="sm"
          className="gap-2 justify-start text-muted-foreground hover:text-foreground"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <Users className="h-4 w-4" />
              Active Users Check
            </>
          )}
        </Button>
        
        <Button
          onClick={handleFormationMaintenance}
          disabled={isGenerating || formationStatus?.isRunning}
          variant="ghost"
          size="sm"
          className="gap-2 justify-start text-muted-foreground hover:text-foreground"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Maintaining...
            </>
          ) : (
            <>
              <Settings className="h-4 w-4" />
              System Maintenance
            </>
          )}
        </Button>
      </div>

      {/* Helper Text */}
      <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
        <p className="font-medium mb-1">Crystal Formation Options:</p>
        <ul className="space-y-1">
          <li>• <strong>Manual:</strong> Generate crystals for your account (3+ shards required)</li>
          <li>• <strong>Background:</strong> Run system-wide formation cycle for all eligible users</li>
          <li>• <strong>Active Users:</strong> Check formations for recently active users only</li>
          <li>• <strong>Maintenance:</strong> Run cleanup and optimization tasks</li>
        </ul>
        {formationStatus?.isRunning && (
          <div className="mt-2 p-2 bg-muted/20 rounded border border-border/30">
            <strong>Note:</strong> Formation is currently running. Actions are disabled until completion.
          </div>
        )}
      </div>
    </div>
  );
};
