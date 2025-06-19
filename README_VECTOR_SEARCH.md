# Vector Search Implementation for HeyContent Chat

This implementation provides context-aware chat functionality by searching through user's existing content (conversations, notes, posts, etc.) to provide relevant context for LLM responses.

## Features

- **Simple Text-Based Search**: Uses basic text matching for immediate functionality
- **Extensible Architecture**: Ready for vector embeddings when needed
- **Multi-Content Search**: Searches across conversations, notes, and other user content
- **API Integration**: RESTful endpoints for easy integration

## Setup

### 1. Environment Variables

Add to your Convex environment variables:

```bash
# Optional: For future Google embeddings integration
GOOGLE_API_KEY=your_google_api_key_here
```

### 2. Database Schema

The implementation adds a `contentEmbeddings` table to your schema for future vector search capabilities:

```typescript
contentEmbeddings: defineTable({
  userId: v.string(),
  contentId: v.string(),
  contentType: v.union(...),
  title: v.string(),
  content: v.string(),
  embedding: v.array(v.float64()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
```

## Usage

### API Endpoint

**POST** `/api/users/:userId/chat_with_context`

```json
{
  "query": "What did I write about React performance?",
  "conversationId": "optional_conversation_id"
}
```

**Response:**
```json
{
  "success": true,
  "context": "Relevant content context...",
  "query": "What did I write about React performance?",
  "relevantContent": [
    {
      "title": "React Performance Tips",
      "contentType": "note",
      "score": 0.9
    }
  ],
  "prompt": "Enhanced prompt with context for LLM"
}
```

### Frontend Integration

```typescript
// Example React usage
const searchWithContext = async (query: string) => {
  const response = await fetch(`/api/users/${userId}/chat_with_context`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  
  const result = await response.json();
  
  if (result.success) {
    // Use result.prompt with your LLM
    // Display result.relevantContent to show sources
    console.log('Relevant content:', result.relevantContent);
    console.log('Enhanced prompt:', result.prompt);
  }
};
```

### Convex Functions

```typescript
import { api } from "./convex/_generated/api";

// Search for relevant content
const result = await convex.action(api.chatMutations.chatWithContext, {
  userId: "user_123",
  query: "What did I write about React?"
});
```

## Current Implementation

### Text-Based Search
The current implementation uses simple text matching across:
- **Conversations**: Searches message content and titles
- **Notes**: Searches titles and content
- **Future**: Instagram posts, YouTube videos, Gmail threads

### Search Algorithm
1. Convert query to lowercase
2. Search through content using `includes()` matching
3. Return top 5 most relevant items with metadata
4. Build contextual prompt for LLM integration

## Future Enhancements

### Vector Embeddings (Ready for Implementation)
The schema and functions are prepared for vector embeddings:

```typescript
// Generate embeddings for content
await convex.action(api.vectorSearch.createEmbedding, {
  userId,
  contentId,
  contentType: "note",
  title: "My Note",
  content: "Note content..."
});

// Search using vector similarity
const results = await convex.action(api.vectorSearch.searchRelevantContent, {
  userId,
  query: "What did I write about AI?",
  limit: 5
});
```

### Google Multimodal Embeddings
When `GOOGLE_API_KEY` is configured, the system can generate embeddings using Google's `text-embedding-004` model:

- **Dimensions**: 768
- **Task Type**: `RETRIEVAL_DOCUMENT`
- **Similarity**: Cosine similarity matching

## Integration with LLMs

The enhanced prompt format makes it easy to integrate with any LLM:

```typescript
const { prompt, relevantContent } = await searchWithContext(userQuery);

// Use with OpenAI, Anthropic, Google, etc.
const llmResponse = await your_llm_service.complete({
  prompt: prompt,
  context: relevantContent
});
```

## Error Handling

The implementation includes robust error handling:
- Graceful degradation when search fails
- Returns original query if context search errors
- Detailed error logging for debugging

## Security

- User data isolation (searches only user's content)
- Input validation on all endpoints
- Proper authentication checks

## Performance

- **Current**: O(n) text search through user content
- **Future**: O(log n) vector search with indexed embeddings
- Configurable result limits (default: 5 items)
- Efficient content filtering by type

This implementation provides immediate value with simple text search while being architected for future vector search enhancements. 