import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useInstagramProfileStats(instagramAccountId?: string) {
  const stats = useQuery(api.instagramQueries.getInstagramProfileStats, {
    instagramAccountId: instagramAccountId || "",
  });

  return {
    stats,
    loading: stats === undefined,
  };
}

export function useInstagramProfileStatsWithMetrics(instagramAccountId?: string) {
  const stats = useQuery(api.instagramQueries.getInstagramProfileStatsWithMetrics, {
    instagramAccountId: instagramAccountId || "",
  });

  return {
    stats,
    loading: stats === undefined,
  };
} 