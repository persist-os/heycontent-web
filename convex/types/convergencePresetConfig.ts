import { v } from "convex/values";

export const convergencePresetConfigSchemaFields = {
  preset_id: v.string(),            // "openai", "browserbase", "groq", "azure"
  name: v.string(),                 // "OpenAI/ChatGPT (Recommended)"
  description: v.string(),         // "Optimize ChatGPT API calls - model & temperature tuning"
  
  // Configuration data
  config: v.any(),                  // Full optimization.yaml as object
  test_cases: v.any(),              // test_cases.json as object
  evaluator_code: v.optional(v.string()), // evaluator.py as string
  
  // Metadata
  metadata: v.any(),                // Features, test count, etc.
  
  createdAt: v.number(),
  updatedAt: v.number(),
};

export const convergencePresetConfigValidator = v.object(convergencePresetConfigSchemaFields);

