/**
 * FINGERPRINT TAB CONTENT
 * Tab-specific content components
 */

'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { EditableTextField, EditableArrayField } from './FingerprintEditableFields'
import { T } from '@/components/translation/T'

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
            <T context="fingerprint.vision.why_matters">Why This Matters</T>
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
            <T context="fingerprint.vision.success_looks_like">Success Looks Like</T>
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
            <T context="fingerprint.vision.impact">The Impact</T>
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
            <T context="fingerprint.vision.what_creating">What We're Creating</T>
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
            <T context="fingerprint.vision.growing_through">Growing Through This</T>
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
  label: React.ReactNode
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
          label={<T context="fingerprint.dna.working_pattern">Working Pattern</T>}
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
          label={<T context="fingerprint.dna.team_style">Team Style</T>}
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
          label={<T context="fingerprint.dna.complexity">Complexity</T>}
          value={isEditing ? getFieldValue('complexity_level') : `Level ${getFieldValue('complexity_level')}/10`} 
          field="complexity_level"
          isEditing={isEditing}
          updateField={updateField}
          placeholder="1-10"
        />
      )}
      {(getFieldValue('sharing_intention') || isEditing) && (
        <EditableField 
          label={<T context="fingerprint.dna.sharing">Sharing</T>}
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
            <T context="fingerprint.dna.how_decide">How You Decide</T>
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
            <T context="fingerprint.dna.work_best">When You Work Best</T>
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
          <T context="fingerprint.dna.your_styles">Your Styles</T>
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
          label={<T context="fingerprint.timeline.timeframe">Timeframe</T>}
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
          label={<T context="fingerprint.timeline.rhythm">Rhythm</T>}
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
          label={<T context="fingerprint.timeline.flexibility">Flexibility</T>}
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
          label={<T context="fingerprint.timeline.checkins">Check-ins</T>}
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
            <T context="fingerprint.timeline.measure_progress">How to Measure Progress</T>
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
            <T context="fingerprint.timeline.beyond_deliverables">Beyond Deliverables</T>
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
          label={<T context="fingerprint.preferences.cognitive_load">Cognitive Load</T>}
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
          label={<T context="fingerprint.preferences.info_density">Info Density</T>}
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
          label={<T context="fingerprint.preferences.adaptivity">Adaptivity</T>}
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
          <T context="fingerprint.preferences.what_motivates">What Motivates You</T>
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

export const EvolutionTab = ({ fingerprint, isEditing, getFieldValue, updateField }: TabProps) => (
  <motion.div className="space-y-5" {...tabAnimation}>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {(getFieldValue('learning_sensitivity') || isEditing) && (
        <EditableField 
          label={<T context="fingerprint.evolution.adaptivity">Adaptivity</T>}
          value={isEditing ? getFieldValue('learning_sensitivity') : `${getFieldValue('learning_sensitivity')}/10`} 
          field="learning_sensitivity"
          isEditing={isEditing}
          updateField={updateField}
          placeholder="1-10"
        />
      )}
    </div>

    {/* Change Triggers */}
    {((Array.isArray(getFieldValue('change_triggers')) && getFieldValue('change_triggers').length > 0) || isEditing) && (
      <div className="pt-4 border-t border-border/10">
        <div className="text-xs uppercase tracking-wide text-muted-foreground/50 mb-3">
          <T context="fingerprint.evolution.change_triggers">Change Triggers</T>
        </div>
        {isEditing ? (
          <EditableArrayField
            values={getFieldValue('change_triggers') || []}
            onChange={(val) => updateField('change_triggers', val)}
            isEditing={isEditing}
            placeholder="Add change trigger..."
          />
        ) : (
          <div className="space-y-3">
            {(getFieldValue('change_triggers') || []).map((trigger: any, idx: number) => (
              <div key={idx} className="p-3 bg-muted/20 rounded-lg border border-border/20">
                {typeof trigger === 'object' && trigger !== null ? (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-foreground/90">
                      {trigger.response_style || 'Change Trigger'}
                    </div>
                    <div className="text-xs text-muted-foreground/70">
                      <span className="font-medium">Type:</span> {trigger.condition_type || 'insight'} • 
                      <span className="font-medium ml-1">Threshold:</span> {trigger.threshold || 0.5}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-foreground/90">{String(trigger)}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )}

    {/* Stability Zones */}
    {((Array.isArray(getFieldValue('stability_zones')) && getFieldValue('stability_zones').length > 0) || isEditing) && (
      <div className="pt-4 border-t border-border/10">
        <div className="text-xs uppercase tracking-wide text-muted-foreground/50 mb-3">
          <T context="fingerprint.evolution.stability_zones">Stability Zones</T>
        </div>
        {isEditing ? (
          <EditableArrayField
            values={getFieldValue('stability_zones') || []}
            onChange={(val) => updateField('stability_zones', val)}
            isEditing={isEditing}
            placeholder="Add stability zone..."
          />
        ) : (
          <div className="flex flex-wrap gap-2">
            {(getFieldValue('stability_zones') || []).map((zone: string, idx: number) => (
              <span 
                key={idx}
                className="px-2.5 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full text-xs"
              >
                {zone}
              </span>
            ))}
          </div>
        )}
      </div>
    )}

    {/* Growth Edges */}
    {((Array.isArray(getFieldValue('growth_edges')) && getFieldValue('growth_edges').length > 0) || isEditing) && (
      <div className="pt-4 border-t border-border/10">
        <div className="text-xs uppercase tracking-wide text-muted-foreground/50 mb-3">
          <T context="fingerprint.evolution.growth_edges">Growth Edges</T>
        </div>
        {isEditing ? (
          <EditableArrayField
            values={getFieldValue('growth_edges') || []}
            onChange={(val) => updateField('growth_edges', val)}
            isEditing={isEditing}
            placeholder="Add growth edge..."
          />
        ) : (
          <div className="flex flex-wrap gap-2">
            {(getFieldValue('growth_edges') || []).map((edge: string, idx: number) => (
              <span 
                key={idx}
                className="px-2.5 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full text-xs"
              >
                {edge}
              </span>
            ))}
          </div>
        )}
      </div>
    )}
  </motion.div>
)