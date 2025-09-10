# Individual Project Views

Components and pages for viewing and interacting with individual living projects in the constellation system.

## 📁 Directory Structure

```
[projectId]/
├── README.md              # This file
├── page.tsx               # Main project page component
└── components/
    └── ProjectViewScreen.tsx # Project detail screen
```

## 🖼️ Main Components

### `page.tsx`

Main page component that renders individual project views:

```tsx
import React from 'react'
import { ProjectViewScreen } from './components/ProjectViewScreen'

interface ProjectPageProps {
  params: {
    projectId: string
  }
}

export default function ProjectPage({ params }: ProjectPageProps) {
  return <ProjectViewScreen projectId={params.projectId} />
}
```

**Features:**

- **Dynamic Routing**: Uses Next.js dynamic routes with project ID
- **Project Loading**: Fetches project data based on URL parameter
- **Error Handling**: Graceful handling of invalid or missing projects
- **Loading States**: Skeleton screens during data fetching

### `ProjectViewScreen.tsx`

Comprehensive project view component with tabbed interface:

```tsx
import { ProjectViewScreen } from './components/ProjectViewScreen'

function IndividualProjectPage({ projectId }) {
  return <ProjectViewScreen projectId={projectId} />
}
```

**Features:**

- **Tabbed Interface**: Overview, Intelligence, Timeline, Actions
- **Project Stats**: Key metrics and status indicators
- **Fingerprint Display**: Visual intelligence fingerprint
- **Action Integration**: Direct access to chat, notes, and discovery
- **Responsive Design**: Adapts to different screen sizes

## 🔄 Navigation Flow

### From Constellation to Project

```tsx
// User clicks project star in constellation
const handleProjectClick = (project: Project) => {
  if (project.fingerprintId) {
    // Has fingerprint - go to living project view
    router.push(`/dashboard/living-projects/${project._id}`)
  } else {
    // No fingerprint - go to discovery
    router.push(`/dashboard/project-discovery?projectId=${project._id}`)
  }
}
```

### Within Project View

```tsx
// Tab navigation between different project aspects
const tabs = [
  { key: 'overview', label: 'Overview' },
  { key: 'intelligence', label: 'Intelligence' },
  { key: 'timeline', label: 'Timeline' },
  { key: 'actions', label: 'Actions' }
]
```

## 🎯 Project States

### Fingerprint Status

Projects can exist in different states based on fingerprint completion:

#### **Discovering State**

- No fingerprint yet created
- Shows basic project information
- Prominent "Begin Discovery" call-to-action
- Limited functionality until fingerprint is complete

#### **Living State**

- Full fingerprint available
- Complete widget dashboard
- All features and interactions available
- Intelligence actively evolving

### Project Maturity

```tsx
const getProjectStatus = (project: Project) => {
  if (!project.fingerprintId) {
    return { status: 'discovering', priority: 'high' }
  }

  const isRecent = Date.now() - project.updatedAt < 24 * 60 * 60 * 1000
  if (isRecent) {
    return { status: 'active', priority: 'medium' }
  }

  return { status: 'living', priority: 'low' }
}
```

## 📊 Data Fetching

### Project Query

```tsx
// Fetch project details with fingerprint and metadata
const project = useQuery(
  api.projectsQueries.getProjectDetails,
  projectId && firebaseUser?.uid ? {
    projectId: projectId as Id<"projects">,
    userId: firebaseUser.uid
  } : 'skip'
)
```

### Fingerprint Loading

```tsx
// Load fingerprint data for intelligence display
const { currentFingerprint, isLoading: fingerprintLoading } = useProjectFingerprintStore()

useEffect(() => {
  if (firebaseUser?.uid && projectId) {
    initializeFingerprintData(projectId, firebaseUser.uid)
  }
}, [firebaseUser?.uid, projectId])
```

## 🎨 UI Components

### Project Header

```tsx
<div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-end">
  <div className="lg:col-span-3">
    <h1 className="text-4xl lg:text-5xl font-light tracking-tight">
      {project.name}
    </h1>
    <p className="text-lg text-muted-foreground/80 leading-relaxed max-w-2xl">
      {project.description}
    </p>
  </div>

  <div className="flex flex-col gap-3">
    <Button variant="outline">
      Edit intelligence
    </Button>
  </div>
</div>
```

### Project Stats

```tsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
  <div>
    <div className="text-muted-foreground/60 mb-1">Last evolution</div>
    <div className="font-medium text-foreground">
      {formatDistanceToNow(lastEvolution, { addSuffix: true })}
    </div>
  </div>
  <div>
    <div className="text-muted-foreground/60 mb-1">Status</div>
    <div className="font-medium text-foreground capitalize">
      {currentFingerprint.status || 'Active'}
    </div>
  </div>
  <div>
    <div className="text-muted-foreground/60 mb-1">Complexity</div>
    <div className="font-medium text-foreground">
      {currentFingerprint.complexity_level || 1}/10
    </div>
  </div>
  <div>
    <div className="text-muted-foreground/60 mb-1">Natural rhythm</div>
    <div className="font-medium text-foreground capitalize">
      {currentFingerprint.natural_rhythm || 'Not set'}
    </div>
  </div>
</div>
```

## 🔧 Technical Implementation

### Route Parameters

```tsx
// Next.js 13+ app router pattern
interface ProjectPageProps {
  params: {
    projectId: string  // Dynamic route parameter
  }
}

// Access project ID from URL
export default function ProjectPage({ params }: ProjectPageProps) {
  const { projectId } = params
  // Use projectId to fetch project data
}
```

### Error Boundaries

```tsx
// Handle invalid project IDs gracefully
if (!project) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        <button onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
          Back to projects
        </button>

        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-light text-foreground">
              Project not found
            </h2>
            <p className="text-muted-foreground/60 text-sm">
              This project may have been deleted or you may not have access.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### Loading States

```tsx
if (!project || !currentFingerprint) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        <button onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
          Back to projects
        </button>

        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-pulse mx-auto" />
            <h2 className="text-xl font-light text-foreground">
              Loading project
            </h2>
            <p className="text-muted-foreground/60 text-sm">
              Preparing your project intelligence...
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
```

## 🎯 User Actions

### Primary Actions

```tsx
const handleStartChat = () => {
  router.push(`/dashboard/chat?projectId=${projectId}`)
}

const handleCreateNote = () => {
  router.push(`/dashboard/notes?projectId=${projectId}`)
}

const handleEditFingerprint = () => {
  router.push(`/dashboard/project-discovery?projectId=${projectId}`)
}
```

### Navigation Actions

```tsx
const handleBackToProjects = () => {
  router.push('/dashboard/living-projects')
}

const handleBackToChat = () => {
  router.push(`/dashboard/chat?projectId=${projectId}`)
}
```

## 📱 Responsive Design

### Mobile Layout

```tsx
// Stack header elements vertically on mobile
<div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-end">
  {/* Project info takes full width on mobile */}
  <div className="lg:col-span-3">
    <h1 className="text-4xl lg:text-5xl font-light tracking-tight">
      {project.name}
    </h1>
  </div>

  {/* Actions stack below on mobile */}
  <div className="flex flex-col gap-3">
    <Button variant="outline" className="w-full justify-start">
      Edit intelligence
    </Button>
  </div>
</div>
```

### Tab Navigation

```tsx
// Responsive tab layout
<div className="flex items-center gap-8 border-b border-border/30">
  {tabs.map(({ key, label }) => (
    <button
      key={key}
      onClick={() => setActiveTab(key)}
      className={`pb-4 px-1 text-sm font-medium transition-colors duration-200 relative ${
        activeTab === key
          ? 'text-foreground'
          : 'text-muted-foreground hover:text-foreground/70'
      }`}
    >
      {label}
      {activeTab === key && (
        <div className="absolute bottom-0 left-0 right-0 h-px bg-foreground" />
      )}
    </button>
  ))}
</div>
```

## 🧪 Testing

### Component Testing

```tsx
describe('ProjectViewScreen', () => {
  it('renders project information correctly', () => {
    const mockProject = {
      _id: 'project-123',
      name: 'Test Project',
      description: 'A test project description',
      fingerprintId: 'fp-456'
    }

    render(<ProjectViewScreen projectId="project-123" />)

    expect(screen.getByText('Test Project')).toBeInTheDocument()
    expect(screen.getByText('A test project description')).toBeInTheDocument()
  })

  it('handles missing project gracefully', () => {
    // Mock API to return null
    render(<ProjectViewScreen projectId="nonexistent" />)

    expect(screen.getByText('Project not found')).toBeInTheDocument()
  })
})
```

### Route Testing

```tsx
describe('Project Page Routing', () => {
  it('loads correct project based on route parameter', () => {
    const mockParams = { projectId: 'project-123' }

    render(<ProjectPage params={mockParams} />)

    // Verify correct project data is loaded
    expect(screen.getByText('Project 123')).toBeInTheDocument()
  })
})
```

## 🔍 Debugging

### Common Issues

- **Project not loading**: Check project ID validity and user permissions
- **Fingerprint not displaying**: Verify fingerprint exists and is accessible
- **Navigation broken**: Ensure router context is properly configured
- **Layout issues**: Check responsive breakpoint calculations

### Debug Information

```tsx
// Add debug info in development
if (process.env.NODE_ENV === 'development') {
  console.log('Project Debug Info:', {
    projectId,
    project: project ? 'loaded' : 'null',
    fingerprint: currentFingerprint ? 'loaded' : 'null',
    userId: firebaseUser?.uid
  })
}
```

## 🚀 Future Enhancements

### Planned Features

- **Project Sharing**: Invite team members to view/edit projects
- **Project Templates**: Create reusable project structures
- **Project Analytics**: Track engagement and completion metrics
- **Project Archiving**: Archive completed projects with full history
- **Project Branching**: Create project variants and alternatives

### Performance Optimizations

- **Lazy Loading**: Load project sections on demand
- **Caching**: Cache project data for faster subsequent loads
- **Virtual Scrolling**: Handle large project lists efficiently
- **Progressive Loading**: Load essential data first, details second
