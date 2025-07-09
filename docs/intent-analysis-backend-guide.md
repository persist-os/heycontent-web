# Intent Analysis Backend Implementation Guide

## Overview

This document describes how to implement the **Stage 0: Intent Analysis** endpoint that determines whether a user query needs context from their content history before proceeding with vector search.

## Architecture

The new three-stage chat flow:

1. **Stage 0**: Intent Analysis - "Does this query need context from user's content history?"
2. **Stage 1A**: Vector Search (if needed)
3. **Stage 1B**: Context Grading (if vector search performed)
4. **Stage 2**: Chat Generation (with or without context)

## API Endpoint Specification

### Endpoint
```
POST /api/v1/chat/analyze-intent
```

### Request Headers
```
Content-Type: application/json
Authorization: Bearer heycontent_{user_id}_{api_key_hash}
```

### Request Body
```json
{
  "user_id": "string",
  "query": "string",
  "action": "analyze_intent"
}
```

### Response Body
```json
{
  "needs_context": boolean,
  "confidence_score": number,
  "reasoning": "string",
  "metadata": {
    "request_id": "string",
    "processing_time_ms": number
  }
}
```

## Example Implementation (Python/FastAPI)

```python
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import openai
import time
import uuid
from typing import Optional

router = APIRouter()

class IntentAnalysisRequest(BaseModel):
    user_id: str
    query: str
    action: str

class IntentAnalysisResponse(BaseModel):
    needs_context: bool
    confidence_score: float
    reasoning: str
    metadata: dict

@router.post("/analyze-intent", response_model=IntentAnalysisResponse)
async def analyze_query_intent(
    request: IntentAnalysisRequest,
    current_user: str = Depends(get_current_user)
):
    """
    Analyze whether a user query needs context from their content history.
    """
    start_time = time.time()
    request_id = str(uuid.uuid4())[:8]
    
    try:
        # Validate user permissions
        if current_user != request.user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Intent analysis using OpenAI
        intent_result = await analyze_intent_with_llm(request.query)
        
        processing_time_ms = int((time.time() - start_time) * 1000)
        
        return IntentAnalysisResponse(
            needs_context=intent_result["needs_context"],
            confidence_score=intent_result["confidence_score"],
            reasoning=intent_result["reasoning"],
            metadata={
                "request_id": request_id,
                "processing_time_ms": processing_time_ms
            }
        )
        
    except Exception as e:
        logger.error(f"Intent analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Intent analysis failed")

async def analyze_intent_with_llm(query: str) -> dict:
    """
    Use LLM to determine if query needs user context.
    """
    
    prompt = f"""
    Analyze the following user query and determine if it would benefit from context about the user's content history (notes, conversations, social media posts, emails, etc.).

    Query: "{query}"

    Consider these factors:
    1. Does the query reference "my", "our", or personal content?
    2. Does it ask about past conversations, projects, or activities?
    3. Does it request analysis or insights about user's content?
    4. Would knowing the user's interests, work, or history improve the response?

    Queries that DON'T need context (respond False):
    - General knowledge questions ("What is machine learning?")
    - How-to questions not related to user's work ("How to cook pasta?")
    - Current events or news ("What happened today?")
    - Mathematical calculations
    - General advice not requiring personal context

    Queries that DO need context (respond True):
    - "Analyze my recent posts"
    - "What did I discuss in my last meeting?"
    - "Help me with my project"
    - "Based on my content strategy..."
    - "How can I improve my audience engagement?"

    Respond with a JSON object:
    {{
        "needs_context": boolean,
        "confidence_score": float (0.0 to 1.0),
        "reasoning": "Brief explanation of the decision"
    }}
    """
    
    try:
        response = await openai.ChatCompletion.acreate(
            model="gpt-4o-mini",  # Use faster/cheaper model for intent analysis
            messages=[
                {"role": "system", "content": "You are an expert at analyzing user queries to determine if they need personal context. Always respond with valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,  # Low temperature for consistent results
            max_tokens=200
        )
        
        content = response.choices[0].message.content.strip()
        
        # Parse JSON response
        import json
        result = json.loads(content)
        
        # Validate response structure
        required_keys = ["needs_context", "confidence_score", "reasoning"]
        if not all(key in result for key in required_keys):
            raise ValueError("Invalid response structure from LLM")
        
        # Ensure confidence score is between 0 and 1
        result["confidence_score"] = max(0.0, min(1.0, float(result["confidence_score"])))
        
        return result
        
    except Exception as e:
        logger.error(f"LLM intent analysis failed: {str(e)}")
        # Fallback: default to needs_context=True to be safe
        return {
            "needs_context": True,
            "confidence_score": 0.5,
            "reasoning": "Intent analysis failed, defaulting to context search for safety"
        }
```

## LLM Prompt Engineering

### Key Principles

1. **Clear Binary Decision**: The LLM should make a clear yes/no decision
2. **Consistent Format**: Always return structured JSON
3. **Fast Model**: Use `gpt-4o-mini` for speed and cost efficiency
4. **Low Temperature**: Use temperature 0.1 for consistent results
5. **Fallback Strategy**: Default to `needs_context=true` if analysis fails

### Example Prompts

**Queries that should return `needs_context: false`:**
- "What is machine learning?"
- "How do I calculate compound interest?"
- "What's the weather like today?"
- "Explain quantum physics"
- "How to cook a steak?"

**Queries that should return `needs_context: true`:**
- "How can I improve my content strategy?"
- "Analyze my recent Instagram posts"
- "What did we discuss in our last meeting?"
- "Help me write a follow-up email"
- "Based on my audience, what should I post next?"

## Error Handling

### Graceful Degradation
If intent analysis fails:
1. Log the error
2. Default to `needs_context: true`
3. Continue with vector search for safety
4. Return confidence score of 0.5

### Response Validation
Always validate LLM responses:
```python
def validate_intent_response(response: dict) -> dict:
    """Validate and sanitize LLM response."""
    
    # Ensure required fields exist
    if "needs_context" not in response:
        response["needs_context"] = True
    
    # Ensure boolean type
    response["needs_context"] = bool(response.get("needs_context", True))
    
    # Ensure confidence score is valid float between 0-1
    confidence = response.get("confidence_score", 0.5)
    response["confidence_score"] = max(0.0, min(1.0, float(confidence)))
    
    # Ensure reasoning exists
    if "reasoning" not in response or not response["reasoning"]:
        response["reasoning"] = "Standard intent analysis completed"
    
    return response
```

## Performance Considerations

### Caching Strategy
Consider caching intent analysis results for similar queries:

```python
import hashlib
from functools import lru_cache

@lru_cache(maxsize=1000)
def get_cached_intent_analysis(query_hash: str) -> Optional[dict]:
    """Cache frequent intent analysis results."""
    # Implementation depends on your caching system (Redis, etc.)
    pass

async def analyze_intent_with_cache(query: str) -> dict:
    """Analyze intent with caching for performance."""
    
    # Create hash of normalized query
    normalized_query = query.lower().strip()
    query_hash = hashlib.md5(normalized_query.encode()).hexdigest()
    
    # Check cache first
    cached_result = get_cached_intent_analysis(query_hash)
    if cached_result:
        return cached_result
    
    # Perform fresh analysis
    result = await analyze_intent_with_llm(query)
    
    # Cache result (implement based on your system)
    cache_intent_analysis(query_hash, result)
    
    return result
```

### Timeout Configuration
Set appropriate timeouts:
- Intent analysis: 5-10 seconds maximum
- Fallback if timeout exceeded

## Integration with Existing Chat Flow

### Updated Chat Endpoint Logic

```python
@router.post("/chat")
async def chat_with_intent_analysis(request: ChatRequest):
    """Enhanced chat endpoint with intent analysis."""
    
    # Stage 0: Intent Analysis
    intent_result = await analyze_query_intent(
        user_id=request.user_id,
        query=request.query
    )
    
    vector_search_metadata = None
    
    # Stage 1: Vector Search (only if needed)
    if intent_result["needs_context"]:
        # Perform vector search
        vector_results = await search_user_content(
            user_id=request.user_id,
            query=request.query
        )
        
        # Grade context relevance
        if vector_results:
            graded_context = await grade_context_relevance(
                query=request.query,
                results=vector_results
            )
            vector_search_metadata = graded_context
    else:
        # Query doesn't need context
        vector_search_metadata = {
            "foundRelevantContent": False,
            "skipped_reason": "Query does not need user context",
            "intent_analysis": intent_result
        }
    
    # Stage 2: Generate response
    response = await generate_chat_response(
        query=request.query,
        vector_context=vector_search_metadata,
        intent_analysis=intent_result
    )
    
    return response
```

## Monitoring and Analytics

### Key Metrics to Track

1. **Intent Analysis Accuracy**
   - Track user feedback on whether context was needed
   - Monitor queries that were marked as "no context needed" but users requested more info

2. **Performance Metrics**
   - Intent analysis response time
   - Cache hit rate
   - Fallback rate (when analysis fails)

3. **Cost Optimization**
   - Percentage of queries that skip vector search
   - Token usage for intent analysis
   - Overall system performance improvement

### Example Monitoring Code

```python
import logging
from datadog import statsd

async def track_intent_analysis_metrics(
    query: str,
    intent_result: dict,
    processing_time_ms: int
):
    """Track intent analysis metrics."""
    
    # Performance metrics
    statsd.histogram('intent_analysis.response_time', processing_time_ms)
    
    # Decision metrics
    needs_context = intent_result["needs_context"]
    statsd.increment(f'intent_analysis.decision.{"needs_context" if needs_context else "no_context"}')
    
    # Confidence metrics
    confidence = intent_result["confidence_score"]
    statsd.histogram('intent_analysis.confidence_score', confidence)
    
    # Log for analysis
    logging.info(f"Intent Analysis: query_length={len(query)}, needs_context={needs_context}, confidence={confidence}")
```

## Testing Strategy

### Unit Tests

```python
import pytest

@pytest.mark.asyncio
async def test_intent_analysis_personal_query():
    """Test that personal queries are detected."""
    query = "How can I improve my content strategy based on my recent posts?"
    result = await analyze_intent_with_llm(query)
    
    assert result["needs_context"] == True
    assert result["confidence_score"] > 0.7

@pytest.mark.asyncio
async def test_intent_analysis_general_query():
    """Test that general queries are detected."""
    query = "What is machine learning?"
    result = await analyze_intent_with_llm(query)
    
    assert result["needs_context"] == False
    assert result["confidence_score"] > 0.7
```

### Integration Tests

```python
@pytest.mark.asyncio
async def test_full_intent_analysis_flow():
    """Test the complete intent analysis endpoint."""
    
    request_data = {
        "user_id": "test_user",
        "query": "Analyze my recent Instagram engagement",
        "action": "analyze_intent"
    }
    
    response = client.post("/api/v1/chat/analyze-intent", json=request_data)
    
    assert response.status_code == 200
    data = response.json()
    
    assert "needs_context" in data
    assert "confidence_score" in data
    assert "reasoning" in data
    assert "metadata" in data
```

## Deployment Checklist

- [ ] Implement intent analysis endpoint
- [ ] Add LLM prompt for intent detection
- [ ] Implement error handling and fallbacks
- [ ] Add response validation
- [ ] Set up caching strategy
- [ ] Configure monitoring and metrics
- [ ] Add comprehensive tests
- [ ] Update API documentation
- [ ] Deploy with feature flag for gradual rollout

## Security Considerations

1. **Rate Limiting**: Implement per-user rate limits for intent analysis
2. **Input Validation**: Sanitize and validate query input
3. **API Key Validation**: Ensure proper authentication
4. **Logging**: Log requests without exposing sensitive content

This implementation will significantly optimize the chat system by avoiding unnecessary vector searches for general queries while maintaining accuracy for queries that truly benefit from user context. 