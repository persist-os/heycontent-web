# Blog System Documentation

## Core Purpose

The HeyContext blog is a technical blog focused on **code, UX, and design**. It serves as a platform to share deep technical insights about building autonomous work systems, with a particular emphasis on:

- **Code**: Architecture, implementation details, technical decisions
- **UX**: User experience patterns, interaction design, usability insights
- **Design**: Visual design, design systems, aesthetic decisions

The blog supports both **series** (multi-part articles) and **standalone articles**, allowing for both comprehensive deep-dives and focused single-topic posts.

---

## Structure Overview

### Series vs Standalone Articles

**Series Articles:**
- Multi-part articles grouped together (e.g., "Inside HeyContext: Building the Autonomous Work OS")
- Displayed as clickable cards on the main blog page
- Clicking a series card opens a dedicated series page with a table of contents
- Each article in a series has a part number badge
- Articles are automatically sorted by their `order` field

**Standalone Articles:**
- Single articles not part of any series
- Displayed in a separate "Standalone Articles" section on the main blog page
- No part numbers or series badges

### Page Structure

```
/blog                    → Main blog listing page
/blog/[slug]            → Individual article page
/blog/series/[slug]     → Series table of contents page
```

---

## How to Add a New Article

### Step 1: Add Article Data

Edit `/src/app/blog/page.tsx` and add your article to the `blogPosts` array:

```typescript
{
  slug: 'your-article-slug',
  title: 'Your Article Title',
  description: 'A brief description that appears in listings',
  category: 'code' | 'ux' | 'design',  // Choose one
  readTime: '10 min',
  date: '2025-01-20',  // YYYY-MM-DD format
  series: 'Your Series Name',  // Optional - omit for standalone articles
  order: 1  // Required if part of a series, omit for standalone
}
```

**Important Notes:**
- `slug` must be URL-friendly (lowercase, hyphens, no spaces)
- `category` determines the badge color and icon
- `series` is optional - omit for standalone articles
- `order` is required only for series articles (1, 2, 3, etc.)

### Step 2: Add Article Content

Edit `/src/app/blog/[slug]/page.tsx` and add your article content to the `blogPosts` Record:

```typescript
'your-article-slug': {
  title: 'Your Article Title',
  description: 'A brief description',
  category: 'code',
  readTime: '10 min',
  date: '2025-01-20',
  series: 'Your Series Name',  // Optional
  order: 1,  // Optional
  content: `
# Your Article Title

Your markdown content here. Use standard markdown syntax:

- Lists
- **Bold text**
- *Italic text*
- \`code blocks\`
- [Links](https://example.com)

## Code Examples

\`\`\`python
def example():
    return "Hello, World!"
\`\`\`

## Sections

You can organize your content with headings, lists, code blocks, and more.
  `
}
```

**Markdown Support:**
- Full markdown syntax supported
- Code blocks with syntax highlighting
- Links, lists, headings, blockquotes
- Tables (via remark-gfm)

### Step 3: Update Series Page (If Part of Series)

If your article is part of a series, also add it to `/src/app/blog/series/[seriesSlug]/page.tsx`:

1. Add to the `blogPosts` array (same structure as main blog page)
2. The series page automatically groups articles by series name
3. Ensure the `series` name matches exactly across all files

---

## How to Create a New Series

### Step 1: Plan Your Series

Decide on:
- Series name (e.g., "Inside HeyContext: Building the Autonomous Work OS")
- Number of articles
- Order/topics for each article

### Step 2: Add Series Articles

Add all articles in the series following the steps above. Key requirements:

1. **Same `series` name** for all articles in the series
2. **Sequential `order`** numbers (1, 2, 3, etc.)
3. **Consistent category** (all articles should be the same category, or document why they differ)

### Step 3: Series Slug Generation

Series slugs are automatically generated from the series name:
- Converted to lowercase
- Special characters replaced with hyphens
- Example: `"Inside HeyContext: Building the Autonomous Work OS"` → `"inside-heycontext-building-the-autonomous-work-os"`

If you need to manually set a slug, update the `getSeriesNameFromSlug` function in `/src/app/blog/series/[seriesSlug]/page.tsx`.

---

## Category System

### Available Categories

1. **`code`** (Blue)
   - Technical implementation
   - Architecture decisions
   - Code examples and patterns
   - System design

2. **`ux`** (Purple)
   - User experience patterns
   - Interaction design
   - Usability insights
   - User research findings

3. **`design`** (Orange)
   - Visual design
   - Design systems
   - Aesthetic decisions
   - Brand guidelines

### Adding a New Category

1. Update `categoryConfig` in `/src/app/blog/page.tsx`:
```typescript
const categoryConfig = {
  // ... existing categories
  yourNewCategory: {
    icon: YourIcon,  // Import from lucide-react
    label: 'Your Label',
    color: 'from-color-500/20 to-color-500/20 dark:from-color-500/10 dark:to-color-500/10',
    borderColor: 'border-color-500/30 dark:border-color-500/20',
    textColor: 'text-color-600 dark:text-color-400'
  }
}
```

2. Update the TypeScript type:
```typescript
category: 'code' | 'ux' | 'design' | 'yourNewCategory'
```

3. Update all three blog files:
   - `/src/app/blog/page.tsx`
   - `/src/app/blog/[slug]/page.tsx`
   - `/src/app/blog/series/[seriesSlug]/page.tsx`

---

## File Structure

```
src/app/blog/
├── page.tsx                    # Main blog listing page
├── [slug]/
│   └── page.tsx               # Individual article page
├── series/
│   └── [seriesSlug]/
│       └── page.tsx           # Series table of contents page
└── README.md                  # This file

src/components/ui/
└── blog-section.tsx           # Blog section component for homepage
```

---

## Data Synchronization

**CRITICAL**: Article data must be synchronized across three files:

1. `/src/app/blog/page.tsx` - `blogPosts` array
2. `/src/app/blog/[slug]/page.tsx` - `blogPosts` Record
3. `/src/app/blog/series/[seriesSlug]/page.tsx` - `blogPosts` array

**Best Practice**: When adding a new article, update all three files in the same commit to avoid inconsistencies.

---

## Content Guidelines

### Article Length
- **Short**: 5-8 min read (focused, single topic)
- **Medium**: 10-15 min read (comprehensive, multiple sections)
- **Long**: 15+ min read (deep dive, extensive coverage)

### Writing Style
- **Technical but accessible**: Assume readers are technical but may not know our specific system
- **Code examples**: Include real code examples where relevant
- **Diagrams**: Use Mermaid diagrams for complex flows (supported via remark-gfm)
- **Links**: Link to related articles, documentation, or external resources

### Series Planning
- **Start with overview**: First article should set context
- **Progressive depth**: Each article builds on previous ones
- **Logical flow**: Order articles by dependency/complexity
- **Consistent tone**: Maintain same writing style across series

---

## Design & UX Articles

### Planning for Design Articles

The blog system is designed to support design and UX articles alongside code articles:

1. **Category System**: Use `design` or `ux` categories
2. **Visual Content**: Markdown supports images - use them liberally for design articles
3. **Code Examples**: Even design articles can include CSS/design system code examples

### Example Design Article Structure

```markdown
# Designing the HeyContext UI System

## Overview
[Introduction to design decisions]

## Color Palette
[Color system explanation]

## Typography
[Type scale and usage]

## Component Patterns
[Design system components]

\`\`\`css
/* Example CSS */
.component {
  /* Design system code */
}
\`\`\`

## User Experience Considerations
[UX insights and patterns]
```

### Example UX Article Structure

```markdown
# Building Intuitive Workflows

## User Research
[Research findings]

## Interaction Patterns
[UX patterns used]

## Usability Testing
[Testing results and insights]

## Implementation
[How we implemented UX improvements]
```

---

## Best Practices

### Article Metadata
- **Slug**: Use descriptive, URL-friendly slugs (`why-autonomous-work` not `article1`)
- **Title**: Clear, descriptive titles that explain the topic
- **Description**: 1-2 sentences that summarize the article
- **Read Time**: Estimate based on word count (average reading speed: 200-250 words/min)

### Series Organization
- **Naming**: Use consistent series naming conventions
- **Ordering**: Number articles logically (1, 2, 3...)
- **Cross-references**: Link between series articles using markdown links

### Content Updates
- **Versioning**: Consider adding version dates for major updates
- **Deprecation**: Mark outdated articles or add update notes
- **Consistency**: Keep article structure consistent within a series

---

## Future Enhancements

### Planned Features
- [ ] RSS feed generation
- [ ] Article search functionality
- [ ] Tag system for cross-category organization
- [ ] Author attribution
- [ ] Publication status (draft/published)
- [ ] Article analytics
- [ ] Related articles suggestions
- [ ] Social sharing buttons

### Content Ideas

**Code Articles:**
- Architecture deep-dives
- Performance optimization
- Security implementations
- API design decisions
- Database schema evolution

**UX Articles:**
- User research findings
- Interaction pattern libraries
- Usability testing results
- Workflow improvements
- Accessibility considerations

**Design Articles:**
- Design system evolution
- Visual identity decisions
- Component design process
- Brand guidelines
- Design tooling and workflows

---

## Troubleshooting

### Article Not Showing
- Check that article is added to all three files (page.tsx, [slug]/page.tsx, series/[seriesSlug]/page.tsx)
- Verify slug matches exactly across all files
- Check for TypeScript errors in console

### Series Not Grouping
- Ensure `series` name matches exactly (case-sensitive)
- Verify `order` numbers are sequential
- Check that series slug generation matches series name

### Markdown Not Rendering
- Verify markdown syntax is correct
- Check for unclosed code blocks or lists
- Ensure ReactMarkdown components are properly configured

### Category Not Displaying
- Verify category is in `categoryConfig`
- Check TypeScript type includes your category
- Ensure category value matches exactly (lowercase)

---

## Quick Reference

### Adding a Standalone Article
1. Add to `blogPosts` array in `/src/app/blog/page.tsx`
2. Add to `blogPosts` Record in `/src/app/blog/[slug]/page.tsx`
3. Add content markdown to the Record entry

### Adding a Series Article
1. Add to `blogPosts` array in `/src/app/blog/page.tsx`
2. Add to `blogPosts` Record in `/src/app/blog/[slug]/page.tsx`
3. Add to `blogPosts` array in `/src/app/blog/series/[seriesSlug]/page.tsx`
4. Add content markdown to the Record entry
5. Ensure `series` name and `order` are set correctly

### Creating a New Series
1. Plan series structure and articles
2. Add all articles following "Adding a Series Article" steps
3. Use consistent `series` name across all articles
4. Number articles sequentially with `order` field

---

## Questions?

For questions or issues with the blog system, refer to this documentation or check the code comments in the blog page files.




