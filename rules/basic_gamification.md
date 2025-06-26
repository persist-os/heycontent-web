# Product Requirements Document: HeyContent Gamification System

## 1. Executive Summary

**Goal**: Create a comprehensive achievement and progression system that rewards meaningful platform engagement through points, streaks, challenges, and unlockable features. Focus on user progression, creative output, and platform mastery.

**Philosophy**: Points drive achievements, achievements unlock capabilities. Reward discovery of platform features, sustained creative work, and meaningful content interaction. Create clear progression paths that feel rewarding and achievable.

## 2. Core Wireframe Components

### 2.1 Progress Bar

- Circular or linear progress indicator showing current level/tier
- Point accumulation toward next milestone
- Visual representation of total platform mastery

### 2.2 Streaks Section  

- Current active streak counter
- Streak type indicators (daily engagement, creative sessions, etc.)
- Streak milestone rewards preview

### 2.3 Achievements/Trophy Case

- Grid layout of earned and locked achievements
- Progress indicators for partially completed achievements
- Achievement categories: Onboarding, Creativity, Platform Mastery, Collaboration

### 2.4 Challenges List

- Active challenges with completion status
- Challenge difficulty levels (Beginner, Intermediate, Advanced)
- Specific, actionable challenge descriptions
- Click-to-complete when criteria fulfilled

## 3. Achievement-Driven Points System

### Core Principle: Points Enable Progression

- **Points** → **Achievements** → **Unlock Features** → **More Points**
- **Discovery Rewards**: Hidden point bonuses for exploring platform features (e.g., BottomBarActions)
- **Progressive Unlocks**: More API requests, premium features, advanced tools
- **Achievement Tiers**: Bronze (easy), Silver (moderate effort), Gold (significant accomplishment)

## 4. Achievement Categories & Specific Challenges

### 4.1 Onboarding Achievements (Bronze Tier)

**Platform Discovery** - *Hidden discovery rewards for trying features*

- 🎯 **"Quick Thinker"** - Use any BottomBarAction button: 25 points *(hidden)*
- 🎯 **"Power User"** - Use 5 different BottomBarActions: 100 points *(hidden)*
- 🎯 **"Welcome Creator"** - Create your first note: 50 points
- 🎯 **"Connected"** - Connect your first platform: 100 points
- 🎯 **"Project Starter"** - Create your first project: 75 points
- 🎯 **"Conversation Starter"** - Start your first chat: 50 points

**Challenge Format**: *"Complete your first [action] to earn [points] points!"*

### 4.2 Creative Mastery Achievements (Silver/Gold Tier)

**Content Creation Excellence**

- 🥈 **"Deep Thinker"** - Spend 30+ minutes in a single note session: 150 points
- 🥈 **"Project Builder"** - Add 10+ items to a project: 200 points  
- 🥈 **"Cross-Platform Creator"** - Connect insights from 3+ platforms: 250 points
- 🥇 **"Content Strategist"** - Complete 5 cross-platform analyses: 500 points
- 🥇 **"Platform Master"** - Earn 1000 total points: 200 bonus points

**Conversation Excellence**

- 🥈 **"Conversationalist"** - Have 10 AI conversations with 5+ messages: 200 points
- 🥈 **"Insight Seeker"** - Generate 25 AI insights: 300 points
- 🥇 **"AI Collaborator"** - Have 3 conversations that lead to created content: 400 points

### 4.3 Project-Tied Achievements

**Project Progression** - *Achievements unlock as projects grow*

- 🎯 **"Organizer"** - Create your first project: 75 points
- 🥈 **"Curator"** - Organize 20+ items across projects: 200 points
- 🥈 **"Project Specialist"** - Create 5 different projects: 250 points
- 🥇 **"Content Architect"** - Build a project with 50+ items: 500 points

### 4.4 Streak Achievements

**Daily Engagement Streaks**

- 🎯 **"Getting Started"** - 3-day streak: 100 points + 1.2x multiplier
- 🥈 **"Consistent Creator"** - 7-day streak: 200 points + 1.5x multiplier  
- 🥈 **"Dedicated"** - 14-day streak: 400 points + 1.8x multiplier
- 🥇 **"Content Champion"** - 30-day streak: 1000 points + 2x multiplier

**Creative Session Streaks** - *Deep work sessions on consecutive days*

- 🥈 **"Creative Flow"** - 5 days of 15+ minute note sessions: 300 points
- 🥇 **"Deep Work Master"** - 10 days of focused creative work: 600 points

## 5. Point Spending & Feature Unlocks

### 5.1 API Request Unlocks

**Base Limits** (Per subscription tier):

- **Basic Plan**: 100 requests/month (as per PRICE_CONFIG)
- **Pro Plan**: 1000 requests/month (monthly) or 12000/year (yearly)
- **Overage costs**: $0.025 (basic) or $0.020 (pro) per additional request

**Point-Based Extensions** (Alternative to paying overage fees):

- **+25 API requests**: 100 points (can use instead of paying $0.50-$0.625)
- **+50 API requests**: 175 points (better value, saves ~$1.00-$1.25)
- **+100 API requests**: 300 points (best value, saves ~$2.00-$2.50)

### 5.2 Premium Feature Costs

**Enhanced Analytics**:

- **Historical trend analysis** (beyond 30 days): 100 points
- **Cross-platform content remix suggestions**: 100 points

**Advanced AI Features**:

- **Multi-note AI analysis**: 125 points

### 5.3 Reward-Then-Require Strategy

**Pattern**: Give users a taste of premium features through achievements, then require points

*Example Flow*:

1. User completes "Cross-Platform Creator" achievement
2. Automatically unlock 1 free cross-platform analysis  
3. Show what the feature can do
4. Subsequent uses cost 100 points
5. Achievement unlocks permanent 50% discount (75 points)

## 6. Implementation Schema

### 6.1 Extended `users` table

```typescript
// Add to existing users table
points: v.int64(),                    // Current point balance
totalPointsEarned: v.int64(),        // Lifetime points (for achievements)
currentLevel: v.int64(),             // User progression level
streakCount: v.int64(),              // Current consecutive days
lastStreakDate: v.string(),          // ISO date for streak tracking
streakType: v.optional(v.string()),  // "daily", "creative", etc.
completedAchievements: v.array(v.string()), // Achievement IDs
apiRequestsUsed: v.object({          // Monthly API usage tracking (per subscription)
  totalRequests: v.int64(),          // Total requests used this billing cycle
  pointsExtensions: v.int64(),       // Additional requests purchased with points
  lastReset: v.string(),             // ISO date of billing cycle reset
  subscriptionTier: v.string(),      // "basic" or "pro"
}),
```

### 6.2 Achievements System

```typescript
// Track individual achievement progress
achievementProgress: defineTable({
  userId: v.string(),
  achievementId: v.string(),           // e.g., "deep_thinker", "project_builder"
  currentProgress: v.int64(),          // e.g., 7 out of 10 conversations
  targetProgress: v.int64(),           // e.g., 10 conversations needed
  isCompleted: v.boolean(),
  completedAt: v.optional(v.number()),
  tier: v.string(),                    // "bronze", "silver", "gold"
  category: v.string(),                // "onboarding", "creative", "project", "streak"
}).index("by_userId", ["userId"])
  .index("by_userId_achievement", ["userId", "achievementId"])

// Track challenge completion
challenges: defineTable({
  userId: v.string(),
  challengeId: v.string(),             // e.g., "use_bottom_bar_actions"
  challengeType: v.string(),           // "daily", "weekly", "achievement"
  progress: v.int64(),                 // Current progress
  target: v.int64(),                   // Target to complete
  isCompleted: v.boolean(),
  canClaim: v.boolean(),               // Ready to claim reward
  claimedAt: v.optional(v.number()),
  pointsReward: v.int64(),
  expiresAt: v.optional(v.number()),   // For time-limited challenges
}).index("by_userId", ["userId"])
  .index("by_userId_status", ["userId", "isCompleted"])

// Track bottom bar action usage (for hidden achievements)
bottomBarUsage: defineTable({
  userId: v.string(),
  actionId: v.string(),                // Specific action used
  timestamp: v.number(),
  sessionId: v.string(),
}).index("by_userId", ["userId"])
  .index("by_userId_action", ["userId", "actionId"])

// Premium feature usage tracking
premiumUsage: defineTable({
  userId: v.string(),
  featureType: v.string(),             // "historical_analysis", "cross_platform_remix", etc.
  pointsCost: v.int64(),               // Points spent
  timestamp: v.number(),               // When feature was used
  subscriptionTier: v.string(),        // User's current subscription tier
  metadata: v.optional(v.object({
    platform: v.optional(v.string()),
    analysisType: v.optional(v.string()),
    resultQuality: v.optional(v.string()),
  })),
}).index("by_userId", ["userId"])
  .index("by_userId_feature", ["userId", "featureType"])
```

## 7. Implementation Logic

### 7.1 API Request Management

```typescript
// Check if user can make API request
export const checkApiRequestLimit = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    const subscription = await getSubscriptionDetails(ctx, args.userId);
    
    // Get monthly limits based on subscription tier
    const monthlyLimit = PRICE_CONFIG[subscription.tier].monthly.included_requests;
    const currentUsage = user.apiRequestsUsed.totalRequests + user.apiRequestsUsed.pointsExtensions;
    
    return {
      canMakeRequest: currentUsage < monthlyLimit,
      requestsRemaining: monthlyLimit - currentUsage,
      subscriptionTier: subscription.tier,
      overageRate: PRICE_CONFIG[subscription.tier].monthly.overage_rate,
      pointsAlternative: calculatePointsForRequests(25) // Cost to buy 25 more requests
    };
  }
});

// Use points to extend API requests
export const purchaseApiRequestsWithPoints = mutation({
  args: { 
    userId: v.string(), 
    requestsPurchased: v.int64() // 25, 50, or 100
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    const pointsCost = calculatePointsForRequests(args.requestsPurchased);
    
    if (user.points < pointsCost) {
      return { success: false, reason: "Insufficient points", required: pointsCost };
    }
    
    // Deduct points and add API requests
    await ctx.db.patch(args.userId, {
      points: user.points - pointsCost,
      "apiRequestsUsed.pointsExtensions": user.apiRequestsUsed.pointsExtensions + args.requestsPurchased
    });
    
    // Log transaction
    await ctx.db.insert("pointTransactions", {
      userId: args.userId,
      amount: -pointsCost,
      reason: `api_requests_${args.requestsPurchased}`,
      actionType: "api_extension",
      timestamp: Date.now(),
    });
    
    return { success: true, requestsAdded: args.requestsPurchased, pointsRemaining: user.points - pointsCost };
  }
});
```

### 7.2 Bottom Bar Action Tracking (Hidden Achievements)

```typescript
// Track bottom bar action usage for hidden achievements
export const trackBottomBarAction = mutation({
  args: { 
    userId: v.string(), 
    actionId: v.string(),
    sessionId: v.string()
  },
  handler: async (ctx, args) => {
    // Log the action
    await ctx.db.insert("bottomBarUsage", {
      userId: args.userId,
      actionId: args.actionId,
      timestamp: Date.now(),
      sessionId: args.sessionId
    });
    
    // Check for achievements
    const allActions = await ctx.db
      .query("bottomBarUsage")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    
    const uniqueActions = new Set(allActions.map(a => a.actionId));
    
    // First-time using any bottom bar action (hidden achievement)
    if (allActions.length === 1) {
      await awardAchievement(ctx, args.userId, "quick_thinker", 25);
    }
    
    // Used 5 different bottom bar actions (hidden achievement)
    if (uniqueActions.size === 5) {
      await awardAchievement(ctx, args.userId, "power_user", 100);
    }
    
    return { success: true, totalActionsUsed: allActions.length, uniqueActionsUsed: uniqueActions.size };
  }
});
```

### 4.2 Action Tracking for Staggered Rewards

```typescript
// Track actions for staggered rewards
actionCounters: defineTable({
  userId: v.string(),
  actionType: v.string(),              // "content_chat", "deep_analysis", etc.
  currentCount: v.int64(),             // How many times they've done this
  nextRewardAt: v.int64(),             // When they'll get next points
  lastActionAt: v.number(),            // Timestamp of last action
  totalRewarded: v.int64(),            // Total times they've been rewarded
}).index("by_userId", ["userId"])

// Enhanced point transactions
pointTransactions: defineTable({
  userId: v.string(),
  amount: v.int64(),
  reason: v.string(),                  // "deep_conversation", "first_note", etc.
  actionType: v.string(),              // Category for analytics
  timestamp: v.number(),
  metadata: v.optional(v.object({
    conversationLength: v.optional(v.number()),
    contentPlatform: v.optional(v.string()),
    sessionDuration: v.optional(v.number()),
    isStaggeredReward: v.optional(v.boolean()),
  })),
}).index("by_userId", ["userId"])

// Premium feature usage tracking
premiumUsage: defineTable({
  userId: v.string(),
  featureType: v.string(),             // "content_hub_refresh", "ai_analysis", etc.
  pointsCost: v.int64(),               // Points spent
  timestamp: v.number(),               // When feature was used
  cooldownUntil: v.number(),           // When feature can be used again
  metadata: v.optional(v.object({
    platform: v.optional(v.string()),
    analysisType: v.optional(v.string()),
    resultQuality: v.optional(v.string()),
  })),
}).index("by_userId", ["userId"])
  .index("by_userId_feature", ["userId", "featureType"])

// Anti-gaming tracking
gamingDetection: defineTable({
  userId: v.string(),
  actionType: v.string(),              // Type of action being monitored
  actionHash: v.string(),              // Hash of action details (for duplicate detection)
  timestamp: v.number(),               // When action occurred
  sessionId: v.string(),               // Session identifier
  isSpam: v.boolean(),                 // Detected as spam/gaming
  penaltyApplied: v.optional(v.boolean()), // Whether penalty was applied
}).index("by_userId", ["userId"])
  .index("by_userId_action", ["userId", "actionType"])
  .index("by_session", ["sessionId"])

// Rate limiting tracking
rateLimits: defineTable({
  userId: v.string(),
  limitType: v.string(),               // "ai_commands", "content_analysis", etc.
  count: v.int64(),                    // Current count in time window
  windowStart: v.number(),             // Start of current time window
  penaltyUntil: v.optional(v.number()), // Until when user is penalized
}).index("by_userId", ["userId"])
  .index("by_userId_type", ["userId", "limitType"])
```

## 5. Reward Triggers & Detection

### 5.0 Note Engagement Without Version Tracking

Since we only store the current version of notes, we track meaningful engagement through **session-based metrics**:

#### Session Quality Indicators

- **Duration**: Time spent actively working in a note (15+ minutes for points)
- **Interaction Density**: Number of edits, cursor movements, typing events
- **Return Sessions**: Coming back to work on the same note over multiple days
- **Word Count Growth**: Comparing current note length to previous session data
- **Deep Work Patterns**: Extended focused sessions without platform switching

#### Implementation Approach

```typescript
// Track active time and interactions during note sessions
const noteSessionTracker = {
  startTime: Date.now(),
  interactions: 0,
  lastInteraction: Date.now(),
  
  // Called on each edit/interaction
  recordInteraction() {
    this.interactions++;
    this.lastInteraction = Date.now();
  },
  
  // Calculate active time (excluding idle periods)
  getActiveTime() {
    // Logic to subtract idle time between interactions
    return activeMinutes;
  }
};
```

### 5.1 Conversation Quality Detection

```typescript
// Analyze conversation depth for point awards
const analyzeConversationForRewards = async (conversationId: string, messages: Message[]) => {
  const metrics = {
    messageCount: messages.length,
    avgMessageLength: messages.reduce((sum, m) => sum + m.content.length, 0) / messages.length,
    timeSpan: messages[messages.length - 1].timestamp - messages[0].timestamp,
    contentReferences: countContentReferences(messages),
    synthesisIndicators: detectSynthesis(messages),
  };
  
  // Award points based on conversation quality, not just completion
  if (metrics.messageCount >= 5 && metrics.avgMessageLength > 100) {
    return { shouldReward: true, pointValue: calculateConversationPoints(metrics) };
  }
  
  return { shouldReward: false, pointValue: 0 };
};
```

### 5.2 Content Engagement Patterns

- **Session Duration**: Longer sessions with same content = higher rewards
- **Return Visits**: Coming back to analyze same content over multiple days
- **Cross-References**: Connecting insights across different pieces of content
- **Application**: Using insights to create actionable next steps
- **Note Activity Intensity**: Time spent actively working in notes, measured by session duration and interaction frequency

### 5.3 Creative Synthesis Detection

- **Note Engagement Intensity**: Tracking session duration and activity within notes (typing, editing, time spent)
- **Project Development**: Meaningful additions to projects over time
- **Insight Application**: Converting insights into concrete content plans

## 6. Streak System (Refined)

### Quality-Based Streaks

Instead of just "daily activity", track:

- **Creative Engagement Streaks**: Days with meaningful content interaction
- **Deep Work Streaks**: Days with extended focus sessions (30+ minutes)
- **Synthesis Streaks**: Days where insights led to creative output

### Streak Multipliers

- 3-day streak: 1.2x points on quality actions
- 7-day streak: 1.5x points + 100 bonus points
- 14-day streak: 2x points + 300 bonus points
- 30-day streak: 2.5x points + 1000 bonus points

## 7. Achievement System (Refined)

### 7.1 Onboarding Achievements (One-Time)

- **"Welcome Creator"** - Create first note (50 points)
- **"First Connection"** - Connect first platform (100 points)
- **"Conversation Starter"** - First content discussion (75 points)
- **"Project Pioneer"** - Create and populate first project (150 points)
- **"Platform Explorer"** - Connect 3+ platforms (200 points)

### 7.2 Engagement Achievements (Repeatable Tiers)

- **"Deep Thinker"** - 10/50/100 quality conversations (100/300/500 points)
- **"Content Synthesizer"** - 5/25/50 cross-platform insights (150/400/750 points)
- **"Creative Catalyst"** - 10/30/75 insight-to-action conversions (200/500/1000 points)
- **"Consistency Champion"** - 7/30/90 day quality streaks (300/750/1500 points)

### 7.3 Mastery Achievements (High-Value)

- **"Content Whisperer"** - 100 deep content conversations (1000 points)
- **"Platform Master"** - Meaningful engagement across all connected platforms (1500 points)
- **"Creative Architect"** - Build 10 substantial projects (2000 points)

## 8. Anti-Gaming Measures & Rate Limiting

### 8.1 AI Feature Abuse Prevention

**Inline Command Palette Rate Limiting:**

- Cooldown periods between identical commands (5 minutes)
- Session-based tracking to prevent rapid-fire usage
- No points awarded for inline command palette.

**Content Analysis Restrictions:**

- Same content can only be analyzed once per 24 hours for points
- Cross-platform analysis requires content from at least 2 different platforms
- Minimum 30-second delay between AI requests
- Points only awarded for analyses that result in user engagement (reading, discussing, or acting on results)

**Quality Thresholds for AI Interactions:**

- AI conversations must last 3+ exchanges to earn points
- Simple "thank you" or one-word responses don't count as engagement
- Repeated identical prompts within 24 hours earn no additional points

### 8.2 Gaming Detection Patterns

```typescript
// Patterns that indicate potential gaming behavior
const gamingIndicators = {
  rapidFireActions: "Multiple identical actions within 60 seconds",
  shallowEngagement: "Opening/closing features without meaningful interaction",
  repetitiveContent: "Analyzing same content repeatedly",
  artificialConversations: "AI chats with minimal user input",
  timeSpamming: "Creating many short sessions instead of focused work"
};

// Automatic point reduction for detected gaming
const applyGamingPenalty = (userId: string, pattern: string) => {
  // Reduce points by 50% for next 24 hours
  // Require verification of genuine engagement to restore full earning
};
```

## 9. Point Spending System (Premium Features)

### 9.1 Content Hub & Analytics Features

**Content Hub Insights:**

Beyond base functionality:

- **Generate New Cross-Platform Insights**: 25 points
- **Refresh Platform Analytics** (Instagram/YouTube/Gmail): 25 points per platform

``` bash
// Track usage to prevent abuse
const trackPremiumUsage = (userId: string, feature: string) => {
  // Log usage and enforce cooldowns
  // Prevent users from burning through points too quickly
};
```

### 9.5 Earning Suggestions & Point Recovery

**When users lack points for premium features:**

*For Content Hub Features:*

- "Have deeper conversations about your content to earn 100+ points"
- "Spend 15+ minutes analyzing your best-performing content"
- "Create cross-platform content discussions to unlock insights"

*For Analytics Features:*

- "Engage with your analytics for extended sessions to earn points"
- "Discuss findings from your content performance with AI"
- "Create actionable plans based on your insights"

*For AI Features:*

- "Have meaningful conversations about your creative process"
- "Spend time developing your content ideas in notes"
- "Use projects to organize and develop your content strategy"

### 9.6 Point Recovery Mechanisms

**Daily Earning Opportunities:**

- Daily engagement bonus: 25 points for 30+ minutes of meaningful platform use
- Quality content analysis: 50-75 points for thorough content review sessions
- Cross-platform insight creation: 100-150 points for connecting insights across platform
