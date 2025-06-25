# Roadmap Data Integration: Implementation & Guide

## Overview

This document describes the current state of data integration in the RoadmapView and folder modals. All roadmap data integrations are **complete**. The system uses real Convex data for all folder types, with accurate counts and real-time updates, following the infinite timeline architecture outlined in `timeline_infinite.md`.

## Current State

### RoadmapView.tsx Behavior
- Displays personas sorted by creation date (`createdAt`).
- Shows 4 folder types with **real, live counts**:
  - Blue folder (Chat): Chat conversations
  - Purple folder (Smart Notes): Notes
  - Orange folder (Content): Content Hub Insights
  - Yellow folder (Analytics): Analytics Insights (notes of type `analytics_insight`)
- Each folder opens a modal via `FolderModalManager`, passing real data.

### Data Sources & Queries

| Folder Color | Data Type | Convex Query Used                | Schema Table         |
|--------------|----------|----------------------------------|---------------------|
| Blue         | Chat     | `api.chatQueries.getHistory`     | `conversations`     |
| Purple       | Notes    | `api.notes.getNotesByUser`       | `notes`             |
| Orange       | Content  | `api.contentHub.getByUserId`     | `contentHubInsights`|
| Yellow       | Analytics| `api.notes.getAnalyticsInsights` | `notes` (analytics) |

- All queries are used with `useQuery` for real-time subscriptions.
- Client-side filtering by persona timespan is implemented for all data types.

## Architecture & Implementation

- **Timespan Calculation:**
  - Each persona's timespan is calculated using their `createdAt` and the next persona's `createdAt` (or now, if latest).
  - Utility: `calculatePersonaTimespan(personas, index)`
- **Data Aggregation:**
  - All data is fetched via Convex queries and filtered by persona timespan.
  - Utility: `filterDataByTimespan(items, timespan, dateField)`
- **Data Hook:**
  - `usePersonaTimelineData` aggregates all data types and provides counts/items per persona timespan.
- **Component Integration:**
  - `RoadmapView.tsx` uses the hook to display real counts.
  - `FolderModalManager.tsx` passes real data to modals.
  - Modal components (`ChatFolderModal`, `SmartNotesFolderModal`, `ContentFolderModal`, `AnalyticsFolderModal`) display real user content, with loading skeletons and empty states as needed.

## Technical Details

### Data Structures
```typescript
interface PersonaTimespan {
  personaId: string
  startDate: Date
  endDate: Date
  isLatest: boolean
}

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
```

### Real-Time Updates
- All folder counts and modal content update in real time as new data is created.
- Uses Convex subscriptions and client-side filtering for performance.

### Performance
- Uses `usePaginatedQuery` for large datasets where needed.
- Timespan calculations and data filtering are memoized.
- Loading skeletons and empty states are shown for a smooth UX.

## Maintenance & Extension Guide

- **To add a new folder/data type:**
  - Add the Convex query and schema mapping.
  - Update the aggregation hook and modal component.
- **To change timespan logic:**
  - Update the utility functions in `personaDataCalculator.ts`.
- **To optimize performance:**
  - Use pagination and memoization for large datasets.
- **To debug:**
  - Check that all queries return expected data and that timespan filtering is correct.

## Success Criteria (All Met)

1. **Accurate Counts:** Folder badges show real item counts for each persona timespan.
2. **Real Data Display:** Modals show actual user-generated content.
3. **Performance:** No degradation in scroll or interaction performance.
4. **Real-time Updates:** Data updates when new content is created.
5. **Clean Architecture:** Components remain modular and reusable.

---

*Update this guide as the roadmap data model or UI evolves!* 