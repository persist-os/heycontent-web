/**
 * FINGERPRINT EDIT HOOK
 * Manages editing state and operations for fingerprint
 */

'use client'

import { useState, useEffect } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { getCurrentUserId } from '@/app/lib/api-helpers'
import { Id } from '@/convex/_generated/dataModel'

export function useFingerprintEdit(fingerprintId?: Id<"project_fingerprints">) {
  const [isEditing, setIsEditing] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [editedFields, setEditedFields] = useState<Record<string, any>>({})
  
  const updateFingerprint = useMutation(api.projectFingerprintMutations.updateFields)
  
  // Get current user ID
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const id = await getCurrentUserId()
        setUserId(id)
      } catch (error) {
        console.error('Failed to get user ID:', error)
      }
    }
    fetchUserId()
  }, [])

  const getFieldValue = (field: string, fingerprint: any) => {
    return editedFields[field] !== undefined ? editedFields[field] : fingerprint?.[field]
  }
  
  const updateField = (field: string, value: any) => {
    setEditedFields(prev => ({ ...prev, [field]: value }))
  }
  
  const handleSave = async () => {
    if (!userId || !fingerprintId) return
    
    setIsSaving(true)
    try {
      await updateFingerprint({
        fingerprintId,
        userId,
        updates: editedFields
      })
      setEditedFields({})
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to save fingerprint:', error)
    } finally {
      setIsSaving(false)
    }
  }
  
  const handleCancel = () => {
    setEditedFields({})
    setIsEditing(false)
  }

  return {
    isEditing,
    setIsEditing,
    isSaving,
    editedFields,
    getFieldValue,
    updateField,
    handleSave,
    handleCancel,
    hasChanges: Object.keys(editedFields).length > 0
  }
}
