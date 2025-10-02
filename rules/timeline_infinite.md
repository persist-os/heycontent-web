# 🛠️ Timeline System: Contributor Guide

This document is a technical guide for developers working on the Infinite Timeline and Roadmap feature. It covers the architecture, state management, component responsibilities, and best practices for extending or debugging the timeline system.

---

## 🏗️ Architecture Overview

- **Frontend:** Next.js (React) with Zustand for state, Convex for backend data.
- **Infinite Scroll:** Timeline is horizontally infinite in both directions. Periods (years, months, weeks) are loaded and extended as the user scrolls.
- **Zoom Levels:** Three main views: Year (`YearView`), Month (`MonthView`), Week/Roadmap (`RoadmapView`).
- **State:** Timeline state (zoom, scroll, visible range, events) is managed by `useTimelineStore` (Zustand). Persona and content data is managed by `@persona-store.ts`.

---

## 🧩 Main Components & Responsibilities

| Component                | Responsibility                                                      |
|--------------------------|---------------------------------------------------------------------|
| `TimelineScroller.tsx`   | Manages scroll, zoom, period loading, and view switching.            |
| `YearView.tsx`           | Renders compact, tick-based timeline for yearly view.                |
| `MonthView.tsx`          | Renders expanded monthly view with persona and content context.      |
| `RoadmapView.tsx`        | Renders stylized roadmap (weekly) with milestone cards.              |
| `TimelineCard.tsx`       | Renders individual event cards (date, persona, folders, etc).        |
| `TimelineControls.tsx`   | Zoom controls, navigation, and snapping to present.                  |
| `useTimelineStore.ts`    | Zustand store for timeline UI state (zoom, scroll, visible range).   |
| `@persona-store.ts`      | Zustand store for persona data, CRUD, and backend sync.              |

---

## 🗃️ State Management

### Timeline Store (`useTimelineStore.ts`)
- **zoomLevel:** `'year' | 'month' | 'week'` — controls which view is rendered.
- **scrollPosition:** Horizontal scroll offset (in px).
- **visibleDateRange:** `{ start: Date, end: Date }` — current visible window.
- **events:** Array of timeline events (posts, milestones, etc.).
- **isLoading:** UI loading state.
- **Actions:** `setZoomLevel`, `setScrollPosition`, `setVisibleDateRange`, `addEvents`, `setLoading`.

### ⚠️ DEPRECATED: Crystal Store (formerly Persona Store)
- **REPLACED BY:** Crystal and shard system - use crystal queries instead
- **OLD ACTIONS:** `initializePersonaData`, `refreshPersonaData`, etc. - DEPRECATED
- **NEW PATTERN:** Use `api.crystalQueries.getPersonaData` for crystal/shard data
- **TODO:** Update this documentation to reflect crystal system patterns

---

## 🔁 Infinite Scroll & Period Management

- **Periods:** Timeline is divided into periods (years, months, weeks) depending on zoom.
- **Dynamic Loading:** As the user scrolls near the edges, new periods are generated and appended/prepended.
- **Data Fetching:** Data for each period is fetched using Convex queries (see `usePersonaTimelineData`).
- **Snapping:** The timeline attempts to keep the user's focus centered, but this can be fragile with infinite scroll.

---

## 🔍 Zoom & View Logic

- **Zoom Transitions:** Controlled by `zoomLevel` in the timeline store. Can be changed via controls, scroll wheel, or pinch.
- **View Switching:** `TimelineScroller` renders the appropriate view (`YearView`, `MonthView`, `RoadmapView`) based on `zoomLevel`.
- **Scroll Preservation:** Attempts to preserve scroll position and visible range across zooms.

---

## 🧑‍💻 Extending the Timeline

- **To add a new event type:**
  - Update the `TimelineEvent` type in `useTimelineStore.ts`.
  - Update data fetching logic to include the new event type.
  - Update `TimelineCard.tsx` to render the new event appropriately.
- **To add new persona or content features:**
  - Update the persona store and data queries.
  - Update the relevant view(s) to display new data.
- **To change period logic:**
  - Edit `generatePeriodsForZoom` and `extendPeriods` in `TimelineScroller.tsx`.

---

## ⚠️ Common Pitfalls & Debugging Tips

- **Alignment Issues:** Persona cards and events may misalign if period logic or stacking math is off. Check period generation and position calculations.
- **Infinite Scroll Bugs:** If the timeline jumps or loses sync, check the logic for extending periods and updating `visibleDateRange`.
- **State Sync:** Always refresh the persona store after mutations to avoid stale UI.
- **Zoom/Scroll Sync:** If zooming causes the timeline to lose the user's place, review how scroll position and visible range are managed.
- **Performance:** Large numbers of periods or events can cause slowdowns. Use memoization and avoid unnecessary re-renders.

---

## 📝 Best Practices

- **Memoize** expensive calculations (e.g., grouping events, generating periods).
- **Keep stores single-responsibility:** Timeline UI state in `useTimelineStore`, data in `@persona-store.ts`.
- **Test edge cases:** Rapid zooming, scrolling, and data updates.
- **Document** any new event types or view logic in this file for future contributors.

---

## 🧪 Testing & Edge Cases

- Test with no data, lots of data, and rapid user interactions.
- Check that scroll and zoom transitions are smooth and state is preserved.
- Ensure that restoring personas or updating data is reflected everywhere in the UI.

---

## 🚩 Gotchas

- **Snapping and visible range logic** is fragile with true infinite scroll.
- **Persona stacking and alignment** is complex and can break with dynamic data.
- **UI state** (e.g., which persona is active in a stack) can get out of sync if the underlying data changes.
- **Analytics and folder linking** in the modal is not implemented.
- **UI polish and accessibility** need improvement, especially for edge cases and responsiveness.

---

## 📚 Further Reading
- See `@persona-store.ts` for persona state logic.
- See `useTimelineStore.ts` for timeline UI state.
- See `TimelineScroller.tsx` for period and scroll logic.
- See `YearView.tsx`, `MonthView.tsx`, `RoadmapView.tsx` for view-specific logic.
- See `TimelineCard.tsx` for event rendering.

---

*Update this guide as the timeline evolves!*
