/**
 * FINGERPRINT CONFIGURATION
 * Constants and configurations for Project Fingerprint component
 */

export type TabType = 'vision' | 'dna' | 'timeline' | 'preferences' | 'evolution'

export interface StatusConfig {
  color: string
  label: string
  pulse: boolean
}

export const STATUS_CONFIGS: Record<string, StatusConfig> = {
  discovering: { color: 'bg-amber-500', label: 'Discovering', pulse: true },
  active: { color: 'bg-blue-500', label: 'Active', pulse: true },
  evolving: { color: 'bg-purple-500', label: 'Evolving', pulse: true },
  completing: { color: 'bg-green-500', label: 'Completing', pulse: false },
  archived: { color: 'bg-muted-foreground', label: 'Archived', pulse: false }
}

export const DEFAULT_STATUS_CONFIG: StatusConfig = {
  color: 'bg-muted-foreground',
  label: 'Unknown',
  pulse: false
}

export const TABS = [
  { id: 'vision' as TabType, label: 'Vision', subtitle: 'What & Why' },
  { id: 'dna' as TabType, label: 'DNA', subtitle: 'How You Work' },
  { id: 'timeline' as TabType, label: 'Timeline', subtitle: 'When & Flow' },
  { id: 'preferences' as TabType, label: 'Preferences', subtitle: 'Interface' },
  { id: 'evolution' as TabType, label: 'Evolution', subtitle: 'Growth & Change' }
] as const
