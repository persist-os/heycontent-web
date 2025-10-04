/**
 * Intelligence Bandit (MAB) Type Definitions
 * 
 * CRITICAL: These types MUST match backend-new/app/background_jobs/types/bandit_types.py exactly
 * Any changes here should be mirrored in Python and vice versa.
 */

import { v } from "convex/values";

// User state snapshot validator - matches Python UserState dataclass
export const userStateValidator = v.object({
  semantic_drift: v.number(),
  activity_velocity: v.number(),
  hours_since_last: v.number(),
  crystal_count: v.number(),
  active_crystals: v.number(),
  formations_since_last: v.number(),
});

// Bandit arm state validator - matches Python BanditArmState dataclass
export const banditArmValidator = v.object({
  armId: v.string(),
  armName: v.string(),
  alpha: v.number(),
  beta: v.number(),
  sampled_value: v.number(),
});

// TypeScript interfaces matching Python dataclasses
export interface UserStateSnapshot {
  semantic_drift: number;
  activity_velocity: number;
  hours_since_last: number;
  crystal_count: number;
  active_crystals: number;
  formations_since_last: number;
}

export interface BanditArmState {
  armId: string;
  armName: string;
  alpha: number;
  beta: number;
  sampled_value: number;
}

export interface BanditDecision {
  should_trigger: boolean;
  selected_arm: string;
  confidence: number;
  all_arms_state: BanditArmState[];
  state_snapshot: UserStateSnapshot;
}

// Additional MAB types for Convex storage
export interface BanditArm {
  userId: string;
  armId: string;
  armName: string;
  alpha: number;
  beta: number;
  total_pulls: number;
  total_reward: number;
  avg_reward: number;
  mean_estimate: number;
  confidence_interval: {
    lower: number;
    upper: number;
  };
  last_pulled?: number;
  updatedAt: number;
}

export interface BanditDecisionRecord {
  userId: string;
  jobId?: string;
  armPulled: string;
  triggered: boolean;
  state_snapshot: UserStateSnapshot;
  arms_state: BanditArmState[];
  reward?: number;
  decisionAt: number;
  rewardObservedAt?: number;
}

