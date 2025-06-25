# Roadmap Data Integration PRD

## Overview

This PRD outlines the implementation plan for integrating real data into the RoadmapView folder modals based on persona generation timespans. The implementation will use existing Convex queries and follow the infinite timeline architecture outlined in `timeline_infinite.md`.

## Current State Analysis

### RoadmapView.tsx Current Behavior
- Displays personas sorted by creation date (`createdAt`)
- Shows 4 folder types with hardcoded counts:
  - Blue folder (Chat): 3 items
  - Purple folder (Smart Notes): 2 items  
  - Orange folder (Content): 5 items
  - Yellow folder (Analytics): 4 items
- Each folder opens a modal via `FolderModalManager`

### Existing Convex Queries to Leverage

| Folder Color | Data Type | Existing Convex Query | Schema Table |
|--------------|-----------|---------------------|--------------|
| Blue | Chat Conversations | `api.chatQueries.getHistory` | `conversations` |
| Purple | Smart Notes | `api.notes.getNotesByUser` | `notes` |
| Orange | Content Hub Items | `api.contentHub.getByUserId` | `contentHubInsights` |
| Yellow | Analytics Insights | `api.notes.getAnalyticsInsights` | `notes` (type: `analytics_insight`) |

## Implementation Plan

### Phase 1: Utility Creation
Create `src/app/dashboard/timeline/utils/personaDataCalculator.ts` with:
- `calculatePersonaTimespan(personas: Persona[], currentPersonaIndex: number)` 
- `filterDataByTimespan<T>(items: T[], timespan: PersonaTimespan, dateField: string)`

### Phase 2: Data Aggregation Hook  
Create `src/app/dashboard/timeline/hooks/usePersonaTimelineData.ts` that:
- Uses existing Convex subscriptions (`useQuery`)
- Aggregates all data types in one hook
- Calculates counts per persona timespan
- Returns real-time updating data

### Phase 3: Component Updates
- Update `RoadmapView.tsx` to use real data counts from the hook
- Update `FolderModalManager.tsx` to pass real data to modals
- Update individual modal components to display real data with **skeletons only**

### Phase 4: Modal Content Components
Enhance existing modal components to display real data:
- `ChatFolderModal.tsx` - Display actual conversation previews
- `SmartNotesFolderModal.tsx` - Display real note previews with types
- `ContentFolderModal.tsx` - Display actual content hub insights
- `AnalyticsFolderModal.tsx` - Display real analytics insight notes

## Technical Specifications

### Timespan Calculation Logic
```typescript
interface PersonaTimespan {
  personaId: string
  startDate: Date
  endDate: Date
  isLatest: boolean
}

function calculatePersonaTimespan(personas: Persona[], index: number): PersonaTimespan {
  const current = personas[index]
  const next = personas[index + 1]
  
  return {
    personaId: current._id,
    startDate: new Date(current.createdAt),
    endDate: next ? new Date(next.createdAt) : new Date(), // Now if latest
    isLatest: !next
  }
}
```

### Convex Query Strategy (Using Existing Queries)
- Use `useQuery` with existing Convex functions for real-time subscriptions
- Client-side filtering by date ranges (no new Convex functions needed)
- Leverage existing caching and optimization in Convex queries
- Follow infinite timeline pattern from `timeline_infinite.md`

### Data Aggregation Strategy
```typescript
interface PersonaFolderData {
  personaId: string
  timespan: PersonaTimespan
  folders: {
    blue: { count: number, items: Conversation[] }
    purple: { count: number, items: Note[] }
    orange: { count: number, items: ContentHubInsight[] }
    yellow: { count: number, items: Note[] } // analytics_insight type
  }
}

interface PersonaTimespan {
  personaId: string
  startDate: Date
  endDate: Date
  isLatest: boolean
}
```

## Success Criteria

1. **Accurate Counts**: Folder badges show real item counts for each persona timespan
2. **Real Data Display**: Modals show actual user-generated content
3. **Performance**: No degradation in scroll or interaction performance
4. **Real-time Updates**: Data updates when new content is created
5. **Clean Architecture**: Components remain modular and reusable

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Create utility functions for timespan calculation
- [ ] Set up basic Convex queries for each data type
- [ ] Create initial hooks structure

### Phase 2: Integration (Week 2)  
- [ ] Update RoadmapView to use real data counts
- [ ] Implement FolderModalManager data passing
- [ ] Create modal content display components

### Phase 3: Polish (Week 3)
- [ ] Add loading states and error handling
- [ ] Implement pagination for large datasets
- [ ] Add real-time updates and optimizations

## Technical Considerations

### Performance
- Use `usePaginatedQuery` for large datasets
- Implement virtual scrolling if needed
- Cache timespan calculations
- Debounce rapid scroll updates

### Data Consistency
- Handle edge cases (no data, single persona, etc.)
- Ensure date calculations are timezone-aware
- Handle persona deletion/updates gracefully

### User Experience
- Show loading skeletons during data fetch
- Display empty states with helpful messaging
- Maintain smooth transitions between views
- Preserve modal state during data updates 