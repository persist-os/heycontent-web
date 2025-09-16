# Constellation System Architecture Diagram

## 🏗️ System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CONSTELLATION SYSTEM                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐    ┌─────────────────┐               │
│  │   OVERVIEW      │    │ PROJECT DETAIL  │               │
│  │   MODE          │◄──►│ MODE            │               │
│  │                 │    │                 │               │
│  │ • All Projects  │    │ • Focused       │               │
│  │ • Titles + Dots │    │   Project       │               │
│  │ • Hover Effects │    │ • Widgets       │               │
│  │ • 20% Zoom      │    │ • Orbital       │               │
│  │                 │    │   Positions     │               │
│  └─────────────────┘    └─────────────────┘               │
│           ▲                        ▲                       │
│           │                        │                       │
│           └──────── 80% Threshold ─┘                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🎮 Zoom Levels & Progressive Disclosure

```
Zoom Level:  10%    30%    50%    70%    80%    120%   200%
             │      │      │      │      │      │      │
             ▼      ▼      ▼      ▼      ▼      ▼      ▼
Projects:    Dots   Cards  Spaces Spaces Spaces Spaces Spaces
Widgets:     Hidden Hidden Hidden Dots   Dots   Full   Full
View Mode:   Overview ←───────────────→ Project Detail
```

## 🧩 Component Hierarchy

```
UnifiedConstellationView
├── ProjectSpaceBoundary (per project)
├── MultiLevelWidget (per widget)
├── ConnectionLines
├── ConstellationControls
├── ConstellationMinimap
├── CreateProjectModal
├── CreateWidgetModal
└── ProjectOptionsModal
```

## 🔄 Data Flow

```
Database (Convex)
├── Projects Table
│   ├── Static Positions (x, y, radius)
│   └── Project States (new, active, complete)
└── Widgets Table
    ├── Orbital Positions (angle, distance)
    └── Widget Config (type, priority, size)

↓

Hooks
├── useStaticConstellationLayout
├── useMultiLevelPanZoom
├── useWidgetOrbitalLayout
└── useProjectStates

↓

Components
├── UnifiedConstellationView
├── ProjectSpaceBoundary
└── MultiLevelWidget
```

## 🎯 User Interactions

```
Mouse Events:
├── Left Click
│   ├── Project Space → Focus/Zoom In
│   └── Widget → Show Details (future)
├── Right Click
│   └── Project Space → Options Modal
└── Hover
    ├── Project Space → Show Boundary
    └── Widget → Show Details

Keyboard:
├── Scroll → Zoom (cursor-centric)
├── Drag → Pan
└── Reset → Center at 20%

Touch (Future):
├── Pinch → Zoom
├── Two-finger Drag → Pan
└── Tap → Select
```

## 🚀 Performance Features

```
Viewport Culling
├── Only render visible elements
├── Efficient for 100+ projects
└── Smooth performance

Level of Detail (LOD)
├── Different detail levels by zoom
├── Automatic switching
└── Smooth transitions

Smooth Animations
├── requestAnimationFrame
├── Easing functions
└── Consistent timing
```

## 📱 Page Structure

```
/dashboard/living-projects
├── Main Page (Overview)
│   └── UnifiedConstellationView
└── [projectId] (Project Detail)
    └── UnifiedConstellationView (with initialProjectId)
```

## 🎨 Visual States

```
Project States:
├── New (Blue Glow) - Created < 24h
├── Active (Orange Glow) - Modified < 1 week
└── Complete (Green Glow) - Has fingerprint

Widget States:
├── Hidden - Zoom < 70%
├── Dot - Zoom 70-120%
└── Full - Zoom > 120%
```

## 🔧 Technical Stack

```
Frontend:
├── React 18
├── TypeScript
├── Tailwind CSS
├── Next.js 14
└── Convex (Real-time)

Backend:
├── Convex Database
├── Real-time Queries
├── Mutations
└── File Storage

State Management:
├── React Hooks
├── Convex React
├── Local State
└── URL State
```

## 🎯 Development Phases

```
Phase 1: Static Project Positioning ✅
├── Database schema updates
├── Static positioning algorithm
└── Project space management

Phase 2: Unified Multi-Level View ✅
├── Single component architecture
├── View mode switching
└── Progressive disclosure

Phase 3: Real Widget Data Integration ✅
├── Widget CRUD operations
├── Orbital positioning
└── Widget creation modal

Phase 4: Performance Optimizations ⏳
├── Viewport culling
├── Widget virtualization
└── Memory management
```

---

This diagram provides a visual overview of the Constellation System architecture and implementation.
