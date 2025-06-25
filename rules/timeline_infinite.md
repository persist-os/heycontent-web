Here is the **full PRD** for the Infinite Timeline + Roadmap view, tailored for a **Next.js + Convex frontend-only architecture**.

---

# 🧾 Product Requirements Document (PRD)

## 🗂️ Title

**Infinite Timeline + Roadmap View with Zoom Transitions**

---

## 📌 Overview

This feature introduces an infinite-scrolling, zoom-responsive timeline for creators. Users can horizontally scroll through time (years, months, weeks), with the interface dynamically transforming from a compact timeline to a stylized roadmap view as they zoom in. The frontend-only implementation uses **Convex subscriptions** to load content progressively and reflect updates in real time.

---

## 🎯 Goals

* Allow infinite horizontal scrolling through time (both past and future).
* Dynamically zoom between 3 views: Yearly → Monthly → Weekly (Roadmap).
* Never overwrite content — always append or expand data contextually.
* Build entirely in the frontend using `useQuery`/`usePaginatedQuery` from Convex.

---

## 🖥️ User Interface States

### 1. 📅 Yearly View (Default)

#### Description:

* The user sees a dense, ruler-style timeline with monthly ticks.
* Key events appear as vertical lines with emoji dots and folder icons.
* Persona cards only show on milestone dates.

#### UI Elements:

* Yellow ruler ticks (`01`, `15` of each month).
* Slim folder stat stacks per date (10 blue, 2 purple, etc.).
* Milestone highlight bubbles (e.g., “First Post Published!”).
* Time scrubber at the bottom (`2025`, `2024`, etc.) and view toggles (`Yearly`, `Monthly`, `Weekly`).

#### Behavior:

* Infinite scroll left/right.
* Scroll position determines visible year range.
* Content is pulled incrementally based on scroll distance.

---

### 2. 📆 Monthly View (Zoomed In)

#### Description:

* The monthly view expands the timeline: more spacing between dates.
* Each post cluster for the month is now rendered with actual context: e.g., persona name, level badge, folders, and highlight bars.
* Vertical lines still appear but with additional indicators (streaks, level-ups, etc.).

#### UI Elements:

* Persona card with badge (e.g., `The Aspiring Experimentalist – Lv.2`).
* 3–4 emoji folder icons.
* Streak bars (`Streak of 3`, etc.).
* Event hover states with tooltips.

#### Behavior:

* Appears automatically when zoom crosses threshold (pinch, button).
* Scroll behavior remains horizontal.
* Visible data window is \~3 months.

---

### 3. 🛣️ Weekly View (Roadmap Mode)

#### Description:

* Morphs into a stylized horizontal roadmap with milestones.
* Road is a dashed yellow line with dots at weekly intervals.
* Events are stacked as floating cards, descending from the road.

#### UI Elements:

* Large event card: Persona + Content Highlights + Folder icons.
* Road path (Framer Motion or SVG).
* Checkpoint dots (one per major post day).
* Decorative emojis animated near checkpoints.

#### Behavior:

* Smooth animated transition from monthly view.
* Only visible if zoomLevel is set to `week`.
* Infinite scroll continues but on a zoomed-in scale (\~7–14 days visible).

---

## 🧠 Zooming Behavior

### Zoom Levels

| Zoom Level | Label   | Behavior                           | Triggers                       |
| ---------- | ------- | ---------------------------------- | ------------------------------ |
| `year`     | Yearly  | Default compact view               | App load, manual button toggle |
| `month`    | Monthly | Expands spacing, more detail       | Pinch-in, zoom toggle          |
| `week`     | Weekly  | Roadmap mode, full milestone cards | Zoom further, toggle button    |

### Zoom Transitions

* Triggered by:

  * Scroll wheel or trackpad zoom
  * Manual toggle (`Yearly / Monthly / Weekly`)
  * Pinch gesture on touch devices
* Uses Framer Motion for smooth layout transitions.
* Retains scroll position and offset when switching views.

---

## 🔁 Infinite Scroll

### Behavior:

* The timeline is horizontally infinite in both directions.
* As the user scrolls, the app:

  * Subscribes to new data using `usePaginatedQuery` from Convex.
  * Caches previously loaded segments to avoid redundant fetches.
  * Uses `IntersectionObserver` to lazily mount new cards/events.

### Data Strategy:

* Convex Query: `timelineEventsByRange({ startDate, endDate })`
* Prefetch + extend on scroll.
* Use client-side store (Zustand or internal context) to avoid flickering.

---

## 📦 Component Breakdown

| Component              | Responsibility                                                |
| ---------------------- | ------------------------------------------------------------- |
| `TimelineScroller.tsx` | Handles horizontal scroll, zoom levels, and data subscription |
| `YearView.tsx`         | Renders minimal tick-based timeline                           |
| `MonthView.tsx`        | Shows expanded view with contextual persona info              |
| `RoadmapView.tsx`      | Animated horizontal road with large milestone cards           |
| `TimelineCard.tsx`     | Renders each event’s visual payload (date, folders, etc.)     |
| `ZoomControls.tsx`     | Manual zoom buttons and level indicator                       |
| `useTimelineStore.ts`  | Handles zoom level, scroll state, and loaded event cache      |

---

## 🧪 Edge Behavior

* Scroll position is preserved across zoom levels.
* Always appends to timeline — no events are removed.
* Cards animate into view from fade + scale (for delight).
* Handles rapid zoom or scroll without performance degradation.

---

## ✅ Success Criteria

* Smooth, infinite scroll with no major performance drops.
* Responsive zoom transitions between views.
* Roadmap mode activates and renders without layout shift.
* All views dynamically subscribe to the latest Convex data.
