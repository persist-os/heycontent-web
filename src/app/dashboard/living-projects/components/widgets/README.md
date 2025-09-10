# Widget Factory

This module provides intelligent widget recommendations based on project fingerprints.

## Overview

The `WidgetFactory.tsx` analyzes a project's fingerprint data to recommend 4-6 relevant widgets for each project type. It considers:

- **Domain**: academic, creative, business, professional, personal, skill_development
- **Primary Pattern**: iterative_creator, systematic_builder, exploratory_learner, collaborative_orchestrator
- **Complexity Level**: 1-10 scale
- **Collaboration Style**: solo, small_team, large_group, community, distributed
- **Time Horizon**: sprint, project, journey, lifestyle, ongoing
- **Deliverables**: Analyzes tangible deliverables to suggest specific tracking widgets
- **Sharing Intention**: private, selective, public, community

## Widget Types

- `chat`: Generic chat interface (always included)
- `writing_progress`: Track writing/creative output
- `code_commits`: Track code development progress
- `client_meetings`: Schedule and track client interactions
- `content_calendar`: Plan and track content creation
- `research_tracker`: Log research and discoveries
- `milestone_timeline`: Visual project timeline
- `collaboration_board`: Team coordination tools
- `resource_library`: Organize project resources
- `goal_tracker`: Track goals and objectives
- `mood_tracker`: Track creative/productivity mood
- `time_tracker`: Log time investment
- `inspiration_board`: Collect inspiration and ideas
- `peer_review`: Community feedback system
- `publication_tracker`: Track publication progress

## Usage

```tsx
import { analyzeFingerprintForWidgets } from './widgets/WidgetFactory'

const widgets = analyzeFingerprintForWidgets(fingerprint)
// Returns array of 4-6 WidgetConfig objects with type, theme, size, and priority
```

## Living Project View

The `LivingProjectView` component provides a complete project dashboard:

```tsx
import { LivingProjectView } from './widgets/LivingProjectView'

function ProjectPage({ fingerprint }) {
  return <LivingProjectView fingerprint={fingerprint} />
}
```

Features:

- **Personality-Driven Theming**: Warm for creative projects, clean for academic, professional for business
- **Adaptive Grid Layout**: Handles 4-6 widgets gracefully with optimal spacing
- **Anti-Corporate Design**: Human-centered, warm, and personality-driven
- **Constellation Icon**: Shows project domain with appropriate icon
- **Status Indicators**: Shows project evolution status with personality

## Demo

Try the interactive demo to see how different project types get personalized layouts:

```tsx
import { LivingProjectViewDemo } from './widgets/LivingProjectViewDemo'

function DemoPage() {
  return <LivingProjectViewDemo />
}
```

## Future AI Integration

This rule-based system should eventually be replaced with an AI layer that can:

1. **Dynamic Analysis**: Use ML to analyze fingerprint patterns and user behavior
2. **Personalization**: Learn individual preferences and working styles
3. **Context Awareness**: Consider time of day, project phase, and external factors
4. **Adaptive Recommendations**: Continuously improve widget suggestions based on usage

## Widget Themes

- **Warm**: Orange/yellow gradients for creative, literary projects
- **Clean**: Slate/gray gradients for technical, academic projects
- **Professional**: Blue/indigo gradients for business, collaborative projects

## Fallback Strategy

The factory ensures decent fallbacks by:

1. Always including the chat widget
2. Providing domain-appropriate defaults
3. Adding complexity-based enhancements
4. Ensuring at least 4 widgets per project
5. Graceful handling of missing or incomplete fingerprint data
