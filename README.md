# HeyContent

A comprehensive AI-powered content creation and management platform that provides intelligent insights, social media integration, and content analysis tools.

## Project Overview

HeyContent is a web application designed to assist creators and content managers by providing AI-powered analytics, insights, and management tools. It integrates with various social platforms (Gmail, YouTube, Instagram) and offers chat-based interaction with AI assistants.

### Core Functionality

- **AI Chat Assistance**: Interactive chat interface with AI for content creation support
- **Social Platform Integration**: Connect and manage Gmail, YouTube, and Instagram accounts
- **Content Analytics**: Performance metrics and insights for your content
- **Notes & Organization**: Create, manage, and organize content ideas and strategies
- **AI Insights**: Automated analysis and suggestions for content improvement

## Technical Architecture

### Frontend
- **Framework**: Next.js 15 with App Router
- **UI Components**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Theming**: next-themes with CSS variables for light/dark mode support
- **Design System**: Semantic color tokens with HeyContent Yellow (#FFDF39) as primary accent
- **Authentication**: Firebase Authentication

### Backend
- **Database**: Convex (serverless backend with real-time sync)
- **External API**: Integration with backend.hicontent.co for advanced processing
- **Authentication**: Firebase for user authentication and session management

## Project Structure (Note: May be out of date)

```
heycontent-web/
├── app/                        # Next.js app directory (App Router)
│   ├── (auth)/                 # Authentication routes and components
│   ├── (dashboard)/            # Main application dashboard
│   │   ├── _components/        # Dashboard-specific components
│   │   ├── ai-insights/        # AI analysis and insights
│   │   ├── audience/           # Audience analytics
│   │   ├── chat/               # AI chat interface
│   │   ├── content/            # Content management
│   │   ├── notes/              # Notes and ideas
│   │   └── settings/           # User settings
│   ├── api/                    # API routes
│   │   ├── auth/               # Authentication endpoints
│   │   ├── chat/               # Chat functionality
│   │   ├── social/             # Social platform connectors
│   │   └── notes/              # Notes management
│   ├── lib/                    # Utility functions and helpers
│   └── types/                  # TypeScript type definitions
├── convex/                     # Convex database functions and schema
│   ├── schema.ts               # Database schema definition
│   ├── auth.ts                 # Authentication utilities
│   ├── chat.ts                 # Chat functionality
│   ├── gmailMutations.ts       # Gmail integration - mutations
│   ├── gmailQueries.ts         # Gmail integration - queries
│   ├── youtubeMutations.ts     # YouTube integration - mutations
│   ├── youtubeQueries.ts       # YouTube integration - queries
│   └── instagramMutations.ts   # Instagram integration - mutations
├── public/                     # Static assets
└── src/                        # Additional source files
```

## Database Schema

The Convex database includes tables for:
- **Users**: User profiles and authentication data
- **Personas**: User-created content personas with descriptions and aspirations
- **Chat**: Conversations between users and AI
- **Notes**: User notes and content ideas
- **Social Integration**: Tables for Gmail, YouTube, and Instagram data
- **API Keys**: Management of API access
- **Rate Limiting**: Controls for API usage

## Authentication Flow

1. The application uses Firebase Authentication for user management
2. Authentication tokens are stored as cookies and used in the Authorization header
3. Server-side authentication verification using Firebase Admin SDK
4. API keys are generated with the backend and stored in localStorage
5. Integration with Convex for user data management

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Firebase project
- Convex account
- Google Cloud Platform account (for Gmail and YouTube APIs)

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
   Set up environment variables. 

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Open [http://localhost:3000](http://localhost:3000) in your browser

## API Integration

The application interacts with:
1. **Convex Database**: Direct integration for data storage and retrieval
2. **External Backend**: API calls to backend.hicontent.co for specialized processing
3. **Social Platforms**: Integration with Gmail, YouTube, and Instagram APIs

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `node .next/standalone/server.js` - Start standalone server

## Changelog

- Removed deprecated `src/app/dashboard/chat/components/ProjectDiscoveryChat.tsx` in favor of the new modular `project-discovery` architecture.

## Design System & Theming

HeyContent follows a strict theming approach using semantic CSS variables:

### Color Scheme
- **Light Mode**: Clean white background (#FFFFFF)
- **Dark Mode**: Deep charcoal background (#202020) - never navy blue
- **Primary Accent**: HeyContent Yellow (#FFDF39)
- **Secondary Colors**: Purple (#9046FF), Green (#45E290)

### Theme Implementation
- Uses `next-themes` for seamless light/dark/system mode switching
- All colors defined as CSS variables in `globals.css`
- Components use semantic tokens (`bg-background`, `text-foreground`, etc.)
- No hardcoded color values in component code
- Proper accessibility support with ARIA labels and focus states

### Theme Toggle
Located in navigation areas, supports:
- Light mode (sun icon)
- Dark mode (moon icon)  
- System preference (monitor icon)
- Automatic hydration handling to prevent flash

## Features

### Smart Notes with Enhanced Content Linking

Smart Notes now support linking to content across multiple platforms using a unified prefixed ID system:

#### Content Linking Format

- **Smart Notes**: `@[note:convexId]@`
- **YouTube Videos**: `@[youtube:videoId]@`
- **Instagram Posts**: `@[instagram:postId]@`

#### How to Use Content Linking

1. **In the Smart Notes Editor**:
   - Type `@` to open the content selector
   - Search for any content (notes, YouTube videos, Instagram posts)
   - Select content to insert a link

2. **Content Types Supported**:
   - **Smart Notes**: Your existing notes with titles, tags, and analysis
   - **YouTube Videos**: Videos with titles, descriptions, statistics, and thumbnails
   - **Instagram Posts**: Posts with captions, media, insights, and engagement metrics

3. **Visual Indicators**:
   - Each content type has platform-specific icons and styling
   - YouTube content shows red accents and video statistics
   - Instagram content shows pink accents and engagement metrics
   - Smart notes show standard styling with tags and analysis

#### Technical Implementation

The system uses:
- **Prefixed IDs**: `type:id` format for content identification
- **Convex Queries**: Efficient data fetching with platform-specific queries
- **Unified Selector**: Single interface for all content types
- **Rich Rendering**: Platform-specific display components

#### Database Schema

No changes to the existing Convex schema were required. The system leverages:
- Existing `notes` table for smart notes
- Existing `youtubeVideos` table for YouTube content  
- Existing `instagramPosts` table for Instagram content
- New queries in `notes.ts` for content aggregation

#### Benefits

- **Cross-Platform References**: Link any content type in your notes
- **Rich Context**: See statistics, insights, and metadata for linked content
- **Seamless Integration**: Works with existing note-taking workflow
- **Future-Proof**: Easy to extend for additional platforms
