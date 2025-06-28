# Product Requirements Document: Timeline Bugs Fix

## 1. Executive Summary

**Goal:**
Fix three critical timeline navigation and UX bugs to ensure the timeline always loads at the current time, zoom controls are user-friendly and never skip levels, and timeline controls reliably snap to the present. This PRD outlines the current issues, desired behaviors, and step-by-step implementation plans for each fix.

---

## 2. Problem Statements & Desired Behaviors

### 2.1 Initial Load: Timeline Loads at First Historical Data Instead of Current Time

**Current Behavior:**
- When the timeline loads, it sometimes snaps to the earliest or most recent data in the system, not the current date (today/this month/this week).
- This is due to auto-snap logic in view components and TimelineControls.tsx, which override the default date range if data exists.

**Desired Behavior:**
- On initial load, the timeline should always display the current period (today, this month, or this week), regardless of historical data.


---

### 2.2 Zoom Control: Zooming is Too Fast and Skips MonthView

**Current Behavior:**
- The zoom control (mouse wheel + ctrl/cmd) in TimelineScroller.tsx can process multiple events too quickly, causing the zoom level to skip from year directly to week, bypassing month.
- There is no throttle or debounce on the zoom handler.

**Desired Behavior:**
- Each zoom event should only change the zoom level by one step (year <-> month <-> week).
- There should be a throttle (e.g., 300–500ms) so that rapid wheel events do not cause multiple zooms in quick succession.
- The user should always see MonthView when zooming in from YearView, and never skip levels.

---

### 2.3 TimelineControls: Controls Should Always Snap to Current Time

**Current Behavior:**
- TimelineControls.tsx sometimes uses the most recent data or the current visible range when snapping, not always the current date.
- Clicking controls may not reliably bring the user to the present period (today/this month/this week).

**Desired Behavior:**
- All "snap to present" or "go to current" actions in TimelineControls.tsx should always use the current date.
- After clicking these controls, the timeline should always center on the current period, regardless of data.

---

## 3. Implementation Plan

### 3.1 Fix Initial Load to Snap to Current Time

**Step 1:**
- Audit all timeline view components (YearView.tsx, MonthView.tsx) for logic that auto-snaps the visible date range to the earliest or most recent data on mount.
- Remove or refactor this logic so that, on initial load, the timeline always uses the default date range for the current period (as set by useTimelineStore).

**Step 2:**
- Ensure that useTimelineStore initializes visibleDateRange to the current period (today/this month/this week) using getDefaultDateRange.
- On first load, do not override this with data-driven logic.

**Step 3:**
- If a "jump to latest" or similar button is desired in the future, implement it as an explicit user action, not as part of the initial load.

---

### 3.2 Throttle and Correct Zoom Control

**Step 1:**
- In TimelineScroller.tsx, add a throttle (e.g., 300–500ms) to the zoom handler (wheel + ctrl/cmd) so that only one zoom event is processed per interval.

**Step 2:**
- Ensure that each zoom event only changes the zoom level by one step (never skipping from year directly to week or vice versa).
- Use a zoom level array (e.g., ['year', 'month', 'week']) and increment/decrement the index by 1 per event.

**Step 3:**
- Test zooming in and out with the mouse wheel and ensure that the user always sees MonthView when zooming in from YearView, and never skips levels.

---

### 3.3 Controls Always Snap to Now

**Step 1:**
- In TimelineControls.tsx, update all "snap to present"/"go to current" logic to use the current date, not the most recent data.
- For example, when the user clicks "go to current month" or "go to current week", set visibleDateRange to the period containing today.

**Step 2:**
- Ensure that after clicking these controls, the timeline always centers on the current period (today/this month/this week), regardless of where the user was previously or what data exists.

**Step 3:**
- Test all controls to confirm that they reliably bring the user to the present period.

---

## 4. Acceptance Criteria

- [ ] On initial load, the timeline always displays the current period (today/this month/this week), regardless of historical data.
- [ ] Zooming in/out with the mouse wheel + ctrl/cmd only changes the zoom level by one step per event and never skips MonthView.
- [ ] All "snap to present"/"go to current" controls always bring the user to the current period, not the most recent data.
- [ ] No new features or unrelated changes are introduced.
- [ ] All changes are covered by manual testing in the UI.
