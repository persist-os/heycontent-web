import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Process embedding queue every 5 minutes (backup for inactive users)
crons.interval(
  "process-embedding-queue",
  { minutes: 5 },
  internal.automaticEmbeddingSystem.processEmbeddingQueue,
  { batchSize: 20 } // Increased from 10 to 20 items per run for better cleanup
);

// Clean up old failed queue items daily (successful items are deleted immediately)
crons.daily(
  "cleanup-embedding-queue",
  { hourUTC: 2, minuteUTC: 0 }, // 2:00 AM UTC
  internal.automaticEmbeddingSystem.cleanupOldQueueItems
);

// Clean up old sync records monthly (keep for 30 days)
crons.monthly(
  "cleanup-sync-records", 
  { day: 1, hourUTC: 3, minuteUTC: 0 }, // 1st of month at 3:00 AM UTC
  internal.automaticEmbeddingSystem.cleanupOldSyncRecords
);

export default crons; 