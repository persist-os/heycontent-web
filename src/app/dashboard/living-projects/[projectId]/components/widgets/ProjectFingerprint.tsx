/**
 * PROJECT DNA FINGERPRINT
 * 
 * Living, breathing display of a project's essence.
 * Tied to the artificial civilization vision - this is the project's consciousness.
 */

'use client'

import React, { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { STATUS_CONFIGS, DEFAULT_STATUS_CONFIG, TabType } from './fingerprint/fingerprintConfig'
import { useFingerprintEdit } from './fingerprint/useFingerprintEdit'
import { CollapsedView, ExpandedView } from './fingerprint/FingerprintViews'
import { VisionTab, DNATab, TimelineTab, PreferencesTab } from './fingerprint/FingerprintTabContent'

interface ProjectFingerprintProps {
  projectId: string
  className?: string
}

export function ProjectFingerprint({ projectId, className = '' }: ProjectFingerprintProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('vision')
  const [modalSize, setModalSize] = useState({ width: 1024, height: 600 })
  
  const fingerprint = useQuery(api.projectFingerprintQueries.getByProject, {
    projectId: projectId as Id<"projects">
  })
  
  const completionStatus = useQuery(api.projectFingerprintQueries.getCompletionStatus, {
    projectId: projectId as Id<"projects">
  })
  
  const {
    isEditing,
    setIsEditing,
    isSaving,
    getFieldValue,
    updateField,
    handleSave,
    handleCancel,
    hasChanges
  } = useFingerprintEdit(fingerprint?._id)

  if (!fingerprint) return null

  const completion = completionStatus?.completion_percentage || 0
  const status = fingerprint.status || 'discovering'
  const statusConfig = STATUS_CONFIGS[status] || DEFAULT_STATUS_CONFIG

  // Helper to get field value with fingerprint context
  const getField = (field: string) => getFieldValue(field, fingerprint)

  return (
    <div className={className}>
      {!isExpanded ? (
        <CollapsedView
          fingerprint={fingerprint}
          statusConfig={statusConfig}
          completion={completion}
          onExpand={() => setIsExpanded(true)}
        />
      ) : (
        <ExpandedView
          fingerprint={fingerprint}
          statusConfig={statusConfig}
          completion={completion}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isEditing={isEditing}
          isSaving={isSaving}
          hasChanges={hasChanges}
          onEdit={() => setIsEditing(true)}
          onSave={handleSave}
          onCancel={handleCancel}
          onClose={() => setIsExpanded(false)}
          modalSize={modalSize}
          setModalSize={setModalSize}
        >
          {activeTab === 'vision' && (
            <VisionTab
              fingerprint={fingerprint}
              isEditing={isEditing}
              getFieldValue={getField}
              updateField={updateField}
            />
          )}
          {activeTab === 'dna' && (
            <DNATab
              fingerprint={fingerprint}
              isEditing={isEditing}
              getFieldValue={getField}
              updateField={updateField}
            />
          )}
          {activeTab === 'timeline' && (
            <TimelineTab
              fingerprint={fingerprint}
              isEditing={isEditing}
              getFieldValue={getField}
              updateField={updateField}
            />
          )}
          {activeTab === 'preferences' && (
            <PreferencesTab
              fingerprint={fingerprint}
              isEditing={isEditing}
              getFieldValue={getField}
              updateField={updateField}
            />
          )}
        </ExpandedView>
      )}
    </div>
  )
}