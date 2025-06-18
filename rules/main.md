# HeyContent Web Frontend Rules

This document defines the required engineering standards for the HeyContent frontend, built with Next.js and deployed on Vercel.

## Tech Stack

- Framework: Next.js (App Router)
- Styling: TailwindCSS (utility-first)
- Hosting: Vercel
- API Integration: `api/` folder and `/lib/api-utils.ts`
- Design: Minimalist, typography-first, mobile-optimized

## Core Rules

### 1. File Length Limit

No file may exceed 400 lines. If it does, split it:
- Extract hooks into `use*.ts`
- Extract types into `*.types.ts`
- Break components into smaller files

### 2. Never Guess

Always ask for clarification if:
- You’re unsure about intent, architecture, or design
- A feature is poorly documented
- A spec is ambiguous

Never make assumptions. Check design files, Notion, and existing code first.

### 3. No Emojis Ever

Do not use emojis in:
- Code comments
- PR titles or descriptions
- Commit messages
- UI copy or documentation

ASCII and markdown symbols (→, —, •) are allowed when used sparingly and appropriately.

## Design and Structure

### 4. Minimalist, Type-Driven Design

- Favor clarity and whitespace
- One primary action per screen or component
- Typography defines layout structure

### 5. Pages Handle Routing Only

Do not place logic, state, or API calls in `app/page.tsx` or route files. Pages should:
- Handle layout and structure
- Receive props and render views

### 6. Component Purity

UI components must be:
- Stateless
- Side-effect free
- Driven by props only

State and logic should live in hooks.


### 8. API Communication

Use `/lib/api-utils.ts` and the api folder for all backend interaction. Do not call `fetch` directly in components or pages.

Wrap calls with reusable helpers that handle errors and parsing.

## Code Quality

### 9. No Dead Code

Remove all:
- `console.log` statements
- Commented-out code
- Unused variables and imports

### 10. Linting and Formatting

Use Prettier and ESLint. Follow project settings without overrides.

## Pull Requests

### 11. PR Format

Use this title format:  
`[Type]: [Area] – [Summary]`  
Example: `UI: Chat – Improve mobile scroll behavior`

All PRs must include:
- Concise summary
- Key technical changes
- Link to corresponding Notion task

Follow the shared PR template.

### 12. Review Process

- Review at least one other PR before requesting your own
- Comments must be clear, respectful, and useful

### 13. Commit Standards

- Use clear, descriptive commit messages
- Avoid vague terms like "fix" or "tweak"
- Prefer the imperative mood: `Add`, `Refactor`, `Update`

## Summary

- No file may exceed 400 lines
- No emojis under any circumstances
- Use minimal, structured, and type-first design
- Keep components pure and modular
- Pages handle layout, not logic
- API access goes through `api-utils`
- PRs must be clear, linked, and reviewed

Stick to the rules. Keep it clean.

