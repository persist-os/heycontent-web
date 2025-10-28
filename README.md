# HeyContext

An AI-powered memory and intelligence platform that creates persistent, evolving AI understanding of users through sophisticated content processing and psychological insight generation.

## Project Overview

HeyContext solves the fundamental problem of AI assistants that don't remember or understand users across conversations. Unlike ChatGPT or Claude which offer static memory, HeyContext builds **dynamic, evolving AI understanding** that grows with every interaction.

### Core Functionality

- **Thinking Lab**: Primary AI interface with persistent memory and context-aware conversations
- **Crystal Intelligence**: Sophisticated psychological insight extraction and evolution system
- **Living Projects**: Dynamic projects that evolve and develop AI-powered widgets
- **Smart Notes**: AI-enhanced note-taking with cross-content linking
- **Cosmic Intelligence**: Stars and crystals that evolve from user interactions

## Technical Architecture

### Frontend
- **Framework**: Next.js 15 with App Router
- **UI Components**: React 18 with TypeScript, Radix UI primitives
- **Styling**: Tailwind CSS with shadcn/ui design system
- **Theming**: next-themes with semantic color tokens for light/dark mode
- **Authentication**: Firebase Authentication with API key management
- **State Management**: Zustand for client-side state
- **Rich Text**: TipTap editor with markdown support

### Backend Integration
- **Database**: Convex (serverless backend with real-time sync)
- **AI Processing**: FastAPI backend with Google Gemini via Vertex AI
- **Background Jobs**: Redis-backed job queue for async AI processing
- **Vector Search**: Semantic content retrieval and matching
- **Streaming**: Real-time AI response streaming

## Project Structure

```
heycontent-web/
├── src/app/                    # Next.js app directory (App Router)
│   ├── dashboard/              # Main application dashboard
│   │   ├── thinking_lab/       # Primary AI interface with persistent memory
│   │   ├── living-projects/    # Dynamic projects with AI widgets
│   │   ├── notes/              # AI-enhanced note-taking system
│   │   ├── crystals/           # Psychological insight visualization
│   │   ├── briefing_room/       # Living intelligence command center
│   │   └── _components/        # Dashboard-specific components
│   ├── api/                    # Next.js API routes (backend integration)
│   │   ├── chat/               # Chat and streaming endpoints
│   │   ├── lab/                # Thinking lab API
│   │   ├── projects/           # Project processing endpoints
│   │   └── ambient_insights/   # Background AI processing
│   ├── auth/                   # Authentication pages
│   ├── lib/                    # Utility functions and helpers
│   └── types/                  # TypeScript type definitions
├── convex/                     # Convex database functions and schema
│   ├── schema.ts               # Comprehensive database schema (50+ tables)
│   ├── auth.ts                 # Authentication utilities
│   ├── chat.ts                 # Chat functionality and mutations
│   ├── crystals.ts             # Crystal intelligence system
│   ├── projects.ts             # Living projects and widgets
│   ├── notes.ts                # Smart notes system
│   └── types/                  # Type definitions for all entities
├── src/components/             # Reusable UI components
├── public/                     # Static assets
└── src/                        # Additional source files
```

## Database Schema

The Convex database includes comprehensive tables for:

### Core User Data
- **Users**: User profiles, authentication, and preferences
- **Conversations & Messages**: Chat history with individual message tracking
- **Notes**: Smart notes with AI enhancement and cross-linking
- **Projects**: Living projects with fingerprinting and evolution

### AI Intelligence System
- **Crystals & Crystal Shards**: Psychological insights and their components
- **Stardust**: Project potential detection and evolution
- **Cognitive Fields**: Advanced AI understanding containers
- **Content Embeddings**: Vector search for semantic content retrieval
- **Intelligence Jobs**: Background AI processing queue

### Advanced Features
- **Widgets & Widget Outputs**: AI-generated project tools and deliverables
- **Briefing Events**: Autonomous AI briefing system
- **Context Enrichment**: Multi-armed bandit learning for context strategies
- **Formation Runs**: Crystal formation tracking and optimization
- **Usage Events**: Comprehensive usage analytics and monitoring

## Authentication Flow

1. The application uses Firebase Authentication for user management
2. Authentication tokens are stored as cookies and used in the Authorization header
3. Server-side authentication verification using Firebase Admin SDK
4. API keys are generated with the backend and stored in localStorage
5. Integration with Convex for user data management

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Firebase project with Authentication enabled
- Convex account and project
- Backend API access (backend.hicontent.co)

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd heycontent-web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment configuration**
   Create a `.env.local` file with:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
   NEXT_PUBLIC_CONVEX_URL=your_convex_url
   NEXT_PUBLIC_BACKEND_URL=your_backend_url
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Open [http://localhost:3000](http://localhost:3000) in your browser
   - Sign up for an account to start building your AI memory

## API Integration

The application integrates with multiple systems:

1. **Convex Database**: Direct integration for real-time data storage and retrieval
2. **Backend AI Processing**: FastAPI backend for sophisticated AI analysis and processing
3. **Firebase Authentication**: User authentication and session management
4. **Vector Search**: Semantic content retrieval and matching
5. **Background Processing**: Redis-backed job queue for async AI operations

### API Endpoints

- `/api/chat/message` - Main chat interface with streaming responses
- `/api/lab/message` - Thinking lab with enhanced context processing
- `/api/projects/[projectId]/process-message` - Project-specific processing
- `/api/ambient_insights` - Background AI insight generation

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run Jest tests

## Design System & Theming

HeyContext follows a comprehensive theming approach:

### Color Scheme
- **Light Mode**: Clean white background (#FFFFFF)
- **Dark Mode**: Deep charcoal background (#202020)
- **Primary Accent**: HeyContext Yellow (#FFDF39)
- **Secondary Colors**: Purple (#9046FF), Green (#45E290)

### Theme Implementation
- Uses `next-themes` for seamless light/dark/system mode switching
- All colors defined as CSS variables in `globals.css`
- Components use semantic tokens (`bg-background`, `text-foreground`, etc.)
- No hardcoded color values in component code
- Proper accessibility support with ARIA labels and focus states

## Key Differentiators

### 1. **Evolving AI Memory**
Unlike static AI assistants, HeyContext builds understanding that grows and connects insights across time.

### 2. **Psychological Intelligence**
The crystal system extracts deep psychological insights from user interactions, creating a unique personality profile.

### 3. **Living Projects**
Projects that evolve and develop AI-powered tools based on user behavior and preferences.

### 4. **Privacy-First Architecture**
User data stays private with secure processing and no external model training.

### 5. **Sophisticated Content Processing**
Multi-stage AI pipeline with intelligent batching, clustering, and evolution tracking.

## Target Users

HeyContext is designed for knowledge workers, researchers, writers, developers, designers, entrepreneurs, and students who:
- Work with ideas that build over time
- Are tired of re-explaining context to AI assistants
- Want AI that truly understands their work and thinking patterns
- Need tools that remember and connect insights across conversations

## Key Features

### 🧠 Thinking Lab
The primary AI interface where users interact with AI that has persistent memory:
- **Context-Aware Conversations**: AI remembers previous conversations and connects insights
- **Progressive Thinking**: Multi-step AI reasoning with real-time status updates
- **File Attachments**: Support for document and image processing
- **Notepad Integration**: Seamless integration with note-taking system
- **Project Context**: Conversations can be linked to specific projects

### 🔮 Crystal Intelligence System
Sophisticated AI system that extracts and evolves psychological insights:
- **Content Processing**: Intelligent batching and analysis of user interactions
- **Shard Extraction**: AI analyzes content for psychological insights
- **Crystal Formation**: ML clustering + LLM synthesis creates coherent personality patterns
- **Intelligent Evolution**: System updates existing crystals instead of creating duplicates
- **Vector Matching**: Semantic similarity prevents insight duplication

### 🌌 Living Projects
Dynamic projects that evolve and develop AI-powered tools:
- **Project Fingerprinting**: AI discovers project characteristics through conversation
- **Constellation View**: Visual mapping of project relationships and connections
- **AI-Generated Widgets**: Personalized tools and insights for each project
- **Evolution Tracking**: Projects learn and adapt based on user interactions

### 📝 Smart Notes
Advanced note-taking system with AI integration:
- **Rich Text Editor**: TipTap-based editor with markdown support
- **AI Assistance**: Inline AI help for writing and refinement
- **Content Linking**: Cross-reference notes, conversations, and projects
- **Folder Organization**: Hierarchical organization with AI-powered suggestions
- **Project Integration**: Notes can be linked to living projects

### 🌟 Cosmic Intelligence
Visualization and management of AI-generated insights:
- **Crystal Dashboard**: View and manage psychological insights
- **Formation Status**: Track crystal formation progress and eligibility
- **System Debugging**: Comprehensive debugging tools for AI processing
- **Deletion Tools**: Safe cleanup of unwanted insights
