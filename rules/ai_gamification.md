# AI-Enhanced Gamification: Framework-Driven Batch Challenge Generation

## 1. System Overview

**Goal:**
Deliver a batch of 12 highly personalized, framework-driven challenges to each user every week, leveraging AI analysis of user patterns and Convex for storage and delivery. Challenges are structured for programmatic frontend navigation and tracked for completion, feedback, and optimization.

**Batch Generation:**
- Each user receives a batch of 12 challenges at the start of each week.
- Challenges are generated using proven frameworks and personalized variables.
- All 12 challenges are returned in a single API response and stored in Convex for the week.

## 2. Technical Architecture

### Core Enhancement Strategy

The AI system builds on the existing gamification foundation (see @basic_gamification.md) without replacing core functionality. Users receive standard challenges by default, with AI-enhanced challenges layered on top when analysis data is available.

### Data Collection Points

- **Platform Activity:** Existing Instagram/YouTube/Gmail toolkit data
- **Note Creation Patterns:** Smart notes timing, types, and engagement from `notes.ts`
- **Challenge Completion:** Success rates, timing preferences from existing gamification tables
- **Session Analytics:** Work session duration and productivity patterns

### Schema Extensions (Minimal Additions)

Building on the existing Convex schema (see @basic_gamification.md), we add:

- **ai_challenge_batches**: Stores weekly challenge batches per user
- **AI Challenge History**: Tracks AI-generated challenge performance, completion, and feedback

## 2a. Batch AI Challenge Generation & Output Model

### ChallengeAction Enum
Pre-defined actions for frontend navigation:
- `create_smart_note`
- `open_content_hub`
- `open_analytics`
- `start_timer`
- `share_challenge`
- `none` (informational only)

### AIGamificationChallenge (object)
| Field                  | Type      | Description                                                                                 |
|------------------------|-----------|---------------------------------------------------------------------------------------------|
| challenge_id           | string    | Unique identifier for the challenge (e.g., UUID or deterministic hash)                      |
| framework              | string    | Framework type (e.g., 'Cross-Platform Bridge', 'Timing Optimization')                       |
| title                  | string    | Short, specific challenge title                                                              |
| description            | string    | Detailed, actionable challenge description personalized to the user                          |
| action                 | enum      | One of ChallengeAction (see above)                                                          |
| action_label           | string?   | Label for the action button (e.g., 'Start Now')                                             |
| time_suggestion        | string?   | Suggested time to complete the challenge (e.g., 'Tuesday 2PM')                              |
| difficulty             | enum?     | 'easy', 'medium', or 'hard'                                                                 |
| estimated_minutes      | int?      | Estimated time to complete the challenge in minutes                                         |
| platform_tags          | string[]  | Platforms involved (e.g., ['instagram', 'youtube'])                                         |
| steps                  | string[]  | Step-by-step instructions for the challenge                                                 |
| success_criteria       | string?   | How the user knows they've completed the challenge successfully                             |
| reward                 | string?   | Reward or incentive for completing the challenge, if any                                    |
| personalized_variables | object?   | Personalization variables used in the challenge generation                                   |

### AIGamificationChallengeBatchResponse (object)
| Field      | Type                        | Description                                              |
|------------|-----------------------------|----------------------------------------------------------|
| status     | string                      | 'success' or 'error'                                     |
| challenges | AIGamificationChallenge[12] | Array of 12 generated AI challenges                      |
| error      | string?                     | Error message if generation failed                       |

#### Example Output
```json
{
  "status": "success",
  "challenges": [
    { "challenge_id": "...", "framework": "...", ... },
    { "challenge_id": "...", "framework": "...", ... }
    // ...10 more...
  ]
}
```

#### Notes for Implementation
- The API/agent **must always return an array of 12 challenges** for the week.
- Each challenge must be actionable, specific, and personalized.
- The `action` field is required and must be one of the pre-defined ChallengeAction values. This enables the frontend to offer context-aware navigation or UI actions.
- The model is designed to be extensible: new actions, fields, or challenge types can be added as needed.
- If challenge generation fails, set `status` to 'error' and provide a message in `error`.

## 2b. Convex Schema for Batch Storage & Tracking

### ai_challenge_batches Table
```typescript
aio_challenge_batches: defineTable({
  userId: v.string(),
  weekStart: v.string(), // ISO date string for the start of the week
  challenges: v.array(v.object({
    challenge_id: v.string(),
    framework: v.string(),
    title: v.string(),
    description: v.string(),
    action: v.string(), // Must match ChallengeAction enum
    action_label: v.optional(v.string()),
    time_suggestion: v.optional(v.string()),
    difficulty: v.optional(v.string()),
    estimated_minutes: v.optional(v.int64()),
    platform_tags: v.array(v.string()),
    steps: v.array(v.string()),
    success_criteria: v.optional(v.string()),
    reward: v.optional(v.string()),
    personalized_variables: v.optional(v.object({})),
    completed: v.boolean(), // User completion status
    completedAt: v.optional(v.number()),
    feedback: v.optional(v.string()), // User feedback on challenge
  })),
  createdAt: v.number(),
  updatedAt: v.number(),
}).index("by_userId_week", ["userId", "weekStart"])
```

### Challenge Completion & Feedback
- Each challenge in the batch tracks `completed`, `completedAt`, and `feedback` fields for analytics and anti-gaming.
- Batches are indexed by user and week for efficient retrieval and update.
- This schema builds directly on the challenge and achievement tables in @basic_gamification.md.

## 3. Framework-Driven AI Challenge Generation

### Hybrid Approach: Smart Prompts + Light Structure

Instead of rigid templates, use **challenge frameworks** with AI handling deep personalization. Each batch of 12 challenges should:
- Cover a mix of framework types (e.g., Cross-Platform Bridge, Timing Optimization, Analytics Discovery, etc.)
- Vary in difficulty, time commitment, and platform focus
- Reference specific user data and recent activity for maximum relevance
- Include at least one challenge for each major platform the user has connected

#### Example Frameworks
- **Cross-Platform Bridge**: Connect strong platform to neglected platform
- **Timing Optimization**: Leverage user's peak productivity windows
- **Analytics Discovery**: Gradual introduction to data insights
- **Content Strategy Session**: Deep-work challenges for strategy development
- **Platform Deep Dive**: Intensive single-platform skill building
- **Habit Formation**: Small consistent actions building to larger goals
- **Skill Gap Closure**: Address specific weaknesses in user workflow

#### Example Challenge Output (see above for JSON)

## 4. Analysis, Anti-Gaming, and Quality Controls

- All batch generation and completion logic must respect the anti-gaming, quality, and reward logic in @basic_gamification.md.
- Track completion, feedback, and engagement for each challenge in the batch.
- Use analytics to refine frameworks and challenge personalization over time.
- Ensure batch generation is cost-effective (weekly, not daily) and robust to missing/incomplete data.

## 5. Integration with Progression, Achievements, and Points

- Challenge completion should trigger points, streaks, and achievement logic as described in @basic_gamification.md.
- Use batch challenge data to drive new achievement types (e.g., "Weekly Challenge Master" for completing all 12 in a week).
- All challenge and achievement progress is stored in Convex and surfaced in the UI for user motivation and transparency.