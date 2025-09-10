/**
 * FINGERPRINT VERSIONING UTILITIES
 *
 * Handles fingerprint versioning, evolution tracking, and version compatibility.
 */

export interface FingerprintVersion {
  major: number;
  minor: number;
  patch: number;
  build?: string;
}

export interface VersionChange {
  from: string;
  to: string;
  changes: VersionChangeDetail[];
  breaking: boolean;
  requiresMigration: boolean;
}

export interface VersionChangeDetail {
  type: 'field_added' | 'field_removed' | 'field_modified' | 'validation_changed' | 'behavior_changed';
  field?: string;
  description: string;
  migration?: string;
}

// Current version
export const CURRENT_FINGERPRINT_VERSION: FingerprintVersion = {
  major: 1,
  minor: 0,
  patch: 0
};

// Parse version string
export function parseVersion(versionStr: string): FingerprintVersion {
  const parts = versionStr.split('.');
  const major = parseInt(parts[0] || '1');
  const minor = parseInt(parts[1] || '0');
  const patch = parseInt(parts[2] || '0');

  return { major, minor, patch };
}

// Convert version to string
export function versionToString(version: FingerprintVersion): string {
  let str = `${version.major}.${version.minor}.${version.patch}`;
  if (version.build) {
    str += `-${version.build}`;
  }
  return str;
}

// Compare versions
export function compareVersions(v1: FingerprintVersion, v2: FingerprintVersion): number {
  if (v1.major !== v2.major) return v1.major - v2.major;
  if (v1.minor !== v2.minor) return v1.minor - v2.minor;
  return v1.patch - v2.patch;
}

// Check if version is compatible
export function isVersionCompatible(current: string, target: string): boolean {
  const currentVer = parseVersion(current);
  const targetVer = parseVersion(target);

  // Major version changes are breaking
  if (targetVer.major > currentVer.major) {
    return false;
  }

  return true;
}

// Version history and changes
const VERSION_CHANGES: VersionChange[] = [
  {
    from: '1.0.0',
    to: '1.1.0',
    changes: [
      {
        type: 'field_added',
        field: 'dynamic_dimensions',
        description: 'Added support for AI-generated dynamic dimensions'
      },
      {
        type: 'behavior_changed',
        description: 'Improved evolution tracking with confidence scores'
      }
    ],
    breaking: false,
    requiresMigration: false
  }
];

// Get version change details
export function getVersionChanges(from: string, to: string): VersionChange | null {
  return VERSION_CHANGES.find(change => change.from === from && change.to === to) || null;
}

// Check if migration is needed
export function requiresMigration(fromVersion: string, toVersion: string): boolean {
  const change = getVersionChanges(fromVersion, toVersion);
  return change?.requiresMigration || false;
}

// Generate version increment
export function incrementVersion(current: string, type: 'major' | 'minor' | 'patch'): string {
  const version = parseVersion(current);

  switch (type) {
    case 'major':
      version.major += 1;
      version.minor = 0;
      version.patch = 0;
      break;
    case 'minor':
      version.minor += 1;
      version.patch = 0;
      break;
    case 'patch':
      version.patch += 1;
      break;
  }

  return versionToString(version);
}

// Validate version format
export function isValidVersion(version: string): boolean {
  const versionRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9]+)?$/;
  return versionRegex.test(version);
}

// Helper functions
function checkForBreakingChanges(changes: any): boolean {
  // Check if any required fields were removed or modified
  // This is a simplified check - in practice you'd have more sophisticated logic
  return false; // For now, assume no breaking changes
}

function checkForNewFeatures(changes: any): boolean {
  // Check if new optional fields were added
  return Object.keys(changes).some(key =>
    key.includes('dynamic_dimensions') ||
    key.includes('event_triggers') ||
    key.includes('evolution_intelligence')
  );
}

// Get recommended version for evolution
export function getRecommendedEvolutionVersion(currentData: any, changes: any): string {
  const currentVersion = parseVersion(currentData.intelligence_version || '1.0.0');

  // Determine if this is a breaking change
  const isBreaking = checkForBreakingChanges(changes);

  if (isBreaking) {
    return incrementVersion(currentData.intelligence_version, 'major');
  }

  // Check if new features were added
  const hasNewFeaturesAdded = checkForNewFeatures(changes);
  if (hasNewFeaturesAdded) {
    return incrementVersion(currentData.intelligence_version, 'minor');
  }

  // Default to patch version
  return incrementVersion(currentData.intelligence_version, 'patch');
}

// Evolution versioning strategy
export interface EvolutionVersioning {
  baseVersion: string;
  evolutionCount: number;
  lastEvolutionType: 'major' | 'minor' | 'patch';
  evolutionHistory: Array<{
    timestamp: number;
    version: string;
    changes: string[];
    type: 'major' | 'minor' | 'patch';
  }>;
}

// Create evolution versioning
export function createEvolutionVersioning(baseVersion: string = '1.0.0'): EvolutionVersioning {
  return {
    baseVersion,
    evolutionCount: 0,
    lastEvolutionType: 'patch',
    evolutionHistory: []
  };
}

// Add evolution to versioning
export function addEvolutionToVersioning(
  versioning: EvolutionVersioning,
  changes: string[],
  evolutionType: 'major' | 'minor' | 'patch' = 'patch'
): EvolutionVersioning {
  const newVersion = incrementVersion(
    versioning.evolutionHistory.length > 0
      ? versioning.evolutionHistory[versioning.evolutionHistory.length - 1].version
      : versioning.baseVersion,
    evolutionType
  );

  versioning.evolutionHistory.push({
    timestamp: Date.now(),
    version: newVersion,
    changes,
    type: evolutionType
  });

  versioning.evolutionCount++;
  versioning.lastEvolutionType = evolutionType;

  return versioning;
}

// Get current version from evolution versioning
export function getCurrentVersion(versioning: EvolutionVersioning): string {
  if (versioning.evolutionHistory.length === 0) {
    return versioning.baseVersion;
  }

  return versioning.evolutionHistory[versioning.evolutionHistory.length - 1].version;
}

// Check if evolution versioning is consistent
export function validateEvolutionVersioning(versioning: EvolutionVersioning): boolean {
  if (!isValidVersion(versioning.baseVersion)) {
    return false;
  }

  for (const evolution of versioning.evolutionHistory) {
    if (!isValidVersion(evolution.version)) {
      return false;
    }
  }

  return true;
}
