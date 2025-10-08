/**
 * FINGERPRINT TAB CONTENT
 * Tab-specific content components
 */

'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { EditableTextField, EditableArrayField } from './FingerprintEditableFields'

const tabAnimation = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 }
}

interface TabProps {
  fingerprint: any
  isEditing: boolean
  getFieldValue: (field: string) => any
  updateField: (field: string, value: any) => void
}

export const VisionTab = ({ fingerprint, isEditing, getFieldValue, updateField }: TabProps) => (
  <motion.div className="space-y-5" {...tabAnimation}>
    {/* Primary fields in 2-column grid on larger screens */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {(getFieldValue('core_intention') || isEditing) && (
        <div className="lg:col-span-2">
          <div className="text-xs uppercase tracking-wide text-muted-foreground/50 mb-2">
            Why This Matters
          </div>
          <EditableTextField
            value={getFieldValue('core_intention')}
            onChange={(val) => updateField('core_intention', val)}
            isEditing={isEditing}
            placeholder="What drives this project? Why does it matter?"
            rows={3}
            className="text-base text-foreground/90"
          />
        </div>
      )}

      {(getFieldValue('success_vision') || isEditing) && (
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground/50 mb-2">
            Success Looks Like
          </div>
          <EditableTextField
            value={getFieldValue('success_vision')}
            onChange={(val) => updateField('success_vision', val)}
            isEditing={isEditing}
            placeholder="What does success look like for this project?"
            rows={2}
          />
        </div>
      )}

      {(getFieldValue('value_creation') || isEditing) && (
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground/50 mb-2">
            The Impact
          </div>
          <EditableTextField
            value={getFieldValue('value_creation')}
            onChange={(val) => updateField('value_creation', val)}
            isEditing={isEditing}
            placeholder="What impact will this create?"
            rows={2}
          />
        </div>
      )}
    </div>

    {/* Arrays in 2-column grid */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-4 border-t border-border/10">
      {((Array.isArray(getFieldValue('tangible_deliverables')) && getFieldValue('tangible_deliverables').length > 0) || isEditing) && (
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground/50 mb-3">
            What We're Creating
          </div>
          <EditableArrayField
            values={getFieldValue('tangible_deliverables') || []}
            onChange={(val) => updateField('tangible_deliverables', val)}
            isEditing={isEditing}
            placeholder="Add a deliverable..."
          />
        </div>
      )}

      {((Array.isArray(getFieldValue('personal_growth')) && getFieldValue('personal_growth').length > 0) || isEditing) && (
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground/50 mb-2">
            Growing Through This
          </div>
          {isEditing ? (
            <EditableArrayField
              values={getFieldValue('personal_growth') || []}
              onChange={(val) => updateField('personal_growth', val)}
              isEditing={isEditing}
              placeholder="Add growth area..."
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              {(getFieldValue('personal_growth') || []).map((growth: string, idx: number) => (
                <span 
                  key={idx}
                  className="px-2.5 py-1 bg-muted/30 rounded-full text-xs text-muted-foreground/80"
                >
                  {growth}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  </motion.div>
)

const EditableField = ({ 
  label, 
  value, 
  field,
  isEditing,
  updateField,
  capitalize = false,
  placeholder
}: { 
  label: string
  value: string | number
  field: string
  isEditing: boolean
  updateField: (field: string, value: any) => void
  capitalize?: boolean
  placeholder?: string
}) => {
  // Handle number fields that need type conversion
  const handleChange = (inputValue: string) => {
    const numberFields = ['learning_sensitivity', 'complexity_level']
    if (numberFields.includes(field)) {
      // Convert to number for number fields
      const numValue = parseFloat(inputValue)
      updateField(field, isNaN(numValue) ? 0 : numValue)
    } else {
      updateField(field, inputValue)
    }
  }

  return (
    <div>
      <div className="text-xs text-muted-foreground/50 mb-1">{label}</div>
      {isEditing ? (
        <input
          type={['learning_sensitivity', 'complexity_level'].includes(field) ? 'number' : 'text'}
          value={value || ''}
          onChange={(e) => handleChange(e.target.value)}
          className="w-full text-sm font-medium bg-muted/20 border border-border/30 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
          placeholder={placeholder}
          min={field === 'learning_sensitivity' ? 1 : field === 'complexity_level' ? 1 : undefined}
          max={field === 'learning_sensitivity' ? 10 : field === 'complexity_level' ? 10 : undefined}
        />
      ) : (
        <div className={`text-sm font-medium ${capitalize ? 'capitalize' : ''}`}>
          {typeof value === 'string' && capitalize ? value.replace(/_/g, ' ') : value}
        </div>
      )}
    </div>
  )
}

export const DNATab = ({ fingerprint, isEditing, getFieldValue, updateField }: TabProps) => (
  <motion.div className="space-y-5" {...tabAnimation}>
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {(getFieldValue('primary_pattern') || isEditing) && (
        <EditableField 
          label="Working Pattern" 
          value={getFieldValue('primary_pattern')} 
          field="primary_pattern"
          isEditing={isEditing}
          updateField={updateField}
          capitalize 
          placeholder="e.g., iterative, waterfall"
        />
      )}
      {(getFieldValue('collaboration_style') || isEditing) && (
        <EditableField 
          label="Team Style" 
          value={getFieldValue('collaboration_style')} 
          field="collaboration_style"
          isEditing={isEditing}
          updateField={updateField}
          capitalize 
          placeholder="e.g., solo, collaborative"
        />
      )}
      {(getFieldValue('complexity_level') || isEditing) && (
        <EditableField 
          label="Complexity" 
          value={isEditing ? getFieldValue('complexity_level') : `Level ${getFieldValue('complexity_level')}/10`} 
          field="complexity_level"
          isEditing={isEditing}
          updateField={updateField}
          placeholder="1-10"
        />
      )}
      {(getFieldValue('sharing_intention') || isEditing) && (
        <EditableField 
          label="Sharing" 
          value={getFieldValue('sharing_intention')} 
          field="sharing_intention"
          isEditing={isEditing}
          updateField={updateField}
          capitalize 
          placeholder="e.g., private, public"
        />
      )}
    </div>

    {/* Text fields in 2-column grid */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-4 border-t border-border/10">
      {(getFieldValue('decision_making') || isEditing) && (
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground/50 mb-2">
            How You Decide
          </div>
          <EditableTextField
            value={getFieldValue('decision_making')}
            onChange={(val) => updateField('decision_making', val)}
            isEditing={isEditing}
            placeholder="How do you make decisions in this project?"
            rows={2}
          />
        </div>
      )}

      {(getFieldValue('energy_patterns') || isEditing) && (
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground/50 mb-2">
            When You Work Best
          </div>
          <EditableTextField
            value={getFieldValue('energy_patterns')}
            onChange={(val) => updateField('energy_patterns', val)}
            isEditing={isEditing}
            placeholder="When do you work best on this?"
            rows={2}
          />
        </div>
      )}
    </div>

    {((Array.isArray(getFieldValue('working_style')) && getFieldValue('working_style').length > 0) || isEditing) && (
      <div className="pt-4 border-t border-border/10">
        <div className="text-xs uppercase tracking-wide text-muted-foreground/50 mb-2">
          Your Styles
        </div>
        {isEditing ? (
          <EditableArrayField
            values={getFieldValue('working_style') || []}
            onChange={(val) => updateField('working_style', val)}
            isEditing={isEditing}
            placeholder="Add working style..."
          />
        ) : (
          <div className="flex flex-wrap gap-2">
            {(getFieldValue('working_style') || []).map((style: string, idx: number) => (
              <span 
                key={idx}
                className="px-2.5 py-1 bg-muted/30 rounded-full text-xs text-muted-foreground/80"
              >
                {style}
              </span>
            ))}
          </div>
        )}
      </div>
    )}
  </motion.div>
)

export const TimelineTab = ({ fingerprint, isEditing, getFieldValue, updateField }: TabProps) => (
  <motion.div className="space-y-5" {...tabAnimation}>
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {(getFieldValue('time_horizon') || isEditing) && (
        <EditableField 
          label="Timeframe" 
          value={getFieldValue('time_horizon')} 
          field="time_horizon"
          isEditing={isEditing}
          updateField={updateField}
          capitalize 
          placeholder="e.g., short-term, long-term"
        />
      )}
      {(getFieldValue('natural_rhythm') || isEditing) && (
        <EditableField 
          label="Rhythm" 
          value={getFieldValue('natural_rhythm')} 
          field="natural_rhythm"
          isEditing={isEditing}
          updateField={updateField}
          capitalize 
          placeholder="e.g., daily, weekly"
        />
      )}
      {(getFieldValue('flexibility_preference') || isEditing) && (
        <EditableField 
          label="Flexibility" 
          value={getFieldValue('flexibility_preference')} 
          field="flexibility_preference"
          isEditing={isEditing}
          updateField={updateField}
          capitalize 
          placeholder="e.g., flexible, structured"
        />
      )}
      {(getFieldValue('feedback_frequency') || isEditing) && (
        <EditableField 
          label="Check-ins" 
          value={getFieldValue('feedback_frequency')} 
          field="feedback_frequency"
          isEditing={isEditing}
          updateField={updateField}
          capitalize 
          placeholder="e.g., weekly, monthly"
        />
      )}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-4 border-t border-border/10">
      {(getFieldValue('measurement_approach') || isEditing) && (
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground/50 mb-2">
            How to Measure Progress
          </div>
          <EditableTextField
            value={getFieldValue('measurement_approach')}
            onChange={(val) => updateField('measurement_approach', val)}
            isEditing={isEditing}
            placeholder="How do you measure progress?"
            rows={2}
          />
        </div>
      )}

      {((Array.isArray(getFieldValue('intangible_benefits')) && getFieldValue('intangible_benefits').length > 0) || isEditing) && (
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground/50 mb-3">
            Beyond Deliverables
          </div>
          <EditableArrayField
            values={getFieldValue('intangible_benefits') || []}
            onChange={(val) => updateField('intangible_benefits', val)}
            isEditing={isEditing}
            placeholder="Add intangible benefit..."
          />
        </div>
      )}
    </div>
  </motion.div>
)

export const PreferencesTab = ({ fingerprint, isEditing, getFieldValue, updateField }: TabProps) => (
  <motion.div className="space-y-5" {...tabAnimation}>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {(getFieldValue('cognitive_load_preference') || isEditing) && (
        <EditableField 
          label="Cognitive Load" 
          value={getFieldValue('cognitive_load_preference')} 
          field="cognitive_load_preference"
          isEditing={isEditing}
          updateField={updateField}
          capitalize 
          placeholder="e.g., low, high"
        />
      )}
      {(getFieldValue('information_density') || isEditing) && (
        <EditableField 
          label="Info Density" 
          value={getFieldValue('information_density')} 
          field="information_density"
          isEditing={isEditing}
          updateField={updateField}
          capitalize 
          placeholder="e.g., sparse, dense"
        />
      )}
      {(getFieldValue('learning_sensitivity') || isEditing) && (
        <EditableField 
          label="Adaptivity" 
          value={isEditing ? getFieldValue('learning_sensitivity') : `${getFieldValue('learning_sensitivity')}/10`} 
          field="learning_sensitivity"
          isEditing={isEditing}
          updateField={updateField}
          placeholder="1-10"
        />
      )}
    </div>

    {((Array.isArray(getFieldValue('motivation_style')) && getFieldValue('motivation_style').length > 0) || isEditing) && (
      <div className="pt-4 border-t border-border/10">
        <div className="text-xs uppercase tracking-wide text-muted-foreground/50 mb-2">
          What Motivates You
        </div>
        {isEditing ? (
          <EditableArrayField
            values={getFieldValue('motivation_style') || []}
            onChange={(val) => updateField('motivation_style', val)}
            isEditing={isEditing}
            placeholder="Add motivation style..."
          />
        ) : (
          <div className="flex flex-wrap gap-2">
            {(getFieldValue('motivation_style') || []).map((style: string, idx: number) => (
              <span 
                key={idx}
                className="px-2.5 py-1 bg-muted/30 rounded-full text-xs text-muted-foreground/80"
              >
                {style}
              </span>
            ))}
          </div>
        )}
      </div>
    )}
  </motion.div>
)
