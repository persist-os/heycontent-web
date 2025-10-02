# Widget System: Prompt-Driven Architecture

## 🚀 Revolutionary Design: Dynamic AI Prompts

### Core Innovation

**Widgets are no longer hardcoded agent types.** Instead, each widget job is driven by **dynamic prompts stored in Convex** that compose together in layers. This means:

- ✅ Jobs can do **literally anything** an AI can output
- ✅ Users have **full control** over AI behavior via prompt editing
- ✅ **Complete transparency** - users can see exactly what prompts were used
- ✅ **Infinite flexibility** - no rigid job types, just instructions
- ✅ **Compound intelligence** - prompts layer: Project → Widget → Job

---

## Prompt Architecture

### Layered Composition System

```
┌─────────────────────────────────────────────┐
│  PROJECT BASE PROMPT                         │
│  "This is a wedding planning project..."     │
│  (Shared across ALL widgets in project)      │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  WIDGET DEFAULT PROMPT                       │
│  "You are a vendor research assistant..."    │
│  (Defines widget personality/approach)       │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  JOB SPECIFIC PROMPT                         │
│  "Find 10 photographers in Seattle under     │
│   $3000 specializing in outdoor weddings"    │
│  (What to do for THIS execution)             │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  CONTEXT INJECTION (Auto)                    │
│  + Crystal context (user preferences)        │
│  + Project context (notes, conversations)    │
│  + Widget data (previous outputs)            │
└─────────────────────────────────────────────┘
                    ↓
        FINAL AGENT INSTRUCTIONS
        (Sent to Gemini for execution)
```

### Example: Wedding Vendor Widget

**Project Prompt** (applies to all widgets):
```
You are assisting with wedding planning in Seattle, WA for June 2026.
Budget: $30,000 total. Style: Rustic outdoor with elegant touches.
Priorities: Photography, venue, and catering are most important.
The user values authenticity over perfection.
```

**Widget Prompt** (vendor research widget):
```
You are a vendor research specialist. Your job is to:
1. Find vendors matching the project criteria
2. Analyze their work for style alignment
3. Provide pricing comparisons
4. Flag any concerns or red flags

Format outputs as structured reports with clear recommendations.
Be thorough but concise. Prioritize vendors with strong portfolios.
```

**Job Prompt** (specific task):
```
Research wedding photographers in Seattle area:
- Budget: Under $3,000
- Style: Outdoor, natural lighting, candid moments
- Availability: June 2026
- Must have portfolio with at least 10 weddings

Output: List of 10 photographers with analysis
```

**Auto-Injected Context**:
```
User Crystals: Prefers visual aesthetics, values authenticity, 
  budget-conscious but willing to splurge on priorities

Project Notes: "Love the idea of golden hour shots", 
  "Want photographer who can capture emotions"

Previous Widget Output: "Venue selected: Woodland park, 
  natural lighting excellent 4-7pm"
```

**Final Composed Prompt** → Sent to AI for execution

---

## Data Model: Prompt-Driven Schema

### New Core Tables

#### 1. `project_prompts` - Project-Level Intelligence

```typescript
project_prompts: defineTable({
  // Identity
  projectId: v.id("projects"),
  userId: v.string(),
  promptId: v.string(),
  
  // Prompt Content
  baseInstructions: v.string(),       // Core instructions for ALL widgets
  description: v.string(),            // Human-readable: "Wedding project voice"
  tone: v.optional(v.string()),       // "professional", "casual", "technical"
  focusAreas: v.optional(v.array(v.string())), // ["budget", "timeline", "style"]
  
  // System Instructions (added to every job)
  systemContext: v.optional(v.string()), // Critical context that applies everywhere
  constraints: v.optional(v.array(v.string())), // ["keep responses under 500 words"]
  
  // Version Control
  isActive: v.boolean(),              // Only one active per project
  version: v.number(),
  previousVersion: v.optional(v.string()), // Link to previous prompt
  
  // Metadata
  createdAt: v.number(),
  updatedAt: v.number(),
  createdBy: v.string(),              // "user" | "ai_generated" | "system"
  lastUsedAt: v.optional(v.number()),
  usageCount: v.number(),
})
  .index("by_project", ["projectId"])
  .index("by_project_active", ["projectId", "isActive"])
  .index("by_user", ["userId"])
```

#### 2. `widget_prompts` - Widget-Specific Behavior

```typescript
widget_prompts: defineTable({
  // Identity
  promptId: v.string(),
  widgetId: v.string(),
  projectId: v.id("projects"),
  userId: v.string(),
  
  // Prompt Content
  instructions: v.string(),           // Main widget personality/instructions
  description: v.string(),            // "Vendor research specialist"
  role: v.optional(v.string()),       // "researcher", "analyst", "tracker"
  
  // Prompt Composition
  inheritsProjectPrompt: v.boolean(), // Layer on top of project prompt?
  inheritanceStrategy: v.union(       // How to combine with project
    v.literal("prepend"),             // Project first, then widget
    v.literal("append"),              // Widget first, then project
    v.literal("merge"),               // Intelligently merge
    v.literal("override")             // Ignore project, use only widget
  ),
  
  // Examples & Constraints
  examples: v.optional(v.array(v.object({
    scenario: v.string(),             // "Finding photographers"
    expectedApproach: v.string(),     // How widget should handle it
    sampleOutput: v.optional(v.string())
  }))),
  outputFormat: v.optional(v.string()), // "markdown report", "structured list"
  constraints: v.optional(v.array(v.string())),
  
  // Additional Context
  contextSources: v.optional(v.array(v.string())), // ["crystals", "notes", "previous_outputs"]
  maxContextTokens: v.optional(v.number()),
  
  // Version Control
  isActive: v.boolean(),
  version: v.number(),
  previousVersion: v.optional(v.string()),
  
  // Metadata
  createdAt: v.number(),
  updatedAt: v.number(),
  editedBy: v.string(),               // "user" | "ai_refined" | "system"
  lastUsedAt: v.optional(v.number()),
  usageCount: v.number(),
  avgExecutionTime: v.optional(v.number()),
})
  .index("by_widget", ["widgetId"])
  .index("by_widget_active", ["widgetId", "isActive"])
  .index("by_project", ["projectId"])
```

#### 3. `job_prompts` - Execution-Level Instructions

```typescript
job_prompts: defineTable({
  // Identity
  promptId: v.string(),
  jobId: v.string(),
  widgetId: v.string(),
  projectId: v.id("projects"),
  userId: v.string(),
  
  // Final Composed Prompt
  finalInstructions: v.string(),      // Complete prompt sent to AI
  instructionsPreview: v.string(),    // First 200 chars for UI display
  
  // Prompt Sources (transparency)
  composition: v.object({
    projectPrompt: v.optional(v.object({
      promptId: v.string(),
      content: v.string(),
      weight: v.number()             // How much it influenced (0-1)
    })),
    widgetPrompt: v.optional(v.object({
      promptId: v.string(),
      content: v.string(),
      weight: v.number()
    })),
    jobSpecific: v.optional(v.string()), // User's specific instructions
    contextInjected: v.optional(v.object({
      crystals: v.optional(v.string()),
      notes: v.optional(v.string()),
      previousOutputs: v.optional(v.string()),
    })),
  }),
  
  // Composition Strategy
  compositionMethod: v.string(),      // "layered", "merged", "overridden"
  compositionLog: v.optional(v.array(v.string())), // How it was built
  
  // User Customization
  userModified: v.boolean(),
  userModifications: v.optional(v.object({
    originalPrompt: v.string(),
    modifiedPrompt: v.string(),
    modifiedAt: v.number(),
    reason: v.optional(v.string())    // Why user edited it
  })),
  
  // Execution Metadata
  tokenCount: v.optional(v.number()),
  estimatedCost: v.optional(v.number()),
  
  // Timestamps
  createdAt: v.number(),
  executedAt: v.optional(v.number()),
  viewedByUserAt: v.optional(v.number()), // When user viewed the prompt
})
  .index("by_job", ["jobId"])
  .index("by_widget", ["widgetId"])
  .index("by_user_modified", ["userId", "userModified"])
  .index("by_project", ["projectId", "createdAt"])
```

#### 4. `prompt_templates` - Reusable Templates

```typescript
prompt_templates: defineTable({
  templateId: v.string(),
  userId: v.optional(v.string()),     // Null = system template
  
  // Template Content
  name: v.string(),                   // "Research Specialist"
  description: v.string(),
  category: v.string(),               // "research", "analysis", "tracking"
  instructions: v.string(),
  
  // Template Type
  templateType: v.union(
    v.literal("project"),             // Can be used as project prompt
    v.literal("widget"),              // Can be used as widget prompt
    v.literal("both")
  ),
  
  // Usage Stats
  usageCount: v.number(),
  rating: v.optional(v.number()),     // User rating 1-5
  
  // Metadata
  isPublic: v.boolean(),              // Can other users see/use?
  tags: v.array(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_category", ["category"])
  .index("by_user", ["userId"])
  .index("by_public", ["isPublic", "usageCount"])
```

### Updated Widget Schema

Add to `project_widgets.widgets`:

```typescript
{
  // ... existing fields ...
  
  // NEW: Prompt Configuration
  widgetPromptId: v.optional(v.string()), // Active prompt for this widget
  useCustomPrompt: v.boolean(),           // True = custom, False = template
  promptTemplateId: v.optional(v.string()), // If using template
  
  // ... rest of fields ...
}
```

### Updated Job Schema

Add to `widget_jobs`:

```typescript
{
  // ... existing fields ...
  
  // NEW: Prompt Configuration
  jobPromptId: v.string(),              // Required - every job has prompt
  promptVisible: v.boolean(),           // Show prompt to user?
  allowPromptEdit: v.boolean(),         // Can user edit before running?
  
  // ... rest of fields ...
}
```

---

## Backend Architecture: Dynamic Prompt System

### Prompt Composition Service

```python
# app/agents/widget_agents/prompt_composer.py

from typing import Dict, List, Optional
from dataclasses import dataclass

@dataclass
class PromptLayer:
    source: str  # "project" | "widget" | "job"
    content: str
    weight: float
    metadata: Dict

class PromptComposer:
    """
    Composes final agent instructions from layered prompts.
    Replaces hardcoded .txt files with dynamic Convex-based prompts.
    """
    
    def __init__(self):
        self.context_enricher = ContextEnrichmentService()
    
    async def compose_job_prompt(
        self,
        job_id: str,
        widget_id: str,
        project_id: str,
        user_id: str,
        job_instructions: Optional[str] = None
    ) -> ComposedPrompt:
        """
        Build final prompt by composing layers:
        1. Fetch project base prompt (if exists)
        2. Fetch widget prompt (if exists)
        3. Add job-specific instructions
        4. Inject context (crystals, notes, outputs)
        5. Return complete prompt + metadata
        """
        
        layers = []
        
        # Layer 1: Project Base Prompt
        project_prompt = await self._fetch_project_prompt(project_id)
        if project_prompt:
            layers.append(PromptLayer(
                source="project",
                content=project_prompt["baseInstructions"],
                weight=0.3,
                metadata={"promptId": project_prompt["promptId"]}
            ))
        
        # Layer 2: Widget Prompt
        widget_prompt = await self._fetch_widget_prompt(widget_id)
        if widget_prompt:
            # Respect inheritance strategy
            if widget_prompt["inheritsProjectPrompt"]:
                strategy = widget_prompt["inheritanceStrategy"]
                layers.append(self._apply_inheritance(
                    project_prompt, widget_prompt, strategy
                ))
            else:
                layers.append(PromptLayer(
                    source="widget",
                    content=widget_prompt["instructions"],
                    weight=0.5,
                    metadata={"promptId": widget_prompt["promptId"]}
                ))
        
        # Layer 3: Job-Specific Instructions
        if job_instructions:
            layers.append(PromptLayer(
                source="job",
                content=job_instructions,
                weight=0.8,
                metadata={}
            ))
        
        # Layer 4: Context Injection (automatic)
        context = await self._build_context(user_id, project_id, widget_id)
        if context:
            layers.append(PromptLayer(
                source="context",
                content=context,
                weight=0.2,
                metadata={"auto_injected": True}
            ))
        
        # Compose final prompt
        final_prompt = self._merge_layers(layers)
        
        # Save to Convex for transparency
        await self._save_job_prompt(
            job_id=job_id,
            final_prompt=final_prompt,
            layers=layers,
            user_id=user_id
        )
        
        return final_prompt
    
    def _merge_layers(self, layers: List[PromptLayer]) -> str:
        """
        Merge prompt layers intelligently.
        Higher weight = more influence.
        """
        sections = []
        
        # Project prompt (if exists)
        project_layer = next((l for l in layers if l.source == "project"), None)
        if project_layer:
            sections.append(f"# Project Context\n{project_layer.content}\n")
        
        # Widget prompt (if exists)
        widget_layer = next((l for l in layers if l.source == "widget"), None)
        if widget_layer:
            sections.append(f"# Widget Instructions\n{widget_layer.content}\n")
        
        # Job instructions (if exists)
        job_layer = next((l for l in layers if l.source == "job"), None)
        if job_layer:
            sections.append(f"# Task\n{job_layer.content}\n")
        
        # Context (if exists)
        context_layer = next((l for l in layers if l.source == "context"), None)
        if context_layer:
            sections.append(f"# Additional Context\n{context_layer.content}\n")
        
        return "\n\n".join(sections)
    
    async def _build_context(
        self,
        user_id: str,
        project_id: str,
        widget_id: str
    ) -> str:
        """
        Build automatic context injection.
        Uses existing context enrichment service.
        """
        # Fetch relevant crystals
        crystals = await self._get_relevant_crystals(user_id, widget_id)
        
        # Fetch relevant notes/conversations
        content = await self._get_widget_content(widget_id)
        
        # Fetch previous outputs
        previous_outputs = await self._get_previous_outputs(widget_id, limit=3)
        
        context_parts = []
        
        if crystals:
            context_parts.append(f"User Preferences:\n{self._format_crystals(crystals)}")
        
        if content:
            context_parts.append(f"Relevant Content:\n{self._format_content(content)}")
        
        if previous_outputs:
            context_parts.append(f"Previous Results:\n{self._format_outputs(previous_outputs)}")
        
        return "\n\n".join(context_parts)
```

### Widget Agent Factory (Updated)

```python
# app/agents/widget_agents/widget_agent_factory.py

from app.agents.agent_factory import Agent
from app.agents.widget_agents.prompt_composer import PromptComposer

class WidgetAgentFactory:
    """
    Creates agents with dynamic prompts from Convex.
    No more hardcoded agent types or .txt files.
    """
    
    def __init__(self):
        self.prompt_composer = PromptComposer()
    
    async def create_widget_agent(
        self,
        job_id: str,
        widget_id: str,
        project_id: str,
        user_id: str,
        job_instructions: Optional[str] = None
    ) -> Agent:
        """
        Create agent with dynamically composed prompt.
        
        Key difference: No agent_type parameter!
        The prompt itself defines what the agent does.
        """
        
        # Compose final prompt from layers
        composed_prompt = await self.prompt_composer.compose_job_prompt(
            job_id=job_id,
            widget_id=widget_id,
            project_id=project_id,
            user_id=user_id,
            job_instructions=job_instructions
        )
        
        # Create agent with dynamic instructions
        agent = Agent(
            model=get_gemini_flash_client(),
            user_id=user_id,
            description="Dynamic widget agent",
            instructions=composed_prompt.final_instructions,
            session_id=job_id,
            debug_mode=False,
            add_datetime_to_context=True
        )
        
        return agent
```

### Job Execution Flow

```python
# app/agents/widget_agents/job_executor.py

class WidgetJobExecutor:
    """
    Executes widget jobs with dynamic prompts.
    """
    
    async def execute_job(
        self,
        job_id: str,
        widget_id: str,
        project_id: str,
        user_id: str,
        job_config: Dict[str, Any]
    ) -> JobResult:
        """
        Execute job with dynamic prompt composition.
        
        Flow:
        1. Fetch/compose prompt layers
        2. Allow user to edit if enabled
        3. Create agent with final prompt
        4. Execute and capture output
        5. Save output + prompt used
        """
        
        # Get job configuration
        allow_edit = job_config.get("allowPromptEdit", False)
        job_instructions = job_config.get("instructions", "")
        
        # Compose prompt
        factory = WidgetAgentFactory()
        agent = await factory.create_widget_agent(
            job_id=job_id,
            widget_id=widget_id,
            project_id=project_id,
            user_id=user_id,
            job_instructions=job_instructions
        )
        
        # Execute
        result = await agent.run()
        
        # Save output with prompt transparency
        await self._save_output(
            job_id=job_id,
            output=result,
            prompt_id=agent.prompt_id  # Link to prompt used
        )
        
        return result
```

---

## Frontend: Prompt Management UI

### Components

#### 1. Prompt Editor

```tsx
// components/prompts/PromptEditor.tsx

interface PromptEditorProps {
  level: 'project' | 'widget' | 'job'
  promptId?: string
  onSave: (prompt: PromptData) => void
}

export function PromptEditor({ level, promptId, onSave }: PromptEditorProps) {
  const [instructions, setInstructions] = useState('')
  const [description, setDescription] = useState('')
  const [previewMode, setPreviewMode] = useState(false)
  
  // Live preview of composed prompt
  const previewPrompt = useQuery(api.prompts.previewComposition, {
    level,
    instructions,
    // ... other context
  })
  
  return (
    <div className="space-y-4">
      {/* Level indicator */}
      <Badge variant={getLevelVariant(level)}>
        {level.toUpperCase()} PROMPT
      </Badge>
      
      {/* Description */}
      <Input
        placeholder="What does this prompt do?"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      
      {/* Instructions editor */}
      <Textarea
        placeholder="Enter instructions..."
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
        rows={12}
        className="font-mono"
      />
      
      {/* Template suggestions */}
      <PromptTemplates onSelect={setInstructions} />
      
      {/* Preview toggle */}
      <Tabs value={previewMode ? 'preview' : 'edit'}>
        <TabsList>
          <TabsTrigger value="edit">Edit</TabsTrigger>
          <TabsTrigger value="preview">
            Preview Final Prompt
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="preview">
          <ComposedPromptPreview prompt={previewPrompt} />
        </TabsContent>
      </Tabs>
      
      {/* Save actions */}
      <div className="flex gap-2">
        <Button onClick={() => onSave({ instructions, description })}>
          Save Prompt
        </Button>
        <Button variant="outline" onClick={() => saveAsTemplate()}>
          Save as Template
        </Button>
      </div>
    </div>
  )
}
```

#### 2. Job Prompt Viewer

```tsx
// components/prompts/JobPromptViewer.tsx

export function JobPromptViewer({ jobId }: { jobId: string }) {
  const jobPrompt = useQuery(api.jobPrompts.getByJob, { jobId })
  const [showComposition, setShowComposition] = useState(false)
  
  if (!jobPrompt) return null
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Prompt Used for This Job</CardTitle>
        <CardDescription>
          View the exact instructions the AI received
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {/* Final prompt */}
        <div className="bg-muted p-4 rounded-lg font-mono text-sm">
          {jobPrompt.finalInstructions}
        </div>
        
        {/* Show composition breakdown */}
        <Button 
          variant="ghost" 
          onClick={() => setShowComposition(!showComposition)}
          className="mt-4"
        >
          {showComposition ? 'Hide' : 'Show'} Prompt Composition
        </Button>
        
        {showComposition && (
          <div className="mt-4 space-y-3">
            {/* Project layer */}
            {jobPrompt.composition.projectPrompt && (
              <PromptLayer
                source="Project"
                content={jobPrompt.composition.projectPrompt.content}
                weight={jobPrompt.composition.projectPrompt.weight}
              />
            )}
            
            {/* Widget layer */}
            {jobPrompt.composition.widgetPrompt && (
              <PromptLayer
                source="Widget"
                content={jobPrompt.composition.widgetPrompt.content}
                weight={jobPrompt.composition.widgetPrompt.weight}
              />
            )}
            
            {/* Job layer */}
            {jobPrompt.composition.jobSpecific && (
              <PromptLayer
                source="Job"
                content={jobPrompt.composition.jobSpecific}
                weight={1.0}
              />
            )}
            
            {/* Auto-injected context */}
            {jobPrompt.composition.contextInjected && (
              <PromptLayer
                source="Auto Context"
                content={JSON.stringify(jobPrompt.composition.contextInjected, null, 2)}
                weight={0.2}
                isContext
              />
            )}
          </div>
        )}
        
        {/* User modifications indicator */}
        {jobPrompt.userModified && (
          <Alert variant="info" className="mt-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              This prompt was modified by the user before execution
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
```

#### 3. Widget Details Panel (Updated)

```tsx
// Add "Prompt" tab to widget details panel

<Tabs>
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="content">Content</TabsTrigger>
    <TabsTrigger value="outputs">Outputs</TabsTrigger>
    <TabsTrigger value="activity">Activity</TabsTrigger>
    <TabsTrigger value="prompt">
      Prompt 
      <Badge variant="outline" className="ml-2">AI</Badge>
    </TabsTrigger>
  </TabsList>
  
  {/* Prompt tab */}
  <TabsContent value="prompt">
    <PromptEditor
      level="widget"
      promptId={widget.widgetPromptId}
      onSave={updateWidgetPrompt}
    />
  </TabsContent>
</Tabs>
```

#### 4. Pre-Job Prompt Edit Dialog

```tsx
// components/prompts/PreJobPromptDialog.tsx

export function PreJobPromptDialog({ 
  jobConfig, 
  onRun, 
  onCancel 
}: PreJobPromptDialogProps) {
  const [editedPrompt, setEditedPrompt] = useState(jobConfig.instructions)
  const composedPreview = useQuery(api.prompts.previewJobPrompt, {
    widgetId: jobConfig.widgetId,
    jobInstructions: editedPrompt
  })
  
  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit Job Instructions</DialogTitle>
          <DialogDescription>
            Customize what the AI will do for this run
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Editable instructions */}
          <Textarea
            value={editedPrompt}
            onChange={(e) => setEditedPrompt(e.target.value)}
            rows={6}
            placeholder="What should the AI do?"
          />
          
          {/* Preview final composed prompt */}
          <Accordion type="single" collapsible>
            <AccordionItem value="preview">
              <AccordionTrigger>
                Preview Final Prompt
              </AccordionTrigger>
              <AccordionContent>
                <pre className="bg-muted p-4 rounded text-xs overflow-auto max-h-60">
                  {composedPreview?.finalPrompt}
                </pre>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={() => onRun(editedPrompt)}>
            Run with Custom Prompt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

---

## Implementation Plan (Revised)

### Phase 1: Prompt Infrastructure (Week 1)

**Goal**: Schema + basic prompt storage/retrieval

1. **Schema**:
   - Create `project_prompts` table
   - Create `widget_prompts` table
   - Create `job_prompts` table
   - Create `prompt_templates` table
   - Update `widget_jobs` with prompt fields

2. **Mutations**:
   - `createProjectPrompt`, `updateProjectPrompt`
   - `createWidgetPrompt`, `updateWidgetPrompt`
   - `saveJobPrompt` (auto-created on job execution)
   - `createPromptTemplate`, `listTemplates`

3. **Queries**:
   - `getProjectPrompt`, `getWidgetPrompt`, `getJobPrompt`
   - `previewPromptComposition` (preview before save)
   - `listPromptTemplates`

4. **Backend**:
   - Create `PromptComposer` service
   - Implement layered composition logic
   - Migration: create default prompts for existing widgets

### Phase 2: Dynamic Agent Creation (Week 2)

**Goal**: Agents use Convex prompts instead of .txt files

1. **Backend**:
   - Update `WidgetAgentFactory` to use `PromptComposer`
   - Remove hardcoded agent types
   - Implement context injection (crystals, notes, outputs)

2. **Job Execution**:
   - Fetch prompts before job runs
   - Compose final instructions
   - Save composed prompt to `job_prompts`
   - Execute agent with dynamic instructions

3. **Testing**:
   - Test prompt composition with different layers
   - Verify context injection works
   - Ensure backwards compatibility

### Phase 3: Prompt UI & Editing (Week 3)

**Goal**: Users can view/edit prompts

1. **Components**:
   - `PromptEditor` - for creating/editing prompts
   - `JobPromptViewer` - show prompt used after execution
   - `PreJobPromptDialog` - edit prompt before running
   - `PromptTemplates` - browse/select templates

2. **Widget Details Panel**:
   - Add "Prompt" tab
   - Show active widget prompt
   - Allow inline editing
   - Preview composition

3. **Job Flow**:
   - Option to "Edit prompt before running"
   - Show prompt after job completes
   - Link outputs to prompts used

### Phase 4: Templates & Intelligence (Week 4)

**Goal**: Prompt templates, smart suggestions, optimization

1. **Templates**:
   - Create system templates for common tasks
   - Allow users to save custom templates
   - Template marketplace/library

2. **Prompt Intelligence**:
   - Analyze successful prompts
   - Suggest improvements
   - A/B testing for prompt optimization

3. **Advanced Features**:
   - Prompt versioning with diffs
   - Rollback to previous prompts
   - Prompt performance analytics

---

## Key Benefits

### For Users
✅ **Full Control**: Edit AI instructions anytime  
✅ **Complete Transparency**: See exactly what prompts were used  
✅ **Infinite Flexibility**: Jobs can do anything AI can do  
✅ **Learning**: Understand how to write effective prompts  
✅ **Reusability**: Save successful prompts as templates  

### For System
✅ **No Hardcoding**: Prompts are data, not code  
✅ **Easy Updates**: Change prompts without deployment  
✅ **Experimentation**: Test different approaches easily  
✅ **Scalability**: Add new capabilities via prompts  
✅ **Intelligence**: Learn from successful prompts  

### For AI
✅ **Layered Context**: Rich, composed instructions  
✅ **User-Specific**: Prompts adapt to user preferences  
✅ **Project-Aware**: Understand project context  
✅ **Task-Focused**: Clear, specific instructions  

---

## Next Steps

1. **Review this architecture** - confirm approach
2. **Design prompt composition rules** - how layers merge
3. **Create default prompt templates** - system templates for common tasks
4. **Start Phase 1** - schema and basic infrastructure

---

*Document Version: 2.0 - Prompt-Driven Architecture*  
*Last Updated: October 2, 2025*  
*Status: Planning - Ready for Review*

