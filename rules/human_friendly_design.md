# Human-Friendly Design Rules

This document defines how to create interfaces and interactions that work for everyone, regardless of technical background or life situation. HeyContext is designed for the construction worker, the stay-at-home parent, the teenager, and everyone in between.

---

## Core Philosophy

### Universal Accessibility

HeyContext should feel natural to use for:
- A 50-year-old construction worker figuring out a career change
- A stay-at-home parent processing a difficult family situation  
- A teenager working through college decisions
- A retiree exploring new interests
- Anyone who needs space to think, regardless of their technical comfort level

### Language Principles

#### Use Plain Language

**Do:**
- "Help me think through this"
- "What should I focus on?"
- "I'm trying to figure something out"
- "How do I organize these thoughts?"

**Don't:**
- "Optimize your cognitive workflow"
- "Leverage strategic insights"
- "Maximize productivity metrics"
- "Implement best practices"

#### Avoid Technical Jargon

**Do:**
- "Save your thoughts"
- "Look back at our conversations"
- "Find what you're looking for"
- "Organize your ideas"

**Don't:**
- "Persist data to database"
- "Execute search query"
- "Implement caching strategy"
- "Configure user preferences"

#### Speak Like a Helpful Friend

**Do:**
- "I remember we talked about this before"
- "What's on your mind today?"
- "Take your time figuring this out"
- "However you want to approach this is fine"

**Don't:**
- "Accessing previous session data"
- "Please provide input for processing"
- "Select your preferred optimization"
- "Choose your workflow configuration"

---

## Interface Design Guidelines

### Visual Hierarchy

#### Clear, Not Clever
- Use obvious icons and labels
- Avoid abstract symbols that require explanation
- Make clickable elements obviously clickable
- Use familiar patterns (like notebooks, folders, conversations)

#### Comfortable Spacing
- Give elements room to breathe
- Use touch-friendly sizes on mobile
- Don't cram information together
- Allow for easy scanning and understanding

### Error Handling

#### Gentle Error Messages

**Do:**
- "Something went wrong. Let's try that again."
- "I couldn't save that right now. Your work is safe - just try again in a moment."
- "I'm having trouble understanding. Can you try rephrasing that?"

**Don't:**
- "Error 500: Internal server exception"
- "Authentication token expired"
- "Database connection timeout"
- "Invalid input parameters"

#### Recovery-Focused
- Always explain what happened in human terms
- Offer clear next steps
- Reassure that their work is safe
- Provide simple ways to fix the issue

### Loading and Feedback

#### Use Encouraging Messages
Instead of generic "Loading..." use messages like:
- "Organizing your thoughts"
- "Finding connections between ideas"
- "Helping you think this through"
- "Processing your insights"

#### Show Progress Meaningfully
- Use descriptive progress indicators
- Explain what's happening in human terms
- Avoid technical progress descriptions
- Keep users informed without overwhelming them

---

## Content Strategy

### Writing Tone

#### Supportive, Not Pushy
**Do:**
- "Whenever you're ready"
- "However this feels right to you"
- "Take as much time as you need"
- "There's no wrong way to use this"

**Don't:**
- "You should optimize this"
- "Best practice is to..."
- "You need to improve..."
- "The correct approach is..."

#### Personal, Not Professional
**Do:**
- "Your thoughts and ideas"
- "What matters to you"
- "How you like to work"
- "Your own way of thinking"

**Don't:**
- "Your content strategy"
- "Your professional brand"
- "Your optimization metrics"
- "Your performance indicators"

### Help Content

#### Contextual, Not Overwhelming
- Provide help exactly when and where it's needed
- Use examples that relate to real-life situations
- Avoid long documentation or complex tutorials
- Show, don't just tell

#### Assume Nothing
- Don't assume technical knowledge
- Don't assume familiarity with similar tools
- Don't assume specific use cases
- Don't assume comfort with AI or technology

---

## Interaction Patterns

### Onboarding

#### Gentle Introduction
- Start with simple, obvious actions
- Let users explore at their own pace
- Provide examples that feel relatable
- Avoid overwhelming feature tours

#### Build Confidence Gradually
- Start with basic functionality
- Celebrate small successes
- Introduce advanced features only when relevant
- Let users discover capabilities naturally

### AI Interactions

#### Make AI Feel Approachable

**Do:**
- "I'm here to help you think through this"
- "Let me understand what you're working on"
- "What would be most helpful right now?"
- "I remember what we discussed before"

**Don't:**
- "Please provide your query parameters"
- "Initiating analysis protocol"
- "Processing your request"
- "Executing optimization routine"

#### Maintain Human Agency
- Always let users edit AI suggestions
- Present options rather than dictating solutions
- Respect user preferences and patterns
- Support their natural thinking process

### Navigation

#### Obvious Pathways
- Use clear, descriptive labels
- Provide breadcrumbs for complex flows
- Make it easy to get back to safety
- Avoid hidden or non-obvious navigation

#### Forgiving Design
- Make it hard to lose work accidentally
- Provide undo options where possible
- Confirm destructive actions
- Save work automatically and frequently

---

## Testing Guidelines

### Real User Testing

#### Test with Diverse Users
- Include people with different technical comfort levels
- Test with different age groups
- Include people with different educational backgrounds
- Test with people who have never used similar tools

#### Focus on Comprehension
- Can users understand what each button does?
- Do they know what will happen when they click something?
- Can they recover from mistakes easily?
- Do error messages actually help them?

### Accessibility Standards

#### Beyond WCAG Compliance
- Test with actual screen readers
- Verify keyboard-only navigation works smoothly
- Ensure color isn't the only way to convey information
- Test with users who have different cognitive needs

#### Cognitive Accessibility
- Use simple, clear language throughout
- Provide consistent interaction patterns
- Avoid overwhelming users with too many options
- Support different learning and processing styles

---

## Implementation Checklist

### Before Shipping Any Feature

#### Language Review
- [ ] All text uses plain, accessible language
- [ ] No technical jargon or business buzzwords
- [ ] Tone is supportive and encouraging
- [ ] Instructions are clear and specific

#### Interaction Review
- [ ] User can easily understand what each element does
- [ ] Error states provide helpful, human-friendly guidance
- [ ] Loading states use encouraging, descriptive messages
- [ ] Success states celebrate user accomplishments

#### Accessibility Review
- [ ] Works with keyboard navigation only
- [ ] Screen reader friendly with proper ARIA labels
- [ ] Color contrast meets accessibility standards
- [ ] Works for users with different cognitive needs

#### Real-World Testing
- [ ] Tested with someone unfamiliar with the feature
- [ ] Tested with someone less comfortable with technology
- [ ] Verified that instructions actually make sense
- [ ] Confirmed that error recovery is straightforward

---

## Success Metrics

### How We Know We're Succeeding

#### User Behavior Indicators
- Users return regularly without prompting
- Users explore features naturally without extensive help
- Users successfully recover from errors without support
- Users express comfort and confidence using the system

#### Language Effectiveness
- Support requests don't ask "what does this mean?"
- Users don't get stuck on confusing interface language
- Error messages actually help users fix problems
- Users can explain features to others in their own words

#### Accessibility Impact
- Users with different abilities can accomplish their goals
- Users with different technical backgrounds feel comfortable
- Users don't abandon tasks due to confusion or frustration
- Users feel the system adapts to them, not vice versa

---

## Remember

HeyContext succeeds when it feels like a natural extension of how people already think and work. The best interface is one that disappears, leaving users free to focus on what matters to them: organizing their thoughts, making decisions, and understanding themselves better.

Every design decision should pass the "construction worker test" - would someone who works with their hands all day be able to use this comfortably when they get home and want to think through a career change? If not, we need to make it simpler and more human.
