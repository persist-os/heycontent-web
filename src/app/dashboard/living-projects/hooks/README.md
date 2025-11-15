# Living Projects Hooks

Specialized React hooks for managing project intelligence and interactive behaviors in the living projects system.

## 🎣 Available Hooks

### `useProjectContext` (in chat)

Manages project data fetching and content integration for discovery conversations.

```tsx
import { useProjectContext } from '../../chat/hooks/useProjectContext'

function ProjectDiscoveryChat({ projectId, userId }) {
  const { projectContext, isLoading, error, contentSummary } = useProjectContext(
    projectId,
    undefined, // fingerprintId
    userId
  )

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />

  return (
    <ChatInterface
      context={projectContext}
      contentSummary={contentSummary}
    />
  )
}
```

**Returns:**

- `projectContext: ContentContext | null` - Formatted context for chat
- `isLoading: boolean` - Loading state
- `error: string | null` - Error message if any
- `contentSummary: ProjectContentSummary | null` - Structured project data

**Features:**

- Fetches project details with attached notes and conversations
- Formats content for optimal AI context window usage
- Handles content truncation and prioritization
- Provides real-time loading states

### `useProjectConnections`

Analyzes project relationships to create meaningful connections between related projects.

```tsx
import { useProjectConnections } from '../hooks/useProjectConnections'

function ProjectNetwork({ projects }) {
  const connections = useProjectConnections(projects)

  return (
    <div className="project-network">
      {connections.map(connection => (
        <div
          key={`${connection.from}-${connection.to}`}
          className="connection-line"
          style={{
            opacity: connection.strength,
            // Additional styling based on connection strength
          }}
        >
          {/* Connection visualization */}
        </div>
      ))}
    </div>
  )
}
```

**Parameters:**

- `projects: Project[]` - Array of projects to analyze relationships

**Returns:**

- `Connection[]` - Array of connection objects with strength and reasons

**Connection Analysis:**

- **Domain similarity** - Projects in same domain are connected
- **Collaboration style** - Projects with compatible team structures
- **Time horizon overlap** - Projects with similar timescales
- **Shared dependencies** - Projects requiring similar resources
- **Pattern compatibility** - Working style compatibility

## 🔧 Hook Architecture

### Design Principles

- **Single Responsibility** - Each hook handles one specific concern
- **Memoization** - Expensive calculations are cached appropriately
- **Error Handling** - Graceful degradation with meaningful error states
- **Type Safety** - Full TypeScript support with strict typing
- **Performance** - Optimized for large datasets and frequent updates

### State Management

- **Local State** - UI-specific state managed within hooks
- **Server State** - Convex queries for persistent data
- **Derived State** - Computed values based on props and server state
- **Shared State** - Zustand stores for cross-component communication

### Performance Optimizations

- **useMemo** for expensive calculations
- **useCallback** for event handlers
- **Debouncing** for rapid state changes
- **Virtual rendering** support for large datasets
- **Memory leak prevention** with proper cleanup

## 📊 Usage Patterns

### Basic Hook Composition

```tsx
function ProjectDashboard({ projectId }) {
  // Data fetching
  const { projectContext, isLoading } = useProjectContext(projectId) // from chat/hooks

  // Relationship analysis
  const connections = useProjectConnections([projectContext])

  if (isLoading) return <LoadingState />

  return (
    <ProjectGrid
      project={projectContext}
      connections={connections}
    />
  )
}
```

### Advanced Hook Chaining

```tsx
function ComplexProjectView({ projectIds }) {
  // Fetch multiple projects
  const projectContexts = projectIds.map(id =>
    useProjectContext(id) // from chat/hooks
  )

  // Cross-project connections
  const crossConnections = useProjectConnections(
    projectContexts.filter(ctx => ctx.projectContext).map(ctx => ctx.projectContext)
  )

  return <MultiProjectGrid projects={projectContexts} connections={crossConnections} />
}
```

## 🧪 Testing

### Hook Testing Strategy

```tsx
import { renderHook } from '@testing-library/react'
import { useProjectContext } from '../chat/hooks/useProjectContext'

describe('useProjectContext', () => {
  it('returns loading state initially', () => {
    const { result } = renderHook(() =>
      useProjectContext('project-id', undefined, 'user-id')
    )

    expect(result.current.isLoading).toBe(true)
    expect(result.current.projectContext).toBe(null)
  })

  it('formats project content correctly', async () => {
    // Mock Convex query
    const mockProject = { /* project data */ }

    const { result } = renderHook(() =>
      useProjectContext('project-id', undefined, 'user-id')
    )

    // Wait for query to resolve
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.contentSummary).toBeDefined()
    expect(result.current.projectContext).toBeDefined()
  })
})
```

### Mock Data Strategy

```tsx
const mockProjectData = {
  _id: 'project-123',
  name: 'Test Project',
  description: 'A test project for development',
  attachedItems: {
    notes: [
      { title: 'Research Notes', content: 'Important findings...' }
    ],
    conversations: [
      { title: 'Planning Session', messages: [] }
    ]
  }
}
```

## 🔧 Development Guidelines

### Creating New Hooks

1. **Clear Purpose** - Define single responsibility clearly
2. **Type Safety** - Full TypeScript interfaces for inputs/outputs
3. **Error Handling** - Proper error states and user feedback
4. **Performance** - Memoization and cleanup where appropriate
5. **Testing** - Comprehensive test coverage including edge cases

### Hook Dependencies

- **React** - Core React hooks and utilities
- **Convex** - Database queries and mutations
- **Zustand** - Global state management
- **Custom utilities** - Project-specific helper functions

### Best Practices

- **Consistent Naming** - `use[Feature]` pattern
- **Documentation** - JSDoc comments with examples
- **Error Boundaries** - Graceful error handling
- **Accessibility** - Keyboard navigation support
- **Performance Monitoring** - Track hook performance in production
