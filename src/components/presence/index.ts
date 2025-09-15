// Main presence components
export { PresenceProvider, usePresenceEnabledEditor } from './PresenceProvider';
export { PresenceOverlay } from './PresenceOverlay';
export { PresenceCursor, PresenceSelection, PresenceTypingIndicator } from './PresenceCursor';
export { CollaboratorPanel, FloatingCollaboratorIndicator } from './CollaboratorPanel';
export { PresenceNotifications } from './PresenceNotifications';

// Store and hooks
export { usePresenceStore } from '@/store/presence-store';
export { usePresenceIntegration } from '@/hooks/usePresenceIntegration';

// Types
export type { UserPresence, PresenceStoreState } from '@/store/presence-store';
