import React from 'react';
import { FormationEligibility as FormationEligibilityType } from './types';

interface FormationEligibilityProps {
  formationEligibility?: FormationEligibilityType;
}

export const FormationEligibility: React.FC<FormationEligibilityProps> = ({ formationEligibility }) => {
  if (!formationEligibility || formationEligibility.eligible) return null;

  return (
    <div className="p-3 rounded-lg border border-border/50 bg-muted/10">
      <div className="text-sm text-muted-foreground">
        <div className="font-medium mb-1">Formation Requirements:</div>
        <div className="space-y-1 text-xs">
          <div>• Shards: {formationEligibility.shardCount}/3 {formationEligibility.shardCount >= 3 ? '✓' : '✗'}</div>
          <div>• No running formation: {!formationEligibility.hasRunningFormation ? '✓' : '✗'}</div>
        </div>
      </div>
    </div>
  );
};
