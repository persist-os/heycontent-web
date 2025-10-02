"use client"

/**
 * Edit Fingerprint (Missing Fields Only)
 *
 * Purpose:
 * - Ensure a project fingerprint exists for a given `projectId` (create if missing).
 * - Fetch the current fingerprint and completion status.
 * - Compute missing fields from the centralized schema and let the user fill them.
 *
 * Design:
 * - Top "Quick fill" textarea + button posts to the suggest-only quick-fill API and applies
 *   returned updates ONLY to currently missing fields. Changes are persisted via
 *   `projectFingerprintMutations.updateDiscoveryProgress({ trigger: "user_edit" })`.
 * - Below, a minimal manual review form renders inputs for any remaining missing fields.
 * - Primary "Save" persists only changed fields; secondary "Skip for now" navigates back
 *   to the living project page.
 * - Schema is derived from `src/types/fingerprint-schema.ts`; validation helpers from
 *   `src/utils/fingerprint-validation.ts`. No schema duplication here.
 */

import React from 'react'
import { useEffect, useMemo, useState, useCallback } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { useRouter } from 'next/navigation'

import {
  ALL_FINGERPRINT_FIELDS,
  getFieldByName,
  type FingerprintField
} from '@/types/fingerprint-schema'
import { validateFieldValue } from '@/types/fingerprint-schema'
import { useOptimizedAuth } from '@/app/dashboard/thinking_lab/components/notepad/hooks/useOptimizedAuth'

type PageProps = {
  params: Promise<{ projectId: string }>
}

function isEmptyByType(field: FingerprintField, value: any): boolean {
  if (value === null || value === undefined) return true
  switch (field.type) {
    case 'string':
      return (typeof value !== 'string') || value.trim() === ''
    case 'number':
      return typeof value !== 'number'
    case 'boolean':
      return typeof value !== 'boolean'
    case 'array':
      return !Array.isArray(value) || value.length === 0
    case 'object':
      if (typeof value !== 'object' || Array.isArray(value)) return true
      return Object.values(value).every(v => v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0))
    case 'id':
      return !value
    default:
      return value === undefined
  }
}

function parseArrayInput(raw: string): any[] {
  if (!raw.trim()) return []
  return raw
    .split(',')
    .map(s => s.trim())
    .filter(s => s !== '')
}

function parseObjectInput(raw: string): Record<string, any> {
  // pattern: "key: value; key: value"
  const result: Record<string, any> = {}
  if (!raw.trim()) return result
  const pairs = raw.split(';').map(s => s.trim()).filter(Boolean)
  for (const pair of pairs) {
    const [k, ...rest] = pair.split(':')
    const key = (k || '').trim()
    const value = rest.join(':').trim()
    if (key) result[key] = value
  }
  return result
}

export default function EditFingerprintPage(props: PageProps) {
  const router = useRouter()
  const { userId, isLoading: authLoading } = useOptimizedAuth()

  const [projectId, setProjectId] = useState<string>('')
  useEffect(() => {
    props.params.then(p => setProjectId(p.projectId))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const convProjectId = useMemo(() => (projectId ? (projectId as unknown as Id<'projects'>) : undefined), [projectId])

  // Ensure fingerprint existence
  const exists = useQuery(api.projectFingerprintQueries.exists, convProjectId ? { projectId: convProjectId } : 'skip')
  const createFingerprint = useMutation(api.projectFingerprintMutations.create)

  // Fetch project (for name/description) and fingerprint data/status
  const project = useQuery(
    api.projectsQueries.getById,
    userId && convProjectId ? { projectId: convProjectId, userId } : 'skip'
  )
  const fingerprint = useQuery(
    api.projectFingerprintQueries.getByProject,
    convProjectId ? { projectId: convProjectId } : 'skip'
  )
  const completion = useQuery(
    api.projectFingerprintQueries.getCompletionStatus,
    convProjectId ? { projectId: convProjectId } : 'skip'
  )

  const [creating, setCreating] = useState(false)
  useEffect(() => {
    if (!authLoading && userId && convProjectId && exists === false && project && !creating) {
      setCreating(true)
      createFingerprint({
        projectId: convProjectId,
        userId,
        name: project?.name || 'Untitled Project',
        description: project?.description || undefined
      })
        .catch(() => {})
    }
  }, [authLoading, userId, convProjectId, exists, project, creating, createFingerprint])

  // Track local edits (only for missing fields)
  const [quickFillText, setQuickFillText] = useState('')
  const [editedFields, setEditedFields] = useState<Record<string, any>>({})

  const missingFields = useMemo(() => {
    const data = fingerprint || {}
    const exclude = new Set([
      'projectId', 'userId', 'created_at', 'last_evolution', 'intelligence_version', 'status', 'name', 'description'
    ])
    return ALL_FINGERPRINT_FIELDS.filter(field => !exclude.has(field.name)).filter(field => {
      const value = (data as any)[field.name]
      return isEmptyByType(field, value)
    })
  }, [fingerprint])

  const updateDiscoveryProgress = useMutation(api.projectFingerprintMutations.updateDiscoveryProgress)

  const [quickFillError, setQuickFillError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const handleQuickFill = useCallback(async () => {
    if (!projectId || !userId) return
    const res = await fetch('/api/fingerprint/quick-fill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, userId, text: quickFillText })
    })
    if (!res.ok) {
      setQuickFillError('Could not suggest updates. Try adjusting your text.')
      return
    }
    const json = await res.json()
    const updates = (json?.updates || {}) as Record<string, any>
    if (!updates || typeof updates !== 'object') return

    // Apply only to currently missing fields
    const missingNames = new Set(missingFields.map(f => f.name))
    const filteredUpdates: Record<string, any> = {}
    const discarded: string[] = []
    Object.entries(updates).forEach(([k, v]) => {
      if (missingNames.has(k)) {
        const field = getFieldByName(k)
        if (field && validateFieldValue(k, v)) {
          filteredUpdates[k] = v
        } else if (process.env.NODE_ENV !== 'production') {
          discarded.push(k)
        }
      } else if (process.env.NODE_ENV !== 'production') {
        discarded.push(k)
      }
    })
    if (discarded.length && process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log('[quick-fill] Discarded non-missing/invalid fields:', discarded)
    }

    if (Object.keys(filteredUpdates).length === 0 || !convProjectId) return

    // Persist
    try {
      await updateDiscoveryProgress({
        projectId: convProjectId,
        fieldsUpdate: filteredUpdates,
        trigger: 'user_edit'
      })
      setEditedFields(prev => ({ ...prev, ...filteredUpdates }))
      setQuickFillText('')
      setQuickFillError(null)
    } catch {}
  }, [projectId, userId, quickFillText, missingFields, convProjectId, updateDiscoveryProgress])

  const [manualInputs, setManualInputs] = useState<Record<string, string>>({})

  const handleManualChange = (field: FingerprintField, raw: string) => {
    setManualInputs(prev => ({ ...prev, [field.name]: raw }))
    // Convert to typed value and stage in editedFields
    let value: any = raw
    if (field.type === 'array') value = parseArrayInput(raw)
    if (field.type === 'number') value = raw === '' ? undefined : Number(raw)
    if (field.type === 'boolean') value = raw === 'true' ? true : raw === 'false' ? false : undefined
    if (field.type === 'object') value = parseObjectInput(raw)
    setEditedFields(prev => ({ ...prev, [field.name]: value }))
  }

  const handleSave = useCallback(async () => {
    if (!convProjectId) return
    // Only include fields that are missing and have a non-empty edited value
    const missingNames = new Set(missingFields.map(f => f.name))
    const toSend: Record<string, any> = {}
    Object.entries(editedFields).forEach(([k, v]) => {
      if (missingNames.has(k)) {
        const field = getFieldByName(k)
        if (field && !isEmptyByType(field, v) && validateFieldValue(k, v)) {
          toSend[k] = v
        }
      }
    })
    if (Object.keys(toSend).length === 0) {
      router.push(`/dashboard/living-projects/${projectId}`)
      return
    }
    try {
      await updateDiscoveryProgress({
        projectId: convProjectId,
        fieldsUpdate: toSend,
        trigger: 'user_edit'
      })
      setSaveError(null)
      router.push(`/dashboard/living-projects/${projectId}`)
    } catch {
      setSaveError('Save failed. Please try again.')
    }
  }, [convProjectId, editedFields, missingFields, router, projectId, updateDiscoveryProgress])

  const handleSkip = useCallback(() => {
    router.push(`/dashboard/living-projects/${projectId}`)
  }, [router, projectId])

  // Keep loading until: (a) fingerprint exists and is fetched, or (b) creation completes and fetch returns
  const loading = (
    authLoading ||
    !projectId ||
    exists === undefined ||
    (exists === true && fingerprint === undefined) ||
    (exists === false && (creating || fingerprint === null))
  )

  // When fingerprint becomes available, creation is no longer in-flight
  useEffect(() => {
    if (fingerprint) setCreating(false)
  }, [fingerprint])

  return (
    <div className="mx-auto max-w-3xl p-4 space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Fill missing fingerprint fields</h1>
        {completion && (
          <p className="text-sm text-muted-foreground">Completion: {completion.completion_percentage}%</p>
        )}
      </div>

      {loading && (
        <div className="text-sm text-muted-foreground">Loading…</div>
      )}

      {!loading && (
        <>
          <section className="space-y-2">
            <label htmlFor="quickfill" className="text-sm font-medium">Quick fill</label>
            <textarea
              id="quickfill"
              className="w-full rounded border border-gray-300 p-2 text-sm"
              rows={4}
              placeholder="Paste notes or describe your project. We’ll suggest only the missing fields."
              value={quickFillText}
              onChange={(e) => setQuickFillText(e.target.value)}
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleQuickFill}
                className="px-3 py-1.5 text-sm rounded bg-black text-white disabled:opacity-50"
                disabled={!quickFillText.trim() || !userId}
              >
                Fill missing fields
              </button>
            </div>
            {quickFillError && (
              <p className="text-xs text-red-500">{quickFillError}</p>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-medium">Review remaining fields</h2>
            {missingFields.length === 0 && (
              <p className="text-sm text-muted-foreground">No missing fields. You can save or skip.</p>
            )}
            <div className="space-y-3">
              {missingFields.map(field => {
                const inputId = `field-${field.name}`
                const placeholder = field.type === 'array'
                  ? 'item1, item2'
                  : field.type === 'object'
                  ? 'key: value; key: value'
                  : field.validation?.enum?.length
                  ? `One of: ${field.validation.enum.join(', ')}`
                  : ''

                const currentRaw = manualInputs[field.name] ?? ''

                return (
                  <div key={field.name} className="space-y-1">
                    <label htmlFor={inputId} className="text-sm font-medium">
                      {field.name}
                    </label>
                    {field.type === 'boolean' ? (
                      <select
                        id={inputId}
                        className="w-full rounded border border-gray-300 p-2 text-sm"
                        value={currentRaw || ''}
                        onChange={(e) => handleManualChange(field, e.target.value)}
                      >
                        <option value="">Select…</option>
                        <option value="true">True</option>
                        <option value="false">False</option>
                      </select>
                    ) : field.validation?.enum ? (
                      <select
                        id={inputId}
                        className="w-full rounded border border-gray-300 p-2 text-sm"
                        value={currentRaw}
                        onChange={(e) => handleManualChange(field, e.target.value)}
                      >
                        <option value="">Select…</option>
                        {field.validation.enum.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id={inputId}
                        className="w-full rounded border border-gray-300 p-2 text-sm"
                        placeholder={placeholder}
                        value={currentRaw}
                        onChange={(e) => handleManualChange(field, e.target.value)}
                        type={field.type === 'number' ? 'number' : 'text'}
                      />
                    )}
                    <p className="text-xs text-muted-foreground">{field.description}</p>
                  </div>
                )
              })}
            </div>
          </section>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleSkip}
              className="px-3 py-1.5 text-sm rounded border"
            >
              Skip for now
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-3 py-1.5 text-sm rounded bg-black text-white"
            >
              Save
            </button>
          </div>
          {saveError && (
            <p className="text-xs text-red-500 text-right">{saveError}</p>
          )}
        </>
      )}
    </div>
  )
}


