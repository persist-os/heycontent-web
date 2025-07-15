# Partnership Hub - Product Requirements Document

## Executive Summary

We're building a Partnership Hub that migrates Gmail business communication functionality from the content hub into a dedicated partnership workflow. This leverages our existing InlineCommandPalette and MarkdownNotepad system for AI-powered email drafting, with full persona and context integration.

## Current System Capabilities

### Existing Infrastructure
- **Gmail Integration**: OAuth-based, filtered via Gemini LLM, stored in Convex DB
- **Smart Notes**: InlineCommandPalette with Ask AI, Request Analysis, Generate Ideas
- **MarkdownNotepad**: Chat sidebar with RichTextEditor and full AI integration
- **Email Detail Views**: Existing Gmail thread display functionality
- **Persona System**: Backend already injects persona context into AI prompts
- **AI Context**: System can feed thread context, personas, and other relevant data to prompts

### What Needs Building
- Partnership Hub UI (3-column layout from original design)
- Email-specific version of InlineCommandPalette
- Smart note auto-save for email drafts (new email note type)
- Gmail reply sending (future - not this PR)

## Product Requirements

### 1. Partnership Hub Layout

#### Header Section
- **Title**: "Partnership Hub"
- **Persona Indicator**: Show active persona context
- **Search**: Filter by brand, type, or status
- **Sync Gmail**: Refresh partnership data using existing Gmail pipeline

#### Metrics Cards
- **AI Opportunities**: Count from existing batch analysis endpoints
- **Active Partnerships**: Count of ongoing threads
- **Pending Responses**: Threads requiring replies
- **Pipeline Value**: Estimated revenue (extracted from smart notes metadata)

#### Three-Column Layout
1. **AI-Detected Opportunities** (Left Column)
   - Display results from existing Gmail batch analysis
   - Show confidence scores from Gemini classification
   - Actions: "Create Note", "Draft Reply", "Mark as Partnership"

2. **Active Partnerships** (Center Column)
   - Email threads with partnership labels/status
   - Status: opportunity → inquiry → negotiating → active → completed
   - Progress indicators based on thread activity and manual updates

3. **Partnership Detail Panel** (Right Column)
   - Selected partnership's email thread view (reuse existing email detail)
   - Associated smart notes display
   - **"Draft Reply" button** → opens MarkdownNotepad for email drafting

### 2. Smart Notes Integration

#### Email-Specific MarkdownNotepad
- **Reuse existing MarkdownNotepad component** from chat
- **Email context pre-loaded**: Thread history, brand details, persona guidelines
- **Auto-title generation**: "Email Draft: [Brand] - [Subject]"
- **Auto-tags**: #email-draft, #partnership, #[brand-name], #[persona-name]

#### Enhanced InlineCommandPalette for Email
- **Keep existing actions**: Ask AI, Request Analysis, Generate Ideas
- **Add email-specific actions**:
  - "Suggest Follow-up" - AI generates follow-up email suggestions
  - "Summarize Thread" - Create thread summary for context
  - "Check Brand Alignment" - Analyze if opportunity matches persona
  - "Generate Response" - AI drafts reply with full context

#### Context Injection
- **Thread Context**: Full email thread or latest N messages
- **Persona Context**: Active persona rules, communication style, rates
- **Partnership Context**: Brand details, previous interactions, current status
- **Smart Notes Context**: Related partnership notes and insights

### 3. Data Models

#### Partnership Enhancement
```
Partnership {
  id: string
  emailThreadId: string
  brandName: string
  status: "opportunity" | "inquiry" | "negotiating" | "active" | "completed"
  aiConfidence: number
  estimatedValue: number
  lastActivity: timestamp
  smartNoteIds: string[] // linked notes including drafts
  personaId: string
}
```

#### Email Note Type
```
Smart Note (email type) {
  content: string
  title: string // "Email Draft: [Brand] - [Subject]"
  tags: string[] // #email-draft, #partnership, #brand, #persona
  note_type: "email_draft"
  partnershipId: string // link to partnership
  threadId: string // link to Gmail thread
  isDraft: boolean
  sentAt: timestamp | null
}
```

### 4. Backend Integration

#### New API Endpoints
```
GET /partnerships - List partnerships (extend existing Gmail filtering)
GET /partnerships/{id} - Get partnership details with linked notes
POST /partnerships/{id}/draft - Create email draft note with context
PUT /partnerships/{id}/status - Update partnership status
GET /partnerships/opportunities - Get AI-detected opportunities (existing batch analysis)
```

#### AI Context Enhancement
- **Extend existing prompt system** to include email/partnership context
- **Reuse persona injection** already built into backend
- **Add email-specific prompts** in `/prompts/email_drafting/` directory

### 5. User Experience Flow

#### Discovering Partnerships
1. User opens Partnership Hub
2. AI-detected opportunities loaded from existing batch analysis
3. User clicks opportunity → creates partnership record + smart note
4. Partnership moves to "Active Partnerships" column

#### Drafting Email Replies
1. User selects partnership from active list
2. Email thread displays in detail panel
3. User clicks "Draft Reply"
4. MarkdownNotepad opens with:
   - Email thread context pre-loaded
   - Persona guidelines included
   - InlineCommandPalette available for AI assistance
5. Draft auto-saves as smart note with email_draft type
6. **Future**: Send button will send via Gmail API

#### Managing Partnership Status
1. User manually updates status via dropdown/buttons
2. Status progression: opportunity → inquiry → negotiating → active → completed
3. Smart notes automatically tagged with current status

### 6. Technical Implementation

#### Frontend Changes
- **New route**: `/partnerships` with 3-column layout
- **Reuse MarkdownNotepad**: Adapt for email drafting context
- **Extend InlineCommandPalette**: Add email-specific actions
- **Partnership components**: List items, detail panel, status controls

#### Backend Changes
- **Partnership endpoints**: Extend existing Gmail/notes APIs
- **Email prompts**: Create email-specific prompt directory
- **Context injection**: Enhance existing persona system for email context
- **Note type**: Add "email_draft" to existing note type classifications

### 7. Phase 1 Scope (This PR)

#### Core Partnership Hub
- ✅ 3-column partnership layout
- ✅ AI opportunity display (existing data)
- ✅ Partnership status tracking
- ✅ Email thread detail view (reuse existing)

#### Smart Notes Integration
- ✅ MarkdownNotepad for email drafting
- ✅ Email-enhanced InlineCommandPalette
- ✅ Auto-save drafts as smart notes
- ✅ Full context injection (thread + persona + partnership)

#### Not in Scope (Future)
- ❌ Gmail reply sending (needs new API)
- ❌ Advanced partnership analytics
- ❌ Brand discovery engine
- ❌ Automated status updates from email activity

### 8. Success Metrics

#### User Efficiency
- 80% of partnership emails use AI-assisted drafting
- 60% reduction in time to organize partnership communications
- 90% of partnership opportunities properly categorized
- All partnership context captured in smart notes

#### System Integration
- Seamless reuse of existing MarkdownNotepad and InlineCommandPalette
- Full persona context integration with email drafting
- All partnership data linked to smart notes system
- Consistent UI/UX with existing dashboard patterns

### 9. Coming Soon Features (Teasers)

#### Advanced Email Features
- **Send Functionality**: Direct Gmail sending from drafts
- **Email Templates**: Persona-specific email templates
- **Auto-Follow-up**: AI-scheduled follow-up reminders
- **Thread Analysis**: Deep AI analysis of email conversations

#### Partnership Intelligence
- **Brand Discovery**: AI-suggested brands matching persona
- **Performance Analytics**: Partnership ROI and success tracking
- **Smart Automation**: Auto-categorization and status updates
- **Calendar Integration**: Meeting scheduling and deadline tracking

## Technical Notes

This implementation maximizes reuse of existing systems:
- **MarkdownNotepad** → email drafting interface
- **InlineCommandPalette** → AI assistance for emails
- **Smart Notes** → draft storage and organization
- **Gmail Pipeline** → partnership opportunity detection
- **Persona System** → context injection for AI

The result is a comprehensive partnership management system built primarily by reconfiguring existing components with minimal new development.