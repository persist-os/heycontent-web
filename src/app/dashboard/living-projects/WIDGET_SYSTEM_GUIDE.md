# Widget System Comprehensive Guide

## 🎯 Overview

The Widget System is a sophisticated, AI-powered project management tool that creates personalized widgets for each project based on project fingerprints. It uses a **unified structure** where each widget is stored as an individual database entry, making data manipulation efficient and straightforward.

## 🏗️ System Architecture

### **Unified Widget System**

```
┌─────────────────────────────────────────────────────────────┐
│                    WIDGET SYSTEM                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              PROJECT WIDGETS TABLE                     │ │
│  │                                                         │ │
│  │ • Individual Widget Entries (One Row Per Widget)       │ │
│  │ • Manual Creation (Constellation System)               │ │
│  │ • AI-Generated (Agent System)                          │ │
│  │ • Orbital Positioning                                  │ │
│  │ • Dashboard Layouts                                    │ │
│  │ • Categories & Themes                                  │ │
│  │                                                         │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Database Schema

### **Unified Project Widgets Table** (`project_widgets`)

```typescript
project_widgets: defineTable({
  // Core Identification
  widget_id: v.string(),           // Unique widget identifier
  project_id: v.id("projects"),     // Parent project
  user_id: v.string(),              // Owner
  fingerprint_id: v.id("project_fingerprints"), // AI generation source
  
  // Widget Configuration
  widget_type: v.string(),         // Type: tracker, chart, board, timeline, meter
  title: v.string(),               // Display name
  description: v.string(),         // What it does
  category: v.string(),            // Category/tab (e.g., "Research", "Analysis")
  
  // Layout & Positioning
  priority: v.number(),            // 1-10, determines importance
  size: v.string(),               // small, medium, large, xlarge
  theme: v.string(),              // warm, clean, professional, creative
  position: v.number(),           // Position in dashboard (1-based)
  layout_type: v.string(),        // grid, dashboard, kanban, timeline
  
  // Widget-Specific Configuration
  config: v.any(),                // Widget-specific settings
  data_sources: v.array(v.string()), // Required data sources
  update_frequency: v.string(),   // realtime, hourly, daily, weekly
  
  // Interaction Settings
  interactive: v.boolean(),       // Whether widget is interactive
  editable: v.boolean(),          // Whether widget can be edited
  shareable: v.boolean(),         // Whether widget can be shared
  
  // Orbital Positioning (for constellation system)
  orbital_angle: v.number(),      // 0 to 2π radians
  orbital_distance: v.number(),   // Distance from project center
  
  // Metadata
  created_at: v.number(),
  updated_at: v.number(),
  generated_at: v.number(),       // When AI generated this widget
  version: v.string(),            // Widget configuration version
  confidence: v.number(),         // 0-1 confidence in recommendation
  status: v.string(),            // active, archived, generating
})
.index("by_project", ["project_id"])
.index("by_user", ["user_id"])
.index("by_fingerprint", ["fingerprint_id"])
.index("by_category", ["category"])
.index("by_widget_type", ["widget_type"])
.index("by_status", ["status"])
.index("by_generated", ["generated_at"])
```

## 🤖 AI Agent System

### **Project Widgets Agent**

**Purpose**: Analyzes project fingerprints and generates individual widget entries

**Location**: `backend/app/agents/project_widgets/`

**Key Components**:

#### **1. Agent Configuration** (`agent.py`)
```python
class WidgetEntry(BaseModel):
    """Individual widget entry for database storage."""
    widget_id: str = Field(..., description="Unique identifier for the widget")
    widget_type: str = Field(..., description="Type of widget: tracker, chart, board, timeline, meter, etc.")
    title: str = Field(..., description="Display title for the widget")
    description: str = Field(..., description="Description of what the widget does")
    category: str = Field(..., description="Category/tab this widget belongs to")
    priority: int = Field(..., ge=1, le=10, description="Priority level (1=low, 10=high)")
    size: str = Field(..., description="Size: small, medium, large, xlarge")
    theme: str = Field(..., description="Theme: warm, clean, professional, creative")
    position: int = Field(..., description="Position in dashboard (1-based)")
    layout_type: str = Field(..., description="Layout type: grid, dashboard, kanban, timeline")
    
    # Widget-specific configuration
    config: Dict[str, Any] = Field(..., description="Widget-specific configuration data")
    
    # Data requirements
    data_sources: List[str] = Field(..., description="Data sources this widget needs")
    update_frequency: str = Field(..., description="How often to update: realtime, hourly, daily, weekly")
    
    # Interaction settings
    interactive: bool = Field(..., description="Whether the widget is interactive")
    editable: bool = Field(..., description="Whether the widget can be edited")
    shareable: bool = Field(..., description="Whether the widget can be shared")

class ProjectWidgetsResponse(BaseModel):
    """Response containing individual widget entries for database storage."""
    
    project_id: str = Field(..., description="ID of the project these widgets are for")
    fingerprint_id: str = Field(..., description="ID of the fingerprint used to generate widgets")
    user_id: str = Field(..., description="ID of the user who owns these widgets")
    
    # Global settings (applied to all widgets)
    global_theme: str = Field(..., description="Global theme for all widgets")
    color_scheme: str = Field(..., description="Color scheme: monochrome, colorful, pastel, vibrant")
    font_style: str = Field(..., description="Font style: modern, classic, playful, professional")
    layout_type: str = Field(..., description="Overall layout type: grid, dashboard, kanban, timeline")
    columns: int = Field(..., description="Number of columns in the layout")
    rows: int = Field(..., description="Number of rows in the layout")
    
    # Individual widget entries (each will be a separate database row)
    widgets: List[WidgetEntry] = Field(..., description="List of individual widget entries")
    
    # Metadata
    generated_at: str = Field(..., description="When these widgets were generated")
    version: str = Field(..., description="Version of the widget configuration")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence in widget recommendations")
```

#### **2. Agent Instructions** (`instructions.txt`)

**Key Principles**:
- **Dynamic Category Generation**: Create project-specific categories, not hardcoded ones
- **Project Type Alignment**: Match widgets to project domain (academic, creative, business, etc.)
- **Working Style Compatibility**: Adapt to user's working patterns
- **Cognitive Load Consideration**: Respect user's information processing preferences

**Category Examples**:
- **Academic Research**: "Research", "Analysis", "Writing", "Resources", "Timeline"
- **Creative Project**: "Ideas", "Progress", "Inspiration", "Materials", "Showcase"
- **Business Project**: "Strategy", "Metrics", "Stakeholders", "Milestones", "ROI"

**Widget Types**:
- **Trackers**: Progress tracking, milestone monitoring, goal achievement
- **Charts**: Data visualization, trend analysis, performance metrics
- **Boards**: Task management, idea organization, collaboration spaces
- **Timelines**: Project phases, key milestones, deadline tracking
- **Meters**: Progress indicators, completion rates, success metrics

#### **3. Agent Processing Flow**:
1. **Analyze Project**: Process fingerprint data
2. **Generate Categories**: Create dynamic categories
3. **Create Individual Widgets**: Generate separate widget entries
4. **Assign Positions**: Calculate dashboard positions
5. **Apply Themes**: Set consistent theming
6. **Return Structure**: Individual widget entries ready for database insertion

## 🔄 Complete Flow: Discovery to Creation

### **Phase 1: Project Fingerprint Analysis**

1. **User Creates Project** → Project gets fingerprint via AI analysis
2. **Fingerprint Contains**:
   - Project domain (academic, creative, business, etc.)
   - Working style (iterative, systematic, exploratory)
   - Cognitive load preferences (minimal, rich, customizable)
   - Information density (focused, contextual, comprehensive)

### **Phase 2: Widget Generation Request**

**API Endpoint**: `POST /api/v1/project-widgets/generate`

**Request Flow**:
```python
# 1. Authenticate user
user_id = await auth_service.authenticate_request(http_request)

# 2. Fetch fingerprint data if not provided
if not fingerprint_data and fingerprint_id:
    fingerprint_data = await get_fingerprint(fingerprint_id, user_id)

# 3. Check for existing widgets
existing_widgets = await get_project_widgets_by_project(project_id)

# 4. Generate widgets using AI agent
result = await generate_project_widgets(
    project_fingerprint=fingerprint_data,
    project_id=project_id,
    fingerprint_id=fingerprint_id,
    user_preferences=user_preferences
)
```

### **Phase 3: AI Agent Processing**

**Agent Input**: Complete project fingerprint data
**Agent Processing**:
1. Analyze project characteristics
2. Generate dynamic categories based on project type
3. Create individual widget entries
4. Apply appropriate themes and layouts
5. Set interaction preferences

**Agent Output**: Structured `ProjectWidgetsResponse` with:
- Individual widget entries (not nested arrays)
- Global theme and layout settings
- Confidence scores

### **Phase 4: Database Storage**

**Convex Storage**:
```python
# Save individual widgets to project_widgets table
widget_ids = await create_project_widgets({
    "projectId": project_id,
    "userId": user_id,
    "fingerprintId": fingerprint_id,
    "widgets": widgets_data.get("widgets", []), # Array of individual widget entries
    "version": widgets_data.get("version", "1.0.0"),
    "confidence": widgets_data.get("confidence", 0.8)
})
```

### **Phase 5: Frontend Integration**

**Constellation System Integration**:
```typescript
// Individual widgets for orbital positioning
const widgets: WidgetConfig[] = useMemo(() => {
  return rawWidgets.map(widget => ({
    // Core Identification
    widget_id: widget.widget_id,
    project_id: widget.project_id,
    user_id: widget.user_id,
    fingerprint_id: widget.fingerprint_id,
    
    // Widget Configuration
    widget_type: widget.widget_type,
    title: widget.title,
    description: widget.description,
    category: widget.category,
    
    // Layout & Positioning
    priority: widget.priority,
    size: widget.size,
    theme: widget.theme,
    position: widget.position,
    layout_type: widget.layout_type,
    
    // ... other fields
  }))
}, [rawWidgets])
```

## 🎮 Widget Types & Configuration

### **Available Widget Types**

```typescript
const WIDGET_TYPES = [
  { value: 'content_calendar', label: 'Content Calendar', description: 'Track upcoming posts and campaigns' },
  { value: 'data_visualizer', label: 'Analytics Dashboard', description: 'Performance metrics and insights' },
  { value: 'goal_tracker', label: 'Task Manager', description: 'Daily tasks and reminders' },
  { value: 'research_tracker', label: 'Research Tracker', description: 'Track research progress and findings' },
  { value: 'milestone_timeline', label: 'Milestone Timeline', description: 'Project milestones and deadlines' },
  { value: 'collaboration_board', label: 'Collaboration Board', description: 'Team collaboration and notes' },
  { value: 'resource_library', label: 'Resource Library', description: 'Store and organize project resources' },
  { value: 'mood_tracker', label: 'Mood Tracker', description: 'Track team mood and satisfaction' },
  { value: 'time_tracker', label: 'Time Tracker', description: 'Track time spent on project tasks' },
  { value: 'inspiration_board', label: 'Inspiration Board', description: 'Collect and organize inspiration' },
]
```

### **Widget Configuration Options**

**Sizes**:
- `small`: Compact widget for quick info
- `medium`: Standard size for most content
- `large`: Spacious widget for detailed views

**Themes**:
- `professional`: Clean and business-focused
- `creative`: Colorful and inspiring
- `clean`: Minimal and modern
- `warm`: Friendly and approachable

**Priority Levels** (1-10):
- **1-3**: Low priority, outer orbit
- **4-6**: Medium priority, middle orbit
- **7-10**: High priority, inner orbit

## 🎯 Orbital Positioning System

### **Positioning Algorithm**

```typescript
function calculateOrbitalPosition(
  existingWidgets: Array<{ orbital_angle: number; orbital_distance: number }>,
  priority: number
): { orbital_angle: number; orbital_distance: number } {
  // Priority determines orbit distance
  const baseDistance = 80 + (priority * 15) // 80-230px range
  
  // Find available angle
  const maxAttempts = 36; // Try every 10 degrees
  const angleStep = (2 * Math.PI) / maxAttempts;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidateAngle = attempt * angleStep;
    
    // Check for collisions with existing widgets
    const hasCollision = existingWidgets.some(widget => {
      const angleDiff = Math.abs(candidateAngle - widget.orbital_angle);
      const minAngleDiff = Math.PI / 6; // 30 degrees minimum
      
      if (angleDiff < minAngleDiff || angleDiff > (2 * Math.PI - minAngleDiff)) {
        return true;
      }
      
      const distanceDiff = Math.abs(baseDistance - widget.orbital_distance);
      if (distanceDiff < 40) { // Minimum 40px separation
        return true;
      }
      
      return false;
    });
    
    if (!hasCollision) {
      return {
        orbital_angle: candidateAngle,
        orbital_distance: baseDistance,
      };
    }
  }
  
  // Fallback: use random position if no good spot found
  return {
    orbital_angle: Math.random() * 2 * Math.PI,
    orbital_distance: baseDistance,
  };
}
```

### **Space Radius Calculation**

```typescript
// Update project space radius based on widget count
const newWidgetCount = existingWidgets.length + 1
const newSpaceRadius = Math.max(200, newWidgetCount * 20) // Min 200px, +20px per widget

if (project.space_radius < newSpaceRadius) {
  await ctx.db.patch(projectId, {
    space_radius: newSpaceRadius,
    updatedAt: now,
  })
}
```

## 🔧 API Endpoints

### **Individual Widget Management**

**Create Widget**:
```typescript
POST /api/project-widgets/create
{
  "projectId": "project_id",
  "userId": "user_id",
  "fingerprintId": "fingerprint_id",
  "widgetType": "content_calendar",
  "title": "Content Calendar",
  "description": "Track upcoming posts",
  "category": "Planning",
  "priority": 7,
  "size": "medium",
  "theme": "professional",
  "position": 1,
  "layoutType": "grid",
  "config": {},
  "dataSources": [],
  "updateFrequency": "daily",
  "interactive": true,
  "editable": true,
  "shareable": false
}
```

**Get Widgets by Project**:
```typescript
GET /api/project-widgets/by-project?projectId=project_id&userId=user_id
```

**Update Widget**:
```typescript
POST /api/project-widgets/update
{
  "widgetId": "widget_id",
  "userId": "user_id",
  "updates": {
    "title": "New Title",
    "priority": 8,
    "category": "Analysis"
  }
}
```

**Delete Widget**:
```typescript
POST /api/project-widgets/delete
{
  "widgetId": "widget_id",
  "userId": "user_id"
}
```

### **AI-Generated Widgets**

**Generate Project Widgets**:
```typescript
POST /api/v1/project-widgets/generate
{
  "project_id": "project_id",
  "fingerprint_id": "fingerprint_id",
  "fingerprint_data": { /* optional */ },
  "user_preferences": { /* optional */ }
}
```

## 🎨 Frontend Components

### **CreateWidgetModal**

**Purpose**: Manual widget creation for constellation system

**Features**:
- Widget type selection (10 types)
- Priority slider (1-10)
- Size and theme selection
- Form validation
- Automatic orbital positioning

**Usage**:
```typescript
<CreateWidgetModal
  isOpen={showCreateWidgetModal}
  onClose={() => setShowCreateWidgetModal(false)}
  projectId={focusedProjectId}
  projectName={focusedProject?.name}
  onCreateWidget={handleCreateWidget}
/>
```

### **MultiLevelWidget**

**Purpose**: Renders widgets with progressive disclosure

**Progressive Disclosure Levels**:
- **Hidden**: Not rendered (zoom < 70%)
- **Dot**: Simple circular indicator
- **Summary**: Basic widget information
- **Full**: Complete widget with all details

**Usage**:
```typescript
<MultiLevelWidget
  widget={widget}
  position={position}
  zoomLevel={getWidgetZoomLevel(scale)}
  onClick={handleWidgetClick}
/>
```

## 🔄 Data Flow Summary

### **Individual Widget Creation Flow**

1. **User Action**: Click "New Widget" in constellation view
2. **Modal Opens**: `CreateWidgetModal` with form
3. **Form Submission**: Widget data + project context
4. **API Call**: `createWidget` mutation
5. **Orbital Calculation**: Automatic positioning algorithm
6. **Database Storage**: Insert into `project_widgets` table
7. **UI Update**: Widget appears in constellation orbit

### **AI-Generated Widget Flow**

1. **Project Creation**: User creates project
2. **Fingerprint Generation**: AI analyzes project characteristics
3. **Widget Generation Request**: Frontend calls generation API
4. **AI Agent Processing**: Analyzes fingerprint, generates individual widgets
5. **Database Storage**: Save individual entries to `project_widgets` table
6. **Frontend Integration**: Display in constellation and dashboard views

## 🎯 Key Features

### **Unified Structure**
- ✅ **Single Table**: All widgets stored in `project_widgets` table
- ✅ **Individual Entries**: Each widget is a separate database row
- ✅ **Easy Queries**: Query individual widgets directly
- ✅ **Simple Updates**: Update single widgets without touching others

### **Intelligent Positioning**
- ✅ **Automatic orbital positioning** based on priority
- ✅ **Collision detection** and spacing
- ✅ **Dynamic space radius** updates

### **Progressive Disclosure**
- ✅ **Widgets appear/disappear** based on zoom level
- ✅ **Different detail levels** (dot, summary, full)
- ✅ **Smooth transitions** between levels

### **AI-Powered Generation**
- ✅ **Project-specific widget** recommendations
- ✅ **Dynamic category** creation
- ✅ **Working style** adaptation
- ✅ **Theme and layout** optimization

### **Real-Time Updates**
- ✅ **Convex reactivity** for live updates
- ✅ **Automatic UI** synchronization
- ✅ **Efficient data** fetching

## 🚀 Benefits of New Structure

### **Data Manipulation**
- ✅ **Easy Queries**: Query individual widgets directly
- ✅ **Simple Updates**: Update single widgets without touching others
- ✅ **Efficient Filtering**: Filter by category, type, status, etc.
- ✅ **Better Performance**: No nested array processing

### **Agent Integration**
- ✅ **Structured Output**: Agent generates clear, individual entries
- ✅ **Validation**: Easy to validate each widget entry
- ✅ **Consistency**: Maintain data integrity across entries
- ✅ **Flexibility**: Easy to add new widget types

### **Frontend Integration**
- ✅ **Direct Access**: Access widgets without array iteration
- ✅ **Real-time Updates**: Individual widget updates
- ✅ **Better Caching**: Cache individual widgets
- ✅ **Easier State Management**: Manage widget state individually

## 🚀 Future Enhancements

### **Advanced Widget Types**
- Custom widget creation
- Third-party integrations
- Advanced data visualizations
- Collaborative widgets

### **Enhanced AI Features**
- Learning from user behavior
- Dynamic widget recommendations
- Contextual widget suggestions
- Performance optimization

### **Improved UX**
- Drag-and-drop widget reordering
- Custom widget themes
- Advanced filtering and search
- Widget templates

---

This comprehensive guide covers the entire unified widget system from database schema to AI generation to frontend integration. The new structure provides efficient data manipulation, better performance, and easier maintenance while supporting both manual widget creation and AI-powered generation.