/**
 * Fingerprint Status Component
 * 
 * React component for displaying fingerprint status, completion indicators,
 * and action buttons in the project discovery system. Provides visual
 * feedback on fingerprint generation and completion status.
 * 
 * Used by: Main container component, fingerprint management components
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { FingerprintState } from '../types/discoveryTypes';

/**
 * Props interface for the FingerprintStatus component
 */
interface FingerprintStatusProps {
  /** Current fingerprint state data */
  fingerprintState: FingerprintState;
  /** Whether fingerprint generation is in progress */
  isGeneratingFingerprint: boolean;
  /** Callback for generating fingerprint */
  onGenerateFingerprint: () => void;
  /** Whether to show the generate button */
  showGenerateButton?: boolean;
  /** Whether to show the status display */
  showStatus?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * FingerprintStatus Component
 * 
 * Displays project fingerprint status with completion indicators,
 * confidence levels, missing areas, and action buttons.
 * 
 * @param props - Component props
 * @returns JSX element displaying fingerprint status information
 */
export function FingerprintStatus({
  fingerprintState,
  isGeneratingFingerprint,
  onGenerateFingerprint,
  showGenerateButton = true,
  showStatus = true,
  className = ''
}: FingerprintStatusProps): JSX.Element {
  const confidenceScore = fingerprintState.confidence_score;
  const completionPercentage = Math.round(confidenceScore * 100);
  
  const getConfidenceLevel = (score: number): string => {
    if (score >= 0.8) return 'High';
    if (score >= 0.5) return 'Medium';
    return 'Low';
  };

  const getConfidenceColor = (score: number): string => {
    if (score >= 0.8) return 'bg-green-500';
    if (score >= 0.5) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  if (!showStatus) {
    return <></>;
  }

  return (
    <div className={`mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800/20 rounded-lg ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100">
          Project Fingerprint Progress
        </h3>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${getConfidenceColor(confidenceScore)}`} />
          <span className="text-sm text-blue-700 dark:text-blue-300">
            {completionPercentage}% Complete
          </span>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-blue-800 dark:text-blue-200">Confidence Level:</span>
          <span className="text-blue-600 dark:text-blue-400">
            {getConfidenceLevel(confidenceScore)}
          </span>
        </div>
        
        {fingerprintState.missing_areas.length > 0 && (
          <div className="text-sm">
            <span className="text-blue-800 dark:text-blue-200">Missing areas:</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {fingerprintState.missing_areas.slice(0, 3).map((area, index) => (
                <span key={index} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">
                  {area}
                </span>
              ))}
              {fingerprintState.missing_areas.length > 3 && (
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">
                  +{fingerprintState.missing_areas.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}
        
        {showGenerateButton && confidenceScore >= 0.7 && !fingerprintState.is_complete && (
          <div className="pt-2">
            <Button
              onClick={onGenerateFingerprint}
              disabled={isGeneratingFingerprint}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isGeneratingFingerprint ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating Fingerprint...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
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

export default FingerprintStatus;
