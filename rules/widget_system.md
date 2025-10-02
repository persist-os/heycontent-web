# Widget System Architecture & Implementation Plan

## Vision

Transform project widgets from static AI-generated cards into a living, intelligent workspace where async agents proactively work on user behalf, generating tangible outputs before being asked. Widgets exist in an infinite constellation space where users have ultimate control over positioning, configuration, and execution.

---

## Core Principles

### User Control First

- Users can edit ANY widget property (title, description, type, schedule, deliverables)
- Users can delete widgets (with warning about deleting all associated content)
- Users can add custom widgets manually
- Users can drag widgets freely in infinite constellation space
- Users save positions, system respects them

### Async Intelligence

- AI works in background before user asks
- Proactive but intentional - asks for input when needed
- Tangible outputs (reports, lists, analyses) not empty screens
- Smart defaults but full customization available

### Seamless Integration

- Widget-created content visible across entire platform
- Auto-suggest relevant notes/conversations to widgets
- Widgets share intelligence through project-level context
- Cross-widget data flow with visual indicators

### Simplicity & Elegance

- Leverage ALL existing patterns (agent factory, distributed locks, circuit breaker)
- No reinvention - use embedding service, convex toolkit, existing utilities
- Small, modular code - nothing over 400 lines
- Backwards compatible - existing widgets continue working

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    INFINITE CONSTELLATION                    │
│                                                              │
│    ┌──────────┐         ┌──────────┐      ┌──────────┐    │
│    │ Widget A │────────>│ Widget B │      │ Widget C │    │
│    │ Working  │  shares │  Ready   │      │  Idle    │    │
│    │   ●●●    │   data  │    ●     │      │          │    │
│    └──────────┘         └──────────┘      └──────────┘    │
│                                                              │
│         [Notification Badge]  [Activity Log Panel]          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   Widget Jobs     │
                    │   Queue System    │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Backend Agents  │
                    │  (Async Workers) │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Outputs & Updates│
                    │ (Real-time sync) │
                    └──────────────────┘
```

---

## Data Model

### Extended Schema Changes

#### 1. Update `project_widgets.widgets` Array

Add fields to each widget object:

```typescript
{
  // Existing fields preserved...
  
  // NEW: Positioning in infinite space
  positionX: v.number(),              // X coordinate in constellation
  positionY: v.number(),              // Y coordinate in constellation
  
  // NEW: Content & Intelligence
  widgetTags: v.array(v.string()),    // For matching relevant content
  relevantNoteIds: v.array(v.string()), // Auto-suggested notes
  relevantConversationIds: v.array(v.string()), // Auto-suggested conversations
  relevantCrystalIds: v.array(v.string()), // Crystals this widget uses
  
  // NEW: Execution & Scheduling
  scheduleType: v.union(
    v.literal("one_time"),
    v.literal("daily"),
    v.literal("weekly"),
    v.literal("event_driven"),
    v.literal("manual_only")
  ),
  lastRunAt: v.optional(v.number()),
  nextScheduledRun: v.optional(v.number()),
  
  // NEW: Denormalized Counts (for performance)
  activeJobCount: v.number(),         // Currently running jobs
  outputCount: v.number(),            // Total outputs generated
  unreadOutputCount: v.number(),      // Unread outputs
  
  // NEW: Widget Relationships
  sharesDataWith: v.array(v.string()), // Widget IDs this shares data with
  receivesDataFrom: v.array(v.string()), // Widget IDs this receives from
  
  // NEW: Deliverables Configuration
  deliverables: v.object({
    expectedOutputs: v.array(v.string()), // What should be generated
    outputFormat: v.string(),           // "report", "list", "analysis", etc.
    updateFrequency: v.string(),        // How often to refresh
  }),
}
```

#### 2. New Table: `widget_jobs`

Job queue and execution tracking:

```typescript
widget_jobs: defineTable({
  // Core identification
  jobId: v.string(),                  // Unique job ID
  widgetId: v.string(),               // Widget this belongs to
  projectId: v.id("projects"),
  userId: v.string(),
  
  // Job configuration
  jobType: v.union(
    v.literal("research"),
    v.literal("analysis"),
    v.literal("tracking"),
    v.literal("compilation"),
    v.literal("update")
  ),
  instructions: v.string(),           // What the AI should do
  parameters: v.any(),                // Job-specific config
  
  // Execution state
  status: v.union(
    v.literal("queued"),
    v.literal("running"),
    v.literal("completed"),
    v.literal("failed"),
    v.literal("cancelled"),
    v.literal("needs_user_input")
  ),
  priority: v.union(
    v.literal("low"),
    v.literal("normal"),
    v.literal("high")
  ),
  
  // Progress tracking
  progress: v.number(),               // 0-100
  currentStep: v.optional(v.string()),
  totalSteps: v.optional(v.number()),
  statusMessage: v.optional(v.string()),
  
  // Timing
  queuedAt: v.number(),
  startedAt: v.optional(v.number()),
  completedAt: v.optional(v.number()),
  estimatedDuration: v.optional(v.number()),
  
  // Results
  outputIds: v.optional(v.array(v.string())),
  errorMessage: v.optional(v.string()),
  errorDetails: v.optional(v.any()),
  
  // Circuit breaker tracking
  retryCount: v.number(),
  circuitBreakerState: v.optional(v.union(
    v.literal("closed"),
    v.literal("open"),
    v.literal("half_open")
  )),
  lastFailureAt: v.optional(v.number()),
  
  // Metadata
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_widget", ["widgetId"])
  .index("by_project", ["projectId"])
  .index("by_user", ["userId"])
  .index("by_status", ["status", "priority", "queuedAt"])
  .index("by_widget_status", ["widgetId", "status"])
```

#### 3. New Table: `widget_outputs`

Deliverables and generated content:

```typescript
widget_outputs: defineTable({
  // Core identification
  outputId: v.string(),
  widgetId: v.string(),
  projectId: v.id("projects"),
  userId: v.string(),
  jobId: v.optional(v.string()),    // Which job created this
  
  // Output content
  outputType: v.union(
    v.literal("report"),
    v.literal("list"),
    v.literal("analysis"),
    v.literal("recommendation"),
    v.literal("insight"),
    v.literal("update")
  ),
  title: v.string(),
  content: v.string(),              // Markdown content
  
  // Rich content
  structuredData: v.optional(v.any()), // JSON data for widgets
  attachmentNoteIds: v.optional(v.array(v.string())),
  attachmentConversationIds: v.optional(v.array(v.string())),
  
  // User interaction
  isRead: v.boolean(),
  readAt: v.optional(v.number()),
  userRating: v.optional(v.union(
    v.literal("helpful"),
    v.literal("needs_work"),
    v.literal("not_useful")
  )),
  userFeedback: v.optional(v.string()),
  
  // Versioning
  version: v.number(),
  supersededBy: v.optional(v.string()), // Newer output ID
  
  // Metadata
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_widget", ["widgetId"])
  .index("by_user", ["userId"])
  .index("by_project", ["projectId"])
  .index("by_widget_unread", ["widgetId", "isRead"])
  .index("by_created", ["createdAt"])
```

#### 4. New Table: `widget_activity_log`

Centralized tracking for constellation view:

```typescript
widget_activity_log: defineTable({
  logId: v.string(),
  projectId: v.id("projects"),
  userId: v.string(),
  widgetId: v.optional(v.string()),  // Null for project-level events
  
  // Event details
  eventType: v.union(
    v.literal("widget_created"),
    v.literal("widget_updated"),
    v.literal("widget_deleted"),
    v.literal("job_started"),
    v.literal("job_completed"),
    v.literal("job_failed"),
    v.literal("output_generated"),
    v.literal("content_suggested"),
    v.literal("data_shared"),
    v.literal("error_occurred")
  ),
  message: v.string(),
  details: v.optional(v.any()),
  
  // Severity for filtering
  severity: v.union(
    v.literal("info"),
    v.literal("success"),
    v.literal("warning"),
    v.literal("error")
  ),
  
  timestamp: v.number(),
})
  .index("by_project", ["projectId", "timestamp"])
  .index("by_widget", ["widgetId", "timestamp"])
  .index("by_severity", ["projectId", "severity", "timestamp"])
```

#### 5. New Table: `widget_data_flows`

Track cross-widget intelligence sharing:

```typescript
widget_data_flows: defineTable({
  flowId: v.string(),
  projectId: v.id("projects"),
  sourceWidgetId: v.string(),       // Widget providing data
  targetWidgetId: v.string(),       // Widget receiving data
  
  // Flow details
  dataType: v.string(),             // What kind of data
  dataDescription: v.string(),      // Human-readable description
  lastFlowAt: v.number(),           // When data was last shared
  flowCount: v.number(),            // How many times shared
  
  // Metadata
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_project", ["projectId"])
  .index("by_source", ["sourceWidgetId"])
  .index("by_target", ["targetWidgetId"])
```

#### 6. New Table: `project_execution_limits`

Track concurrent execution limits:

```typescript
project_execution_limits: defineTable({
  userId: v.string(),
  
  // Project-level limits
  activeProjectCount: v.number(),   // How many projects currently running
  maxActiveProjects: v.number(),    // User's limit (default: 3)
  
  // Per-project tracking
  activeProjects: v.array(v.object({
    projectId: v.id("projects"),
    activeJobCount: v.number(),
    startedAt: v.number(),
  })),
  
  // Metadata
  updatedAt: v.number(),
})
  .index("by_user", ["userId"])
```

#### 7. Update Existing Tables

**Add to `notes`:**

```typescript
widgetId: v.optional(v.string()),   // Widget that created this
projectId: v.optional(v.id("projects")), // Project association
isWidgetGenerated: v.optional(v.boolean()), // Flag for UI
```

**Add to `conversations`:**

```typescript
widgetId: v.optional(v.string()),
projectId: v.optional(v.id("projects")),
isWidgetGenerated: v.optional(v.boolean()),
```

---

## Backend Architecture

### Service Organization

```
backend-new/app/agents/widget_agents/
├── __init__.py
├── widget_agent_factory.py       # Create widget-specific agents
├── widget_runner.py              # Main job execution orchestrator
├── job_queue_manager.py          # Queue management with distributed locks
├── content_suggester.py          # Auto-suggest relevant content
├── intelligence_tracker.py       # Track cross-widget intelligence
├── circuit_breaker_manager.py    # Circuit breaker per widget
└── widget_types/
    ├── research_agent.py
    ├── tracking_agent.py
    ├── analysis_agent.py
    ├── compilation_agent.py
    └── update_agent.py
```

### Key Services

#### 1. Widget Agent Factory

Extends existing `agent_factory.py` pattern:

```python
# app/agents/widget_agents/widget_agent_factory.py

from app.agents.agent_factory import create_agent, AgentConfig

async def create_widget_agent(
    widget_type: str,
    user_id: str,
    widget_config: Dict[str, Any],
    project_context: Dict[str, Any]
) -> Agent:
    """
    Create widget-specific agent using existing factory.
    Reuses prompts, context enrichment, crystal integration.
    """
    agent_config = AgentConfig(
        agent_type=f"widget_{widget_type}",
        additional_context={
            "widget_config": widget_config,
            "project_context": project_context
        }
    )
    
    return create_agent(
        user_id=user_id,
        agent_config=agent_config
    )
```

#### 2. Job Queue Manager

Handles distributed execution with locks:

```python
# app/agents/widget_agents/job_queue_manager.py

from app.agents.shared_services.distributed_lock_manager import DistributedLockManager

class WidgetJobQueueManager:
    """
    Manages widget job queue with:
    - Distributed locking (prevent concurrent same-widget jobs)
    - Priority-based execution
    - Circuit breaker integration
    - Real-time status updates to Convex
    """
    
    def __init__(self):
        self.lock_manager = DistributedLockManager(
            max_timeout_seconds=600  # 10 min max per job
        )
        self.circuit_breakers = {}  # Per-widget circuit breakers
    
    async def execute_job(self, job_id: str):
        """
        Execute widget job with proper locking and error handling.
        
        Flow:
        1. Acquire distributed lock (widget-scoped)
        2. Check circuit breaker state
        3. Execute via widget agent
        4. Update job status in real-time
        5. Generate outputs
        6. Release lock
        """
        pass
```

#### 3. Content Suggester

Leverages existing embedding service:

```python
# app/agents/widget_agents/content_suggester.py

from app.utility.embedding_service import generate_embeddings, search_similar_content

class WidgetContentSuggester:
    """
    Auto-suggest relevant notes/conversations to widgets.
    Uses existing embedding service for vector similarity.
    """
    
    SIMILARITY_THRESHOLD = 0.6  # High threshold for relevance
    
    async def suggest_content_for_widget(
        self,
        widget_id: str,
        widget_tags: List[str],
        widget_description: str,
        project_context: Dict[str, Any]
    ) -> Dict[str, List[str]]:
        """
        Find relevant content using vector search.
        
        Returns:
        {
            "note_ids": [...],
            "conversation_ids": [...],
            "confidence_scores": {...}
        }
        """
        # Create search query from widget metadata
        query = f"{' '.join(widget_tags)} {widget_description}"
        
        # Use embedding service for search
        results = await search_similar_content(
            query=query,
            threshold=self.SIMILARITY_THRESHOLD,
            content_types=["note", "conversation"]
        )
        
        return self._process_results(results)
```

#### 4. Intelligence Tracker

Tracks cross-widget data flows:

```python
# app/agents/widget_agents/intelligence_tracker.py

class WidgetIntelligenceTracker:
    """
    Track which widgets share data and how.
    Records data flows for visualization in constellation.
    """
    
    async def record_data_flow(
        self,
        source_widget_id: str,
        target_widget_id: str,
        data_type: str,
        data_description: str
    ):
        """
        Record that Widget A shared data with Widget B.
        Updates widget_data_flows table and widget relationships.
        """
        pass
    
    async def get_widget_intelligence(
        self,
        widget_id: str
    ) -> Dict[str, Any]:
        """
        Get comprehensive intelligence about widget:
        - Which crystals it uses
        - What data it shares
        - What data it receives
        - Performance metrics
        """
        pass
```

### API Routes

```python
# app/routes/widget_jobs.py

@router.post("/widgets/{widget_id}/run")
async def run_widget(
    widget_id: str,
    request: Request
):
    """
    Queue job for single widget.
    
    Flow:
    1. Authenticate user
    2. Validate widget access
    3. Check execution limits (3 concurrent per project)
    4. Create job in Convex
    5. Queue for background execution
    6. Return immediately with job_id
    """
    pass

@router.post("/projects/{project_id}/run-all-widgets")
async def run_all_widgets(
    project_id: str,
    request: Request
):
    """
    Queue jobs for ALL widgets in project.
    
    Respects limits:
    - 3 concurrent jobs per project
    - Max X active projects per user
    
    Queues jobs in priority order.
    """
    pass

@router.get("/widgets/{widget_id}/suggest-content")
async def suggest_content(
    widget_id: str,
    request: Request
):
    """
    Get auto-suggested relevant content for widget.
    Runs async, returns existing suggestions if available.
    """
    pass

@router.get("/projects/{project_id}/activity-log")
async def get_activity_log(
    project_id: str,
    request: Request,
    limit: int = 50
):
    """
    Get recent activity log for constellation view.
    """
    pass
```

---

## Frontend Architecture

### Component Organization

```
src/app/dashboard/living-projects/[projectId]/
├── components/
│   ├── widgets/
│   │   ├── ConstellationCanvas.tsx          # Main infinite space
│   │   ├── FloatingWidgetCard.tsx           # Widget cards with status
│   │   ├── WidgetDetailsPanel.tsx           # Side panel with tabs
│   │   ├── WidgetEditForm.tsx               # Inline editing
│   │   ├── WidgetJobStatus.tsx              # Real-time progress
│   │   ├── WidgetOutputCard.tsx             # Display deliverables
│   │   ├── ConnectionLines.tsx              # Data flow visualization
│   │   └── NotificationBadge.tsx            # Unread count
│   ├── activity/
│   │   ├── ActivityLogPanel.tsx             # Centralized tracking
│   │   └── ActivityEventCard.tsx            # Individual events
│   └── controls/
│       ├── ProjectRunControls.tsx           # Run all widgets
│       └── ExecutionLimitsIndicator.tsx     # Show active jobs
└── hooks/
    ├── useWidgetJobs.ts                     # Job management
    ├── useWidgetOutputs.ts                  # Output fetching
    ├── useActivityLog.ts                    # Activity tracking
    ├── useWidgetPosition.ts                 # Position management
    └── useExecutionLimits.ts                # Limit tracking
```

### Key Components

#### 1. Constellation Canvas (Infinite Space)

Enhanced from current implementation:

```tsx
// ConstellationCanvas.tsx

interface ConstellationCanvasProps {
  widgets: WidgetConfig[]
  onWidgetClick: (widget: WidgetConfig) => void
  onWidgetMove: (widgetId: string, x: number, y: number) => void
  showActivityLog: boolean
}

export function ConstellationCanvas({
  widgets,
  onWidgetClick,
  onWidgetMove,
  showActivityLog
}: ConstellationCanvasProps) {
  // Infinite canvas with pan/zoom (keep existing)
  const { transform, containerRef, ... } = usePanZoom(...)
  
  // NEW: Drag-to-reposition with save
  const { handleDragEnd } = useWidgetDrag({
    onPositionChange: onWidgetMove
  })
  
  // NEW: Connection lines between widgets
  const dataFlows = useQuery(api.widgetDataFlows.getByProject, { projectId })
  
  return (
    <div className="relative h-screen">
      {/* Infinite canvas */}
      <div ref={containerRef} onWheel={handleWheel}>
        <div style={{ transform: `translate(${x}px, ${y}px) scale(${scale})` }}>
          
          {/* Connection lines for data sharing */}
          <ConnectionLines 
            widgets={widgets}
            dataFlows={dataFlows}
            scale={scale}
          />
          
          {/* Widget cards with drag */}
          {widgets.map(widget => (
            <FloatingWidgetCard
              key={widget.widget_id}
              widget={widget}
              onMove={handleDragEnd}
              onClick={() => onWidgetClick(widget)}
            />
          ))}
        </div>
      </div>
      
      {/* NEW: Activity log overlay */}
      {showActivityLog && (
        <ActivityLogPanel projectId={projectId} />
      )}
      
      {/* NEW: Execution limits indicator */}
      <ExecutionLimitsIndicator projectId={projectId} />
    </div>
  )
}
```

#### 2. Enhanced Widget Card

Show status, notifications, quick actions:

```tsx
// FloatingWidgetCard.tsx

export function FloatingWidgetCard({ widget, onMove, onClick }) {
  // Real-time job status
  const activeJobs = useQuery(api.widgetJobs.getActiveByWidget, {
    widgetId: widget.widget_id
  })
  
  // Unread outputs count
  const unreadCount = widget.unreadOutputCount || 0
  
  const status = determineStatus(widget, activeJobs)
  // status: 'idle' | 'working' | 'complete' | 'error' | 'needs_input'
  
  return (
    <DraggableCard
      position={{ x: widget.positionX, y: widget.positionY }}
      onDragEnd={onMove}
    >
      {/* Status indicator */}
      <StatusDot status={status} />
      
      {/* Notification badge */}
      {unreadCount > 0 && (
        <NotificationBadge count={unreadCount} />
      )}
      
      {/* Card content */}
      <div onClick={onClick}>
        <h3>{widget.title}</h3>
        <p>{widget.description}</p>
      </div>
      
      {/* Quick actions menu */}
      <WidgetActions widget={widget} />
    </DraggableCard>
  )
}
```

#### 3. Redesigned Details Panel

Comprehensive widget management:

```tsx
// WidgetDetailsPanel.tsx

export function WidgetDetailsPanel({ widget, isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('overview')
  
  return (
    <SidePanel isOpen={isOpen} onClose={onClose}>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">
            Content ({contentCount})
          </TabsTrigger>
          <TabsTrigger value="outputs">
            Outputs ({outputCount})
            {unreadCount > 0 && <Badge>{unreadCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="config">Configure</TabsTrigger>
        </TabsList>
        
        {/* Overview: Status, controls, metrics */}
        <TabsContent value="overview">
          <WidgetOverview widget={widget} />
          <RunControls widget={widget} />
        </TabsContent>
        
        {/* Content: Notes, conversations, suggestions */}
        <TabsContent value="content">
          <WidgetContentView widget={widget} />
          <ContentSuggestions widget={widget} />
        </TabsContent>
        
        {/* Outputs: Generated deliverables */}
        <TabsContent value="outputs">
          <WidgetOutputsList widget={widget} />
        </TabsContent>
        
        {/* Activity: Job history, logs */}
        <TabsContent value="activity">
          <WidgetActivityLog widget={widget} />
        </TabsContent>
        
        {/* Config: Edit all settings */}
        <TabsContent value="config">
          <WidgetEditForm widget={widget} />
        </TabsContent>
      </Tabs>
    </SidePanel>
  )
}
```

#### 4. Activity Log Panel

Centralized tracking overlay:

```tsx
// ActivityLogPanel.tsx

export function ActivityLogPanel({ projectId }) {
  const activities = useQuery(api.widgetActivityLog.getByProject, {
    projectId,
    limit: 50
  })
  
  return (
    <div className="fixed bottom-6 right-6 w-96 bg-card border rounded-lg shadow-xl">
      <div className="p-4 border-b">
        <h3>Project Activity</h3>
        <ActivityFilters />
      </div>
      
      <div className="max-h-[400px] overflow-y-auto">
        {activities?.map(activity => (
          <ActivityEventCard
            key={activity.logId}
            activity={activity}
          />
        ))}
      </div>
    </div>
  )
}
```

---

## Implementation Strategy

### Phase 1: Foundation (Week 1)

**Goal**: Schema, basic CRUD, no execution yet

#### Tasks

1. **Schema Extension**
   - Add fields to `project_widgets.widgets`
   - Create `widget_jobs` table
   - Create `widget_outputs` table
   - Create `widget_activity_log` table
   - Create `widget_data_flows` table
   - Create `project_execution_limits` table
   - Update `notes` and `conversations` with `widgetId`

2. **Basic Mutations**
   - `updateWidgetPosition` - Save x, y coordinates
   - `updateWidget` - Edit any widget property
   - `deleteWidget` - Delete with cascade to content
   - `addCustomWidget` - Create new widget manually

3. **Basic Queries**
   - `getWidgetsByProject` - Fetch with new fields
   - `getWidgetContent` - Get associated notes/conversations
   - `getActivityLog` - Fetch recent events

4. **Frontend Components**
   - Update `ConstellationCanvas` for drag-to-save position
   - Update `FloatingWidgetCard` to show position
   - Create basic `WidgetEditForm`

**Deliverable**: Users can drag widgets, edit properties, see positions saved

---

### Phase 2: Job System (Week 2)

**Goal**: Job queue, execution, circuit breaker

#### Backend Tasks

1. **Job Queue Manager**
   - Create `job_queue_manager.py`
   - Implement distributed locking per widget
   - Integrate circuit breaker (3 failures → open, 60s timeout)
   - Real-time status updates to Convex

2. **Widget Agent Factory**
   - Create `widget_agent_factory.py`
   - Implement basic research agent
   - Implement basic tracking agent
   - Reuse existing agent patterns

3. **API Routes**
   - `/api/v1/widgets/{id}/run` - Queue single job
   - `/api/v1/projects/{id}/run-all-widgets` - Queue all
   - Add execution limit checks (3 per project, max projects per user)

4. **Circuit Breaker Integration**
   - Per-widget circuit breaker instances
   - Track failures in job records
   - Graceful degradation with user notification

#### Frontend Tasks

1. **Job Status Components**
   - Create `WidgetJobStatus` - Real-time progress
   - Add status indicators to `FloatingWidgetCard`
   - Create `RunControls` component

2. **Hooks**
   - `useWidgetJobs` - Subscribe to job updates
   - `useExecutionLimits` - Track concurrent jobs

3. **Activity Logging**
   - Log job start/complete/fail events
   - Show in activity log overlay

**Deliverable**: Users can click "Run", see jobs execute, view progress

---

### Phase 3: Outputs & Content (Week 3)

**Goal**: Generate deliverables, auto-suggest content

#### Backend Tasks

1. **Output Generation**
   - Agents create outputs in `widget_outputs` table
   - Markdown formatting for reports
   - Structured data for widgets to consume

2. **Content Suggester**
   - Create `content_suggester.py`
   - Use embedding service for vector search (threshold 0.6)
   - Auto-run when widget created/updated
   - Update `relevantNoteIds` and `relevantConversationIds`

3. **Widget-Created Content**
   - When agent creates note, set `widgetId` and `isWidgetGenerated`
   - Same for conversations
   - Allow manual association via UI

#### Frontend Tasks

1. **Output Display**
   - Create `WidgetOutputCard` component
   - Show in Details Panel "Outputs" tab
   - Mark as read when viewed

2. **Content View**
   - Show associated notes/conversations in Details Panel
   - Show auto-suggested content with confidence scores
   - Allow manual add/remove

3. **Notifications**
   - Show unread output count on widget card
   - Badge in Details Panel tabs
   - Disappear when outputs viewed

**Deliverable**: Widgets generate visible outputs, suggest relevant content

---

### Phase 4: Intelligence & Visualization (Week 4)

**Goal**: Cross-widget data flows, crystal tracking, connection lines

#### Backend Tasks

1. **Intelligence Tracker**
   - Create `intelligence_tracker.py`
   - Track when Widget A uses Widget B's output
   - Record in `widget_data_flows`
   - Update widget relationships

2. **Crystal Usage Tracking**
   - Log which crystals each widget references
   - Store in `relevantCrystalIds`
   - Provide API to fetch widget-crystal relationships

#### Frontend Tasks

1. **Connection Lines**
   - Update `ConnectionLines` component
   - Draw lines between widgets that share data
   - Show on hover: "Widget A → Widget B: shared research data"
   - Different colors for different data types

2. **Intelligence Display**
   - Show crystal usage in Details Panel
   - Show data flows (incoming/outgoing)
   - Visualize widget relationships

3. **Activity Log Enhancement**
   - Show data sharing events
   - Show crystal usage events
   - Filter by event type

**Deliverable**: Visual indication of widget intelligence sharing

---

## Execution Limits & Concurrency

### Limits Configuration

```typescript
const EXECUTION_LIMITS = {
  MAX_CONCURRENT_JOBS_PER_PROJECT: 3,
  MAX_ACTIVE_PROJECTS_PER_USER: 3,  // Start conservative
  MAX_JOB_DURATION_MINUTES: 10,
  CIRCUIT_BREAKER_FAILURE_THRESHOLD: 3,
  CIRCUIT_BREAKER_TIMEOUT_SECONDS: 60,
}
```

### Enforcement Strategy

1. **Project-Level** (3 concurrent jobs):
   - When queuing job, count active jobs for project
   - If >= 3, either queue with delay or reject
   - Update counter in real-time as jobs complete

2. **User-Level** (3 active projects):
   - Track in `project_execution_limits` table
   - When starting first job in project, check user's active count
   - If >= 3, show user message: "Too many active projects, wait or cancel others"
   - Decrement when ALL project jobs complete

3. **Visual Indicators**:
   - Show user: "2/3 projects active"
   - Show per-project: "2/3 widgets running"
   - Disable "Run All" button when at limit

---

## Connection Lines Visualization

### Data Flow Representation

```typescript
interface WidgetDataFlow {
  sourceWidgetId: string
  targetWidgetId: string
  dataType: string
  dataDescription: string
  strength: number  // How much data shared (0-1)
}

// Visual rendering
function ConnectionLines({ widgets, dataFlows, scale }) {
  return (
    <svg className="absolute inset-0 pointer-events-none">
      {dataFlows.map(flow => {
        const source = widgets.find(w => w.widget_id === flow.sourceWidgetId)
        const target = widgets.find(w => w.widget_id === flow.targetWidgetId)
        
        return (
          <g key={flow.flowId}>
            {/* Curved line from source to target */}
            <path
              d={createBezierPath(source, target)}
              stroke={getDataTypeColor(flow.dataType)}
              strokeWidth={2 * flow.strength}
              strokeDasharray={flow.dataType === 'live' ? '0' : '5,5'}
              opacity={0.6}
            />
            
            {/* Arrow head */}
            <polygon
              points={getArrowPoints(target)}
              fill={getDataTypeColor(flow.dataType)}
            />
          </g>
        )
      })}
    </svg>
  )
}
```

### Interaction

- Hover over line → Show tooltip: "Research data from Vendor Tracker"
- Click line → Highlight both connected widgets
- Toggle button to show/hide connection lines

---

## Error Handling & Resilience

### Circuit Breaker Strategy

```python
# Per-widget circuit breaker
class WidgetCircuitBreakerManager:
    """
    Manages circuit breakers for widget jobs.
    Prevents cascading failures from problematic widgets.
    """
    
    def get_breaker(self, widget_id: str) -> CircuitBreaker:
        if widget_id not in self.breakers:
            self.breakers[widget_id] = CircuitBreaker(
                failure_threshold=3,
                timeout_seconds=60,
                name=f"widget_{widget_id}"
            )
        return self.breakers[widget_id]
    
    async def execute_with_protection(
        self,
        widget_id: str,
        job_func: Callable,
        fallback: Optional[Callable] = None
    ):
        breaker = self.get_breaker(widget_id)
        return await breaker.call(job_func, fallback=fallback)
```

### Fallback Strategies

1. **Job Failure**:
   - Don't retry aggressively (circuit breaker handles)
   - Log error in activity log
   - Notify user with actionable message
   - Suggest: "Check widget configuration" or "Try manual run"

2. **Content Suggestion Failure**:
   - Silently fail (not critical)
   - Log for debugging
   - Retry on next widget update

3. **Data Flow Recording Failure**:
   - Non-blocking (intelligence feature)
   - Continue job execution
   - Log warning

---

## Testing Strategy

### Unit Tests

- Widget mutations (CRUD)
- Job queue logic
- Circuit breaker integration
- Content suggestion algorithm

### Integration Tests

- End-to-end job execution
- Distributed locking (prevent concurrent runs)
- Real-time updates to frontend
- Execution limit enforcement

### Manual Testing Checklist

- [ ] Drag widget, position saved
- [ ] Edit widget properties
- [ ] Click "Run", job queued
- [ ] Real-time progress updates
- [ ] Output generated and displayed
- [ ] Notification badge appears/disappears
- [ ] Content auto-suggested correctly
- [ ] Connection lines drawn between widgets
- [ ] Activity log shows events
- [ ] Execution limits enforced (3 per project, 3 projects)
- [ ] Circuit breaker opens after 3 failures
- [ ] Widget deletion cascades to content

---

## Migration & Backwards Compatibility

### Existing Widget Migration

```typescript
// Migration function to add new fields to existing widgets
export const migrateExistingWidgets = internalMutation({
  handler: async (ctx) => {
    const allWidgetConfigs = await ctx.db
      .query("project_widgets")
      .collect()
    
    for (const config of allWidgetConfigs) {
      const updatedWidgets = config.widgets.map((widget, index) => ({
        ...widget,
        // Add new fields with defaults
        positionX: widget.positionX ?? (index % 3) * 400,
        positionY: widget.positionY ?? Math.floor(index / 3) * 300,
        widgetTags: widget.widgetTags ?? [],
        relevantNoteIds: [],
        relevantConversationIds: [],
        relevantCrystalIds: [],
        scheduleType: widget.scheduleType ?? 'manual_only',
        activeJobCount: 0,
        outputCount: 0,
        unreadOutputCount: 0,
        sharesDataWith: [],
        receivesDataFrom: [],
        deliverables: widget.deliverables ?? {
          expectedOutputs: [],
          outputFormat: 'report',
          updateFrequency: 'manual'
        }
      }))
      
      await ctx.db.patch(config._id, { widgets: updatedWidgets })
    }
  }
})
```

### Graceful Degradation

- If job system down, widgets still viewable/editable
- If content suggester fails, manual association still works
- If circuit breaker open, show clear message to user

---

## Next Steps

### Questions to Answer

1. **Max active projects**: Start with 3, adjust based on usage?
2. **Job timeout**: 10 minutes reasonable for all widget types?
3. **Output storage**: Pure markdown in Convex, or support file attachments?
4. **Data flow visualization**: Always show lines, or toggle on/off?
5. **Custom widget creation**: Should AI suggest widget type, or user picks from list?

### Before Implementation

1. Review this plan with team
2. Confirm execution limits (3 per project, 3 projects per user)
3. Finalize widget agent types (research, tracking, analysis, ?)
4. Design connection line visual language (colors for data types)
5. Create migration script for existing widgets

### Implementation Order

1. ✅ **Week 1**: Schema + Basic CRUD (foundation)
2. **Week 2**: Job System (execution)
3. **Week 3**: Outputs & Content (deliverables)
4. **Week 4**: Intelligence & Visualization (polish)

---

## Success Criteria

### MVP Launch (End of Week 4)

- [ ] Users can drag widgets, positions saved
- [ ] Users can edit any widget property
- [ ] Users can click "Run" on widget → job executes async
- [ ] Users can click "Run All" on project → respects limits
- [ ] Widgets generate visible outputs (reports, lists)
- [ ] Unread output count shown on widget card
- [ ] Activity log shows recent events
- [ ] Content auto-suggested to widgets (threshold 0.6)
- [ ] Connection lines show widget data sharing
- [ ] Execution limits enforced (3 per project, 3 projects)
- [ ] Circuit breaker prevents cascading failures
- [ ] Widget-created content labeled in platform

### Future Enhancements (Post-MVP)

- Manual content association UI
- Custom widget templates
- Widget cloning/duplication
- Output versioning with diff view
- Advanced scheduling (cron-style)
- Widget performance analytics
- Bulk operations (run multiple widgets)
- Export outputs to external formats
- Widget marketplace/library

---

*Document Version: 1.0*  
*Last Updated: October 2, 2025*  
*Status: Planning - Ready for Implementation*
