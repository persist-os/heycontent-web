'use client'

/**
 * Project Execution Plan Modal
 * 
 * Minimal plan preview with execution trigger.
 * Shows plan steps and allows execution, editing, or regeneration.
 */

import React from 'react'
import { Play, Clock, RefreshCw, Edit3, AlertCircle } from 'lucide-react'
import { T } from '@/components/translation'
import { BaseModal } from '@/components/ui/base-modal'
import { ExecutionPlan } from '@/app/lib/services/projectExecutionService'
import { formatDistanceToNow } from './utils/dateFormatting'

interface ProjectExecutionPlanModalProps {
  isOpen: boolean
  onClose: () => void
  onExecute: () => void
  onRegenerate?: () => void
  plan: ExecutionPlan | null
  isExecuting: boolean
  isExistingPlan?: boolean
}

export function ProjectExecutionPlanModal({
  isOpen,
  onClose,
  onExecute,
  onRegenerate,
  plan,
  isExecuting,
  isExistingPlan = false
}: ProjectExecutionPlanModalProps) {
  if (!plan) return null

  const planAge = plan.createdAt 
    ? formatDistanceToNow(new Date(plan.createdAt), { addSuffix: true })
    : null

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onExecute}
      title="Execution Plan"
      titleContext="modal.execution_plan_title"
      description="Review and execute your project plan"
      descriptionContext="modal.execution_plan_description"
      confirmText="Execute Plan"
      confirmContext="button.execute_plan"
      cancelText="Cancel"
      cancelContext="button.cancel"
      variant="project-execution-plan"
      isLoading={isExecuting}
      loadingText="Executing..."
      loadingContext="button.executing"
      maxWidth="2xl"
    >
      {/* Plan Summary */}
      <div className="space-y-4">
        {/* Plan Status Banner */}
        <div className="flex items-center justify-between gap-3 p-3 bg-muted/30 border border-border rounded-lg">
          <div className="flex items-center gap-2">
            {isExistingPlan ? (
              <>
                <AlertCircle className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  Previously Generated {planAge && `· ${planAge}`}
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  New Plan
                </span>
              </>
            )}
          </div>
          
          {/* Action Buttons */}
          {isExistingPlan && onRegenerate && (
            <div className="flex items-center gap-2">
              <button
                onClick={onRegenerate}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted/50"
                title="Generate a new plan"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Regenerate
              </button>
            </div>
          )}
        </div>
        {/* Duration Estimate */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>Estimated: {plan.totalEstimatedDurationMinutes} minutes</span>
          <span className="ml-auto">{plan.steps.length} steps</span>
        </div>

        {/* Steps List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {plan.steps.map((step, index) => (
            <div 
              key={index}
              className="border border-border rounded-lg p-4 bg-muted/20"
            >
              {/* Step Header */}
              <div className="flex items-start gap-3 mb-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  {step.executionOrder}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{step.widgetTitle}</h4>
                  {step.timing !== 'now' && (
                    <span className="text-xs text-muted-foreground">
                      Timing: {step.timing}
                    </span>
                  )}
                </div>
                {step.skipRecommended && (
                  <span className="text-xs px-2 py-1 bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 rounded">
                    Skip Recommended
                  </span>
                )}
              </div>

              {/* Rationale */}
              <p className="text-sm text-muted-foreground ml-9">
                {step.rationale}
              </p>
            </div>
          ))}
        </div>

        {/* Cognitive Context (if available) */}
        {plan.cognitiveContext && (
          <div className="bg-muted/30 border border-border rounded-lg p-4">
            <h4 className="text-sm font-medium mb-2">AI Context</h4>
            <p className="text-xs text-muted-foreground">
              {plan.cognitiveContext}
            </p>
          </div>
        )}
      </div>
    </BaseModal>
  )
}

