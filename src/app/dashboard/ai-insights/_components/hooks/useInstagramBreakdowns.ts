import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useInstagramBreakdowns(userId: string | undefined) {
  const data = useQuery(
    api.instagramQueries.getInstagramProfileInsights,
    userId ? { userId } : "skip"
  );
  return data;
} 