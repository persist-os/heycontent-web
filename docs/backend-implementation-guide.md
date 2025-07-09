# Backend Implementation Guide: Two-Stage Chat System

This document outlines how to implement the backend for the two-stage chat system that grades context relevance before generating responses.

## Overview

The two-stage system works as follows:
1. **Stage 1**: Grade vector search results for relevance to the user query
2. **Stage 2**: Generate chat response using only the relevant context

## Required API Endpoints

### 1. Context Grading Endpoint: `/api/v1/chat/grade-context`

**Purpose**: Grade vector search results and return only relevant items

**Method**: `POST`

**Request Headers**:
```
Content-Type: application/json
Authorization: Bearer <api_key>
```

**Request Body**:
```json
{
  "user_id": "lFVAStebS1ZKYc7eCIkMGkuyTIc2",
  "query": "how can i help grow my audience",
  "vector_search_results": [
    {
      "title": "Instagram Post: Growing Your Following",
      "contentType": "instagram_post",
      "content": "Tips for growing your Instagram following...",
      "score": 0.85,
      "_id": "instagram_post-123"
    },
    {
      "title": "Email Thread: Marketing Strategy",
      "contentType": "gmail_thread", 
      "content": "Discussion about marketing strategies...",
      "score": 0.72,
      "_id": "gmail_thread-456"
    }
  ],
  "action": "grade_context"
}
```

**Response Body**:
```json
{
  "relevant_context": [
    {
      "title": "Instagram Post: Growing Your Following",
      "contentType": "instagram_post",
      "score": 0.85,
      "summary": "Tips for growing your Instagram following...",
      "relevance_score": 0.92,
      "relevance_reason": "Directly addresses audience growth strategies"
    }
  ],
  "grading_summary": {
    "total_items": 2,
    "relevant_items": 1,
    "confidence_score": 0.92
  },
  "metadata": {
    "request_id": "abc123",
    "processing_time_ms": 850
  }
}
```

### 2. Chat Endpoint (Modified): `/api/v1/chat`

**Purpose**: Generate chat response with graded context

**Method**: `POST`

**Request Headers**:
```
Content-Type: application/json
Authorization: Bearer <api_key>
```

**Request Body (with graded context)**:
```json
{
  "user_id": "lFVAStebS1ZKYc7eCIkMGkuyTIc2",
  "query": "how can i help grow my audience",
  "is_first_message": true,
  "session_id": null,
  "vector_search_metadata": {
    "foundRelevantContent": true,
    "relevantItemsCount": 1,
    "searchQuery": "how can i help grow my audience",
    "context": "instagram_post: \"Instagram Post: Growing Your Following\"\nTips for growing your Instagram following...\n(Relevance: Directly addresses audience growth strategies)",
    "graded": true,
    "grading_summary": {
      "total_items": 2,
      "relevant_items": 1,
      "confidence_score": 0.92
    }
  }
}
```

**Response Body** (unchanged):
```json
{
  "response": "Based on your Instagram content about growing your following...",
  "status": "success",
  "session_id": "j57fcgh5t137ygh538727fv6397k0ga5",
  "suggestions": [
    "What are some current trending hashtags for my niche?",
    "How can I improve my posting schedule?",
    "What type of content gets the most engagement?"
  ],
  "metadata": {}
}
```

## Implementation Details

### Context Grading Logic

The grading system should use an LLM to evaluate each vector search result for relevance to the user query. Here's the recommended approach:

#### 1. Grading Prompt Template
```python
GRADING_PROMPT = """
You are an expert at determining if content is relevant to a user's query.

User Query: {query}

Content to Grade:
Title: {title}
Type: {content_type}
Content: {content}

Instructions:
1. Rate the relevance on a scale of 0.0 to 1.0 (where 1.0 is highly relevant)
2. Only consider content relevant if it has a score of 0.6 or higher
3. Provide a brief reason for your relevance score

Response format (JSON only):
{{
  "relevance_score": <float>,
  "is_relevant": <boolean>,
  "reason": "<brief explanation>"
}}
"""
```

#### 2. Grading Implementation (Python/FastAPI example)
```python
from typing import List, Dict, Any
import asyncio
import json

async def grade_context_relevance(
    query: str, 
    vector_results: List[Dict[str, Any]],
    llm_client  # Your LLM client (OpenAI, etc.)
) -> Dict[str, Any]:
    """
    Grade vector search results for relevance to the query
    """
    relevant_items = []
    grading_tasks = []
    
    # Create grading tasks for all items
    for item in vector_results:
        task = grade_single_item(query, item, llm_client)
        grading_tasks.append(task)
    
    # Process all gradings in parallel
    grading_results = await asyncio.gather(*grading_tasks)
    
    # Filter relevant items
    for i, grading in enumerate(grading_results):
        if grading["is_relevant"]:
            item = vector_results[i].copy()
            item.update({
                "relevance_score": grading["relevance_score"],
                "relevance_reason": grading["reason"]
            })
            relevant_items.append(item)
    
    return {
        "relevant_context": relevant_items,
        "grading_summary": {
            "total_items": len(vector_results),
            "relevant_items": len(relevant_items),
            "confidence_score": sum(g["relevance_score"] for g in grading_results) / len(grading_results) if grading_results else 0
        }
    }

async def grade_single_item(
    query: str, 
    item: Dict[str, Any], 
    llm_client
) -> Dict[str, Any]:
    """
    Grade a single content item for relevance
    """
    prompt = GRADING_PROMPT.format(
        query=query,
        title=item["title"],
        content_type=item["contentType"],
        content=item["content"][:1000]  # Truncate for efficiency
    )
    
    try:
        response = await llm_client.chat.completions.create(
            model="gpt-4o-mini",  # Use faster model for grading
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=200
        )
        
        result = json.loads(response.choices[0].message.content)
        return result
        
    except Exception as e:
        # Fallback: consider it not relevant if grading fails
        return {
            "relevance_score": 0.0,
            "is_relevant": False,
            "reason": f"Grading failed: {str(e)}"
        }
```

#### 3. FastAPI Route Example
```python
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

class VectorSearchItem(BaseModel):
    title: str
    contentType: str
    content: str
    score: float
    _id: str

class GradeContextRequest(BaseModel):
    user_id: str
    query: str
    vector_search_results: List[VectorSearchItem]
    action: str = "grade_context"

class RelevantContextItem(BaseModel):
    title: str
    contentType: str
    score: float
    summary: Optional[str] = None
    relevance_score: float
    relevance_reason: str

class GradingSummary(BaseModel):
    total_items: int
    relevant_items: int
    confidence_score: float

class GradeContextResponse(BaseModel):
    relevant_context: List[RelevantContextItem]
    grading_summary: GradingSummary
    metadata: dict

@router.post("/api/v1/chat/grade-context", response_model=GradeContextResponse)
async def grade_context(
    request: GradeContextRequest,
    current_user = Depends(get_current_user)  # Your auth dependency
):
    """
    Grade vector search results for relevance to user query
    """
    if current_user.user_id != request.user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if not request.vector_search_results:
        return GradeContextResponse(
            relevant_context=[],
            grading_summary=GradingSummary(
                total_items=0,
                relevant_items=0,
                confidence_score=0.0
            ),
            metadata={"request_id": generate_request_id()}
        )
    
    # Grade the context
    grading_result = await grade_context_relevance(
        request.query,
        [item.dict() for item in request.vector_search_results],
        llm_client
    )
    
    # Format response
    relevant_items = [
        RelevantContextItem(**item) 
        for item in grading_result["relevant_context"]
    ]
    
    return GradeContextResponse(
        relevant_context=relevant_items,
        grading_summary=GradingSummary(**grading_result["grading_summary"]),
        metadata={"request_id": generate_request_id()}
    )
```

### Modified Chat Endpoint

The existing chat endpoint should be updated to handle the new `graded` flag in the vector search metadata:

```python
@router.post("/api/v1/chat")
async def chat(request: ChatRequest, current_user = Depends(get_current_user)):
    """
    Generate chat response with graded context
    """
    # Check if context was graded
    context_was_graded = (
        request.vector_search_metadata and 
        request.vector_search_metadata.get("graded", False)
    )
    
    if context_was_graded:
        # Use the pre-graded context directly
        context = request.vector_search_metadata.get("context", "")
        grading_info = request.vector_search_metadata.get("grading_summary", {})
        
        # Add grading information to the prompt
        system_prompt = f"""
        You are a helpful AI assistant. The user's query has been analyzed and matched 
        against their relevant content. 
        
        Grading Summary:
        - {grading_info.get('relevant_items', 0)} out of {grading_info.get('total_items', 0)} items were considered relevant
        - Confidence: {grading_info.get('confidence_score', 0):.1%}
        
        Use only the provided relevant context to generate your response.
        """
    else:
        # Fallback to original context handling
        context = request.vector_search_metadata.get("context", "") if request.vector_search_metadata else ""
        system_prompt = "You are a helpful AI assistant."
    
    # Generate response using the context
    response = await generate_chat_response(
        query=request.query,
        context=context,
        system_prompt=system_prompt,
        conversation_history=get_conversation_history(request.session_id)
    )
    
    return ChatResponse(
        response=response.content,
        session_id=save_conversation(request, response),
        suggestions=generate_suggestions(request.query, response.content),
        metadata={"context_graded": context_was_graded}
    )
```

## Key Benefits

1. **Improved Relevance**: Only truly relevant content is used for response generation
2. **Better Performance**: Smaller context windows mean faster and cheaper LLM calls
3. **Quality Control**: Explicit relevance scoring provides transparency
4. **Fallback Handling**: System gracefully falls back if grading fails
5. **User Experience**: Users see the AI "thinking" about which content is most relevant

## Configuration

### Environment Variables
```bash
# LLM Configuration
GRADING_MODEL=gpt-4o-mini  # Faster, cheaper model for grading
CHAT_MODEL=gpt-4o          # Better model for actual chat responses
RELEVANCE_THRESHOLD=0.6    # Minimum score to consider content relevant
MAX_CONTEXT_ITEMS=5        # Maximum items to grade
PARALLEL_GRADING=true      # Enable parallel grading for speed
```

### Rate Limiting
Consider implementing separate rate limits for grading vs. chat endpoints, as grading typically uses smaller, cheaper models.

## Error Handling

The system should gracefully handle grading failures:

1. **Individual item grading failure**: Skip the item and continue
2. **Complete grading failure**: Fall back to using all vector search results
3. **Network timeouts**: Use cached relevance scores if available
4. **API limits**: Queue grading requests or use fallback models

## Monitoring and Analytics

Track these metrics to optimize the system:

- Grading success rate
- Average relevance scores
- User satisfaction with graded vs. ungraded responses
- Processing time for each stage
- Cost comparison between graded and ungraded requests 