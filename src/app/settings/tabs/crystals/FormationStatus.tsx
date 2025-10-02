import React from 'react';
import { Activity, CheckCircle, XCircle, Clock } from 'lucide-react';
import { FormationStatus as FormationStatusType } from './types';
import { formatTimeSince } from './hooks';

interface FormationStatusProps {
  formationStatus?: FormationStatusType;
}

export const FormationStatus: React.FC<FormationStatusProps> = ({ formationStatus }) => {
  if (!formationStatus) return null;

  return (
    <div className="p-3 rounded-lg border border-border/50 bg-muted/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {formationStatus.isRunning ? (
            <>
              <Activity className="h-4 w-4 text-foreground animate-pulse" />
              <div>
                <div className="font-medium text-foreground">Formation Running</div>
                <div className="text-sm text-muted-foreground">Processing crystals...</div>
              </div>
            </>
          ) : formationStatus.lastRunStatus === 'completed' ? (
            <>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium text-foreground">Last Run Completed</div>
                <div className="text-sm text-muted-foreground">
                  {formationStatus.timeSinceLastRun ? formatTimeSince(formationStatus.timeSinceLastRun) : 'Recently'}
                </div>
              </div>
            </>
          ) : formationStatus.lastRunStatus === 'failed' ? (
            <>
              <XCircle className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium text-foreground">Last Run Failed</div>
                <div className="text-sm text-muted-foreground">
                  {formationStatus.timeSinceLastRun ? formatTimeSince(formationStatus.timeSinceLastRun) : 'Recently'}
                </div>
              </div>
            </>
          ) : (
            <>
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium text-foreground">Ready to Start</div>
                <div className="text-sm text-muted-foreground">No recent formations</div>
              </div>
            </>
          )}
        </div>
        
        {formationStatus.history && formationStatus.history.length > 0 && (
          <div className="text-right">
            <div className="text-sm font-medium text-foreground">
              {formationStatus.history.length} recent runs
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
