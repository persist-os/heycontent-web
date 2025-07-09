# Frontend-Backend Request Structure: Two-Stage Chat System

This document shows the exact request structure that the frontend sends to the backend in both stages of the chat system.

## Stage 1: Context Grading Request

### Frontend → Backend: `/api/v1/chat/grade-context`

**What happens**: Frontend sends vector search results to be graded for relevance

**Request**:
```http
POST http://localhost:8000/api/v1/chat/grade-context
Content-Type: application/json
Authorization: Bearer heycontent_lFVAStebS1ZKYc7eCIkMGkuyTIc2_6bb98bf83e36e980494167ab2b6fab21

{
  "user_id": "lFVAStebS1ZKYc7eCIkMGkuyTIc2",
  "query": "how can i help grow my audience",
  "vector_search_results": [
    {
      "title": "Instagram Post: Growing Your Following",
      "contentType": "instagram_post",
      "content": "Tips for growing your Instagram following: 1. Post consistently 2. Use relevant hashtags 3. Engage with your audience...",
      "score": 0.85,
      "_id": "instagram_post-growingfollowing"
    },
    {
      "title": "Email Thread: No Subject",
      "contentType": "gmail_thread",
      "content": "Gmail Thread: No Subject\n\nFrom: Unknown Sender\n\nSnippet: \n\nMessage Count: 1",
      "score": 0.32,
      "_id": "gmail_thread-nosubject"
    },
    {
      "title": "Conversation: How to improve workshops",
      "contentType": "conversation",
      "content": "user: how can i improve my workshops?\nassistant: Here are some ways to improve your workshops...",
      "score": 0.67,
      "_id": "conversation-workshops"
    }
  ],
  "action": "grade_context"
}
```

**Backend Response**:
```json
{
  "relevant_context": [
    {
      "title": "Instagram Post: Growing Your Following",
      "contentType": "instagram_post",
      "score": 0.85,
      "summary": "Tips for growing your Instagram following: 1. Post consistently 2. Use relevant hashtags 3. Engage with your audience...",
      "relevance_score": 0.95,
      "relevance_reason": "Directly addresses audience growth strategies with actionable tips"
    },
    {
      "title": "Conversation: How to improve workshops",
      "contentType": "conversation", 
      "score": 0.67,
      "summary": "user: how can i improve my workshops?\nassistant: Here are some ways to improve your workshops...",
      "relevance_score": 0.78,
      "relevance_reason": "Workshops can be a way to grow audience, somewhat relevant to audience growth"
    }
  ],
  "grading_summary": {
    "total_items": 3,
    "relevant_items": 2,
    "confidence_score": 0.87
  },
  "metadata": {
    "request_id": "abc123",
    "processing_time_ms": 1250
  }
}
```

## Stage 2: Chat Generation Request

### Frontend → Backend: `/api/v1/chat`

**What happens**: Frontend sends the user query with only the relevant context from Stage 1

**Request**:
```http
POST http://localhost:8000/api/v1/chat
Content-Type: application/json
Authorization: Bearer heycontent_lFVAStebS1ZKYc7eCIkMGkuyTIc2_6bb98bf83e36e980494167ab2b6fab21

{
  "user_id": "lFVAStebS1ZKYc7eCIkMGkuyTIc2",
  "query": "how can i help grow my audience",
  "is_first_message": true,
  "session_id": null,
  "use_vector_search": true,
  "has_context_injection": true,
  "context_enhanced": true,
  "vector_search_metadata": {
    "foundRelevantContent": true,
    "relevantItemsCount": 2,
    "searchQuery": "how can i help grow my audience",
    "context": "instagram_post: \"Instagram Post: Growing Your Following\"\nTips for growing your Instagram following: 1. Post consistently 2. Use relevant hashtags 3. Engage with your audience...\n(Relevance: Directly addresses audience growth strategies with actionable tips)\n\nconversation: \"Conversation: How to improve workshops\"\nuser: how can i improve my workshops?\nassistant: Here are some ways to improve your workshops...\n(Relevance: Workshops can be a way to grow audience, somewhat relevant to audience growth)",
    "graded": true,
    "grading_summary": {
      "total_items": 3,
      "relevant_items": 2,
      "confidence_score": 0.87
    }
  }
}
```

**Backend Response** (unchanged from existing format):
```json
{
  "response": "Based on your Instagram content about growing your following and your workshop experience, here are some strategies to help grow your audience:\n\n**From your Instagram insights:**\n1. **Post consistently** - This builds trust and keeps you top-of-mind\n2. **Use relevant hashtags** - This helps new people discover your content\n3. **Engage with your audience** - This builds genuine relationships\n\n**Leveraging your workshop experience:**\nSince you're running workshops, you can use these as audience-building tools:\n- Share behind-the-scenes content from your workshops\n- Post testimonials and success stories\n- Create shorter, valuable content pieces from your workshop material\n\nThe key is to be consistent across platforms and always provide value to your audience!",
  "status": "success",
  "session_id": "j57fcgh5t137ygh538727fv6397k0ga5",
  "suggestions": [
    "What are some current trending hashtags for my niche?",
    "How can I turn my workshop content into social media posts?",
    "What's the best posting schedule for audience growth?"
  ],
  "metadata": {
    "context_graded": true
  }
}
```

## Key Differences from Original System

### Original System (Single Request):
```http
POST /api/v1/chat
{
  "query": "how can i help grow my audience",
  "vector_search_metadata": {
    "foundRelevantContent": true,
    "relevantItemsCount": 3,
    "context": "All 3 items including irrelevant email thread..."
  }
}
```

### New Two-Stage System:

**Stage 1**: Grade context first
```http
POST /api/v1/chat/grade-context
{
  "query": "how can i help grow my audience", 
  "vector_search_results": [3 items]
}
```

**Stage 2**: Chat with only relevant context
```http
POST /api/v1/chat
{
  "query": "how can i help grow my audience",
  "vector_search_metadata": {
    "foundRelevantContent": true,
    "relevantItemsCount": 2,  // Only relevant items
    "context": "Only the 2 relevant items...",
    "graded": true,           // New flag
    "grading_summary": {...}  // New metadata
  }
}
```

## Error Handling

### Stage 1 Fails (Context Grading)
If the grading endpoint fails, frontend falls back to using all vector search results:

```http
POST /api/v1/chat
{
  "query": "how can i help grow my audience",
  "vector_search_metadata": {
    "foundRelevantContent": true,
    "relevantItemsCount": 3,
    "context": "All original vector search results...",
    "graded": false  // Indicates grading failed
  }
}
```

### Stage 2 Fails (Chat Generation)
Standard error handling as before - return error response to frontend.

## Request Flow Timeline

1. **0ms**: User submits query
2. **0-500ms**: Frontend performs vector search in Convex
3. **500ms**: Frontend sends Stage 1 request to `/api/v1/chat/grade-context`
4. **500-1500ms**: Backend grades each vector result for relevance
5. **1500ms**: Backend returns only relevant items
6. **1500ms**: Frontend sends Stage 2 request to `/api/v1/chat` with graded context
7. **1500-3500ms**: Backend generates chat response with relevant context only
8. **3500ms**: User sees final response

## Backend Implementation Notes

1. **New Endpoint**: Implement `/api/v1/chat/grade-context` that grades vector results
2. **Modified Endpoint**: Update `/api/v1/chat` to handle `graded: true` flag
3. **Parallel Processing**: Grade multiple vector results in parallel for speed
4. **Error Handling**: Gracefully handle grading failures and fall back
5. **Monitoring**: Track grading success rates and performance metrics

The frontend handles all the complexity of managing the two-stage flow and provides clear indicators to the backend about whether context was graded successfully. 