'use client'

import React from 'react'

interface SimpleProgressDisplayProps {
  confidence: number
  fieldBasedConfidence?: number
  completedFields: number
  partialFields?: number
  emptyFields?: number
  totalFields: number
  completionPercentage?: number
  nextPriorityField?: string | null
  missingFields?: string[]
  isComplete?: boolean
  onGenerateFingerprint: () => void
  isLoading?: boolean
  className?: string
}

export const SimpleProgressDisplay: React.FC<SimpleProgressDisplayProps> = ({
  confidence,
  fieldBasedConfidence,
  completedFields,
  partialFields = 0,
  emptyFields = 0,
  totalFields,
  completionPercentage,
  nextPriorityField,
  missingFields = [],
  isComplete = false,
  onGenerateFingerprint,
  isLoading = false,
  className = ''
}) => {
  // Use field-based confidence if available, otherwise fall back to regular confidence
  const effectiveConfidence = fieldBasedConfidence ?? confidence
  const percentage = Math.round(effectiveConfidence * 100)
  const displayPercentage = completionPercentage ? Math.round(completionPercentage * 100) : percentage
  
  return (
    <div className={`mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200 ${className}`}>
      {/* Progress Header */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-blue-900">
            Discovery Progress
          </span>
          <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
            {completedFields + partialFields}/{totalFields} fields
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-sm font-semibold text-blue-700">
            {displayPercentage}% complete
          </span>
          {fieldBasedConfidence && fieldBasedConfidence !== confidence && (
            <span className="text-xs text-blue-500">
              Field-based: {Math.round(fieldBasedConfidence * 100)}%
            </span>
          )}
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-blue-200 rounded-full h-2 mb-3">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${displayPercentage}%` }}
        />
      </div>
      
      {/* Generate Button */}
      {completedFields > 0 && (
        <button 
          onClick={onGenerateFingerprint}
          disabled={isLoading}
          className={`
            w-full px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
            ${isLoading 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-green-100 text-green-700 hover:bg-green-200 active:bg-green-300'
            }
          `}
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              <span>Generating...</span>
            </div>
          ) : (
            `Generate Fingerprint (${percentage}% complete)`
          )}
        </button>
      )}
      
      {/* Progress Description */}
      <div className="mt-2 text-xs text-blue-600">
        {completedFields === 0 && partialFields === 0 && (
          <span>Start chatting to build your project fingerprint</span>
        )}
        {(completedFields > 0 || partialFields > 0) && !isComplete && (
          <div className="space-y-1">
            <span>Keep exploring to capture more project details</span>
            {nextPriorityField && (
              <div className="text-blue-500">
                Next: {nextPriorityField.replace(/_/g, ' ')}
              </div>
            )}
            {partialFields > 0 && (
              <div className="text-blue-500">
                {partialFields} fields partially complete
              </div>
            )}
          </div>
        )}
        {isComplete && (
          <span className="text-green-600 font-medium">All core fields captured! Ready to generate.</span>
        )}
      </div>
    </div>
  )
}

export default SimpleProgressDisplay
