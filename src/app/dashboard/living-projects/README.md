# Living Projects System

A sophisticated project intelligence platform that transforms static project data into living, evolving systems through AI-powered fingerprinting and personalized dashboard experiences.

## 🏗️ System Architecture

### Core Philosophy

Living Projects treats each project as a unique entity with its own personality, preferences, and evolution trajectory. The system learns from user interactions to create increasingly personalized experiences over time.

### Key Components

#### 🎯 **Project Discovery & Fingerprinting**

- **ProjectDiscoveryChat** *(in chat/components)*: Interactive conversation system that discovers project characteristics
- **AmbientFingerprintCanvas** *(in chat/components)*: Visual constellation mapping of discovered fingerprint fields
- **useProjectContext** *(in chat/hooks)*: Hook for managing project data and content integration

#### 🌌 **Constellation View**

- **ConstellationView**: Main canvas for exploring project relationships and connections
- **useConstellationLayout**: Force-directed layout algorithm for project positioning
- **usePanZoom**: Smooth pan and zoom functionality with gesture support
- **ConnectionLines**: Visual connections between related projects

#### 🧩 **Widget Ecosystem**

- **ConstellationCanvas**: Main widget constellation view with pan/zoom
- **FloatingWidgetCard**: Individual widget cards with dynamic sizing
- **WidgetGenerationLoader**: Loading states during AI widget generation
- **WidgetDetailsPanel**: Detailed widget information and interactions
- **useWidgetGeneration**: Hook for AI-powered widget generation via backend agents

#### 🎨 **UI Components**

- **ProjectStar**: Interactive project nodes in constellation view
- **ConstellationControls**: Navigation and zoom controls
- **ConstellationMinimap**: Overview navigation with project clusters

## 📁 Directory Structure

```
living-projects/
├── README.md                    # This file - System overview
├── page.tsx                     # Main constellation page
├── [projectId]/
│   ├── page.tsx                # Individual project view
│   └── components/
│       ├── ProjectViewScreen.tsx # Project detail screen with AI widgets
│       ├── hooks/
│       │   ├── useWidgetGeneration.ts # AI widget generation hook
│       │   ├── useProjectActions.ts   # Project CRUD operations
│       │   ├── useProjectFingerprint.ts # Fingerprint data fetching
│       │   └── useWidgetLayout.ts     # Widget positioning logic
│       ├── utils/
│       │   └── widgetStyling.ts      # Widget theme and styling utilities
│       └── widgets/
│           ├── ConstellationCanvas.tsx # Main widget constellation view
│           ├── FloatingWidgetCard.tsx  # Individual widget rendering
│           ├── WidgetDetailsPanel.tsx  # Widget detail view
│           └── WidgetGenerationLoader.tsx # Generation loading state
├── components/
│   ├── ConstellationView.tsx     # Main project constellation interface
│   ├── ConnectionLines.tsx       # Project relationship lines
│   ├── ConstellationControls.tsx # Navigation controls
│   ├── ConstellationMinimap.tsx  # Overview minimap
│   ├── CreateProjectModal.tsx    # New project creation
│   ├── LoadingState.tsx          # Loading UI
│   └── widgets/
│       └── ConstellationTransition.tsx # Transition animations
└── hooks/
   ├── useConstellationLayout.ts # Layout algorithms
   ├── usePanZoom.ts           # Pan/zoom functionality
   └── useProjectConnections.ts # Project relationships
```

## 🔄 Data Flow

### 1. Project Creation

```tsx
// User creates project with initial context
const project = await createProject({
  name: "Creative Portfolio",
  description: "Building stunning portfolio website"
})
```

### 2. Discovery Conversation

```tsx
// Interactive chat discovers project characteristics (in chat system)
import { ProjectDiscoveryChat } from '../chat/components/ProjectDiscoveryChat'

<ProjectDiscoveryChat projectId={projectId} />
```

### 3. Fingerprint Generation

```tsx
// AI analyzes conversation to create project fingerprint
const fingerprint = await generateFingerprint(conversationHistory)
```

### 4. AI Widget Generation

```tsx
// Backend AI agents generate personalized widgets
const response = await fetchWithApiKey(`/api/projects/${projectId}/generate-widgets`, {
  method: 'POST',
  body: JSON.stringify({
    fingerprint_id: currentFingerprint._id,
    project_id: projectId,
    user_preferences: {}
  })
})
```

### 5. Widget Display

```tsx
// ConstellationCanvas renders AI-generated widgets
<ConstellationCanvas
  widgets={projectWidgets.widgets}
  onWidgetClick={handleWidgetClick}
  onWidgetHover={handleWidgetHover}
/>
```

## 🔗 Chat System Integration

The living projects system integrates deeply with the chat system for project discovery:

### Chat Components Used
- **ProjectDiscoveryChat** (`/chat/components/`): Handles the AI conversation for fingerprinting
- **AmbientFingerprintCanvas** (`/chat/components/`): Provides visual feedback during discovery
- **useProjectContext** (`/chat/hooks/`): Manages project data integration with chat

### Integration Pattern
```tsx
// From constellation view to discovery chat
const handleProjectClick = (project: Project) => {
  if (project.fingerprintId) {
    // Go to living project view
    router.push(`/dashboard/living-projects/${project._id}`)
  } else {
    // Start discovery chat
    router.push(`/dashboard/thinking_lab?projectId=${project._id}`)
  }
}
```

### State Synchronization
- Project context flows from chat to living projects
- Fingerprint completion triggers constellation transition
- Real-time updates sync between chat and project views

## 🎨 Design Philosophy

### Anti-Corporate Aesthetics

- **Human-Centered**: Warm, approachable design that feels like a conversation
- **Personality-Driven**: Each project gets its own visual identity based on domain
- **Organic Layout**: Natural positioning using physics-based algorithms
- **Contextual Theming**: Colors and styles adapt to project type and mood

### Interaction Patterns

- **Discovery-First**: Projects evolve through conversation rather than forms
- **Progressive Disclosure**: Information revealed gradually as needed
- **Seamless Transitions**: Smooth animations between different states
- **Multi-Scale Navigation**: Zoom from constellation overview to project detail

## 🔧 Technical Implementation

### Core Technologies

- **React 18** with TypeScript for type safety
- **Convex** for real-time backend and data persistence
- **Tailwind CSS** for responsive, themeable styling
- **Framer Motion** for smooth animations

### Key Hooks

#### useProjectContext *(in chat/hooks)*

```tsx
import { useProjectContext } from '../chat/hooks/useProjectContext'

const { projectContext, isLoading, error, contentSummary } = useProjectContext(
  projectId,
  fingerprintId,
  userId
)
```

#### useConstellationLayout

```tsx
const layout = useConstellationLayout(projects)
// Returns positioned projects with connection data
```

#### usePanZoom

```tsx
const { transform, containerRef, zoomIn, zoomOut, resetView } = usePanZoom(
  canvasWidth,
  canvasHeight
)
```

### State Management

- **Zustand** for global content context *(shared with chat system)*
- **React Query** for server state management
- **Local State** for UI interactions
- **Cross-system sync** between chat and living projects components

## 🚀 Getting Started

### Basic Usage

```tsx
import { ConstellationView } from './components/ConstellationView'

function LivingProjectsPage() {
  return <ConstellationView />
}
```

### Project Discovery

```tsx
import { ProjectDiscoveryChat } from '../chat/components/ProjectDiscoveryChat'

function ProjectSetup({ projectId }) {
  return <ProjectDiscoveryChat projectId={projectId} />
}
```

### Widget Integration

```tsx
import { ConstellationCanvas } from './[projectId]/components/widgets/ConstellationCanvas'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'

function ProjectDashboard({ projectId }) {
  const projectWidgets = useQuery(
    api.projectWidgetsQueries.getProjectWidgetsByProject,
    { projectId }
  )
  
  return (
    <ConstellationCanvas
      widgets={projectWidgets?.widgets || []}
      onWidgetClick={(widget) => console.log('Clicked:', widget)}
      onWidgetHover={(widgetId) => console.log('Hovered:', widgetId)}
    />
  )
}
```

## 📊 Project Intelligence

### Fingerprint Fields

The system tracks 25+ project characteristics:

**Core Identity**

- `name`, `description` - Project basics
- `domain` - academic, creative, business, etc.
- `complexity_level` - 1-10 scale

**Working Style**

- `primary_pattern` - Working methodology
- `collaboration_style` - Team vs solo preferences
- `time_horizon` - Sprint, project, journey scale

**Personality Traits**

- `base_personality` - AI interaction style
- `decision_making` - How decisions are made
- `energy_patterns` - When and how work flows

**Context & Constraints**

- `user_constraints` - Time, resource limitations
- `support_systems` - Available help and resources
- `external_dependencies` - Required external factors

### Learning & Adaptation

The system continuously learns from:

- **Conversation Patterns**: How users describe their work
- **Interaction History**: Which widgets are used most
- **Feedback Loops**: Explicit and implicit user preferences
- **Project Evolution**: How projects change over time

## 🎯 Widget System

### AI-Driven Widget Generation

Widgets are now generated by backend AI agents that analyze project fingerprints and user behavior:

1. **Backend Generation**: `/api/projects/${projectId}/generate-widgets` endpoint
2. **Intelligent Analysis**: AI agents examine fingerprint characteristics
3. **Convex Storage**: Generated widgets stored in real-time database
4. **Automatic Updates**: Widgets regenerate when fingerprint evolves

### Widget Types

Widget types are dynamically determined by AI based on project characteristics:

- **Chat**: AI conversation interface
- **Progress Trackers**: Writing, code, research progress
- **Time Management**: Calendars, schedules, time tracking
- **Collaboration**: Team boards, peer review systems
- **Resource Management**: Libraries, inspiration boards
- **Analytics**: Mood tracking, productivity metrics
- **Domain-Specific**: Custom widgets for unique project types

### Theme System

Theme classes are centralized in `widgetStyling.ts`:

- **Warm**: Orange/yellow gradients for creative projects
- **Clean**: Slate/gray gradients for technical projects
- **Professional**: Blue/indigo gradients for business projects
- **Creative**: Purple/pink gradients for artistic projects

### Constellation Layout

- **Force-directed positioning** for natural widget relationships
- **Virtual rendering** for performance with many widgets
- **Zoom-responsive detail** showing more content at higher zoom levels
- **Pan and zoom** with smooth gesture support
- **Connection visualization** showing widget relationships

## 🔮 Future Evolution

### AI Integration

- ✅ **AI-powered widget generation** using backend agents (IMPLEMENTED)
- ✅ **Fingerprint-based recommendations** analyzing 25+ project characteristics (IMPLEMENTED)
- **Enhanced ML personalization** learning from widget interaction patterns
- **Predictive features** anticipating user needs based on project evolution
- **Collaborative AI** learning from team patterns and shared workflows

### Advanced Features

- **Project lineage tracking** showing evolution over time
- **Cross-project insights** identifying patterns across work
- **Automated milestone detection** from conversation patterns
- **Team constellation views** for collaborative project management

## 🧪 Development

### Running the System

```bash
# Start the development server
npm run dev

# Navigate to living projects
http://localhost:3000/dashboard/living-projects
```

### Testing

```bash
# Run widget system tests
npm test -- --testPathPattern=widgets

# Run layout algorithm tests
npm test -- --testPathPattern=layout
```

### Architecture Notes

- **Modular Design**: Each component can be used independently
- **Type Safety**: Full TypeScript coverage with strict typing
- **Performance**: Virtual rendering for large project constellations
- **Accessibility**: Full keyboard navigation and screen reader support

## 🔗 System Dependencies

### Required Systems
- **Chat System** (`/dashboard/thinking_lab/`): Required for project discovery and fingerprinting
- **Convex Backend**: Real-time data persistence, synchronization, and widget storage
- **Backend AI Agents** (`/api/projects/.../generate-widgets`): AI-driven widget generation
- **Authentication**: Firebase user management and permissions

### Optional Integrations
- **Notes System**: Enhanced project content integration
- **Calendar Integration**: Timeline synchronization
- **External APIs**: Third-party service connections

## 🤝 Contributing

The living projects system is designed to be extensible:

1. **New Widget Types**: Extend backend AI agents to generate new widget types
2. **Widget Themes**: Update `widgetStyling.ts` for new visual themes
3. **Layout Algorithms**: Extend `useWidgetLayout.ts` for new positioning strategies
4. **Interaction Patterns**: Modify hooks in `/[projectId]/components/hooks/` directory
5. **AI Generation Logic**: Enhance backend agents for better widget recommendations
6. **Chat Integration**: Extend discovery flows in `/chat/components/`

## 📈 Performance Considerations

- **Virtual Rendering**: Only renders visible project nodes
- **Connection Culling**: Hides connections outside viewport
- **Debounced Updates**: Prevents excessive re-renders during pan/zoom
- **Memory Management**: Proper cleanup of event listeners and timers

## 🔍 Debugging

### Common Issues

- **Layout not updating**: Check `useConstellationLayout` dependencies
- **Widgets not loading**: Verify fingerprint data structure
- **Performance issues**: Enable React DevTools Profiler

### Debug Tools

- **Constellation Debug View**: Shows layout calculations
- **Widget Recommendation Log**: Traces recommendation decisions
- **Performance Monitor**: Tracks render times and memory usage
