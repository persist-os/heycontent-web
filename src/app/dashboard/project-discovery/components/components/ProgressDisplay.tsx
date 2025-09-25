import React from 'react';
import { Button } from '@/components/ui/button';
import { ProgressMetrics } from '../types/progressTypes';

interface ProgressDisplayProps {
  progress: ProgressMetrics;
  missingAreas: string[];
  isGeneratingFingerprint: boolean;
  onGenerateFingerprint: () => void;
  showGenerateButton?: boolean;
  className?: string;
}

export function ProgressDisplay({
  progress,
  missingAreas,
  isGeneratingFingerprint,
  onGenerateFingerprint,
  showGenerateButton = true,
  className = ''
}: ProgressDisplayProps): JSX.Element {
  const confidenceScore = progress.fieldBasedConfidence;
  const completionPercentage = Math.round(progress.completionPercentage * 100);
  const confidenceLevel = confidenceScore >= 0.8 ? 'High' : confidenceScore >= 0.5 ? 'Medium' : 'Low';
  const confidenceColor = confidenceScore >= 0.8 ? 'bg-green-500' : confidenceScore >= 0.5 ? 'bg-yellow-500' : 'bg-gray-400';
  const badgeClass = "px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs";

  return (
    <div className={`mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800/20 rounded-lg ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100">Project Fingerprint Progress</h3>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${confidenceColor}`} />
          <span className="text-sm text-blue-700 dark:text-blue-300">{completionPercentage}% Complete</span>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-blue-800 dark:text-blue-200">Confidence Level:</span>
          <span className="text-blue-600 dark:text-blue-400">{confidenceLevel}</span>
        </div>
        {/* Field completion breakdown */}
        <div className="text-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-blue-800 dark:text-blue-200">Fields Progress:</span>
            <span className="text-blue-600 dark:text-blue-400">{progress.completedFields}/{progress.totalFields} complete</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-blue-700 dark:text-blue-300">{progress.completedFields} complete</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-blue-700 dark:text-blue-300">{progress.partialFields} partial</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span className="text-blue-700 dark:text-blue-300">{progress.emptyFields} empty</span>
            </div>
          </div>
        </div>
        
        {missingAreas.length > 0 && (
          <div className="text-sm">
            <span className="text-blue-800 dark:text-blue-200">Missing areas:</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {missingAreas.slice(0, 3).map((area, index) => <span key={index} className={badgeClass}>{area}</span>)}
              {missingAreas.length > 3 && <span className={badgeClass}>+{missingAreas.length - 3} more</span>}
            </div>
          </div>
        )}
        {showGenerateButton && confidenceScore >= 0.7 && (
          <div className="pt-2">
            <Button onClick={onGenerateFingerprint} disabled={isGeneratingFingerprint} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
              {isGeneratingFingerprint ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating Fingerprint...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  Generate Fingerprint
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
