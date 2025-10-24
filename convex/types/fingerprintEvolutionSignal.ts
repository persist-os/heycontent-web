import { v } from "convex/values";

export const fingerprintEvolutionSignalSchemaFields = {
  // Foreign keys
  fingerprintId: v.id("project_fingerprints"),
  projectId: v.id("projects"),
  userId: v.string(),
  
  // Signal counters (reset after each evolution)
  notes_added: v.number(),
  notes_modified: v.number(),
  crystals_added: v.number(),
  shards_added: v.number(),
  widgets_updated: v.number(),
  widgets_executed: v.number(),
  manual_edits: v.number(),
  
  // Timestamps
  last_evolution_at: v.number(),
  last_signal_update_at: v.number(),
  
  // Computed scores (0-1, cached for performance)
  content_accumulation_score: v.number(),
  content_modification_score: v.number(),
  activity_intensity_score: v.number(),
  time_decay_factor: v.number(),
  evolution_signal_score: v.number(),  // Combined score
  
  // Metadata
  createdAt: v.number(),
  updatedAt: v.number(),
};

export const fingerprintEvolutionSignalValidator = v.object(fingerprintEvolutionSignalSchemaFields);

