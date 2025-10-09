/**
 * Briefing Room - Main Data Hook
 * 
 * Primary hook for fetching and managing briefing room data.
 */

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

// ============================================================================
// Main Briefing Room Hook
// ============================================================================

/**
 * Main hook for briefing room data
 * Fetches events, counts, preferences, and provides mutation helpers
 */
export function useBriefingRoom(userId: string | undefined) {
  // Queries
  const events = useQuery(
    api.briefingRoomQueries.getEvents,
    userId ? { userId } : "skip"
  );
  
  const counts = useQuery(
    api.briefingRoomQueries.getEventCounts,
    userId ? { userId } : "skip"
  );
  
  const preferences = useQuery(
    api.briefingRoomQueries.getUserPreferences,
    userId ? { userId } : "skip"
  );
  
  const urgentEvents = useQuery(
    api.briefingRoomQueries.getUrgentEvents,
    userId ? { userId, limit: 5 } : "skip"
  );
  
  // Mutations
  const markViewed = useMutation(api.briefingRoomMutations.markEventViewed);
  const archiveEvent = useMutation(api.briefingRoomMutations.archiveEvent);
  const toggleStar = useMutation(api.briefingRoomMutations.toggleEventStar);
  const recordAction = useMutation(api.briefingRoomMutations.recordAction);
  const rateEvent = useMutation(api.briefingRoomMutations.rateEvent);
  const updatePrefs = useMutation(api.briefingRoomMutations.updatePreferences);
  
  // Helper functions
  const handleMarkViewed = async (eventId: Id<"briefing_events">) => {
    if (!userId) return;
    
    try {
      await markViewed({ eventId, userId });
    } catch (error) {
      console.error("Failed to mark event as viewed:", error);
      toast.error("Failed to mark as viewed");
    }
  };
  
  const handleArchive = async (eventId: Id<"briefing_events">) => {
    if (!userId) return;
    
    try {
      await archiveEvent({ eventId, userId });
      toast.success("Briefing archived");
    } catch (error) {
      console.error("Failed to archive event:", error);
      toast.error("Failed to archive briefing");
    }
  };
  
  const handleToggleStar = async (eventId: Id<"briefing_events">) => {
    if (!userId) return;
    
    try {
      const result = await toggleStar({ eventId, userId });
      toast.success(result.starred ? "Starred" : "Unstarred");
    } catch (error) {
      console.error("Failed to toggle star:", error);
      toast.error("Failed to update star");
    }
  };
  
  const handleRecordAction = async (
    eventId: Id<"briefing_events">,
    action: string
  ) => {
    if (!userId) return;
    
    try {
      await recordAction({ eventId, userId, action });
    } catch (error) {
      console.error("Failed to record action:", error);
    }
  };
  
  const handleRateEvent = async (
    eventId: Id<"briefing_events">,
    rating: "helpful" | "not_helpful" | "irrelevant"
  ) => {
    if (!userId) return;
    
    try {
      await rateEvent({ eventId, userId, rating });
      toast.success("Feedback recorded");
    } catch (error) {
      console.error("Failed to rate event:", error);
      toast.error("Failed to record feedback");
    }
  };
  
  const handleUpdatePreferences = async (prefs: any) => {
    if (!userId) return;
    
    try {
      await updatePrefs({ userId, preferences: prefs });
      toast.success("Preferences updated");
    } catch (error) {
      console.error("Failed to update preferences:", error);
      toast.error("Failed to update preferences");
    }
  };
  
  return {
    // Data
    events,
    counts,
    preferences,
    urgentEvents,
    
    // Loading states
    isLoading: events === undefined || counts === undefined,
    
    // Actions
    markViewed: handleMarkViewed,
    archive: handleArchive,
    toggleStar: handleToggleStar,
    recordAction: handleRecordAction,
    rateEvent: handleRateEvent,
    updatePreferences: handleUpdatePreferences,
  };
}

// ============================================================================
// Filtered Events Hook
// ============================================================================

/**
 * Hook for fetching events with specific filters
 */
export function useFilteredEvents(
  userId: string | undefined,
  filters: {
    category?: "crystal" | "widget" | "collaboration" | "dream" | "system";
    priority?: "critical" | "high" | "medium" | "low";
    state?: string;
    viewedFilter?: "all" | "unread" | "read";
    limit?: number;
  }
) {
  return useQuery(
    api.briefingRoomQueries.getEvents,
    userId ? { userId, ...filters } : "skip"
  );
}

// ============================================================================
// Related Events Hook
// ============================================================================

/**
 * Hook for fetching events related to a specific event
 */
export function useRelatedEvents(
  eventId: Id<"briefing_events"> | undefined,
  userId: string | undefined
) {
  return useQuery(
    api.briefingRoomQueries.getRelatedEvents,
    eventId && userId ? { eventId, userId } : "skip"
  );
}

// ============================================================================
// Activity Summary Hook
// ============================================================================

/**
 * Hook for briefing room analytics
 */
export function useActivitySummary(
  userId: string | undefined,
  days?: number
) {
  return useQuery(
    api.briefingRoomQueries.getActivitySummary,
    userId ? { userId, days } : "skip"
  );
}

// ============================================================================
// Cluster Hooks
// ============================================================================

/**
 * Hook for active clusters
 */
export function useActiveClusters(userId: string | undefined) {
  return useQuery(
    api.briefingRoomQueries.getActiveClusters,
    userId ? { userId } : "skip"
  );
}

/**
 * Hook for events in a cluster
 */
export function useClusterEvents(
  clusterId: Id<"briefing_clusters"> | undefined,
  userId: string | undefined
) {
  return useQuery(
    api.briefingRoomQueries.getClusterEvents,
    clusterId && userId ? { clusterId, userId } : "skip"
  );
}

