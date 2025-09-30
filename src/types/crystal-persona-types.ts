/**
 * ⚠️ DEPRECATED: PERSONA SYSTEM - SCHEDULED FOR REMOVAL
 * 
 * This entire persona system has been deprecated and replaced by the crystal system.
 * These types are kept for backwards compatibility only and will be removed in a future version.
 * 
 * TODO: Remove this entire file after confirming no active usage
 * TODO: Migrate any remaining persona data to crystal system
 * TODO: Update all imports to use crystal types instead
 * 
 * @deprecated Use crystal system types instead
 */

// === IDENTITY DIMENSIONS (What aspect of self this touches) ===

export enum IdentityDimension {
    VALUES_BELIEFS = 'values_beliefs',           // What they believe is important
    PERSONALITY = 'personality',                 // How they naturally are
    WORK_STYLE = 'work_style',                  // How they approach tasks
    COMMUNICATION = 'communication',             // How they interact with others
    TIME_ENERGY = 'time_energy',                // When/how they function best
    ENVIRONMENT = 'environment',                 // Physical/social needs
    LEARNING = 'learning',                       // How they absorb information
    RELATIONSHIPS = 'relationships',             // How they connect with people
    STRESS_COPING = 'stress_coping',            // How they handle pressure
    GOALS_GROWTH = 'goals_growth',              // What they're working toward
    BOUNDARIES = 'boundaries',                   // What they won't do/limits
    DECISION_MAKING = 'decision_making'          // How they make choices
}

// === PERSONA SHARD (Simple, Quote-Focused) ===

export interface PersonaShard {
    // === CORE DATA ===
    shard_id: string;
    user_id: string;

    // === THE REVELATION (Primary focus) ===
    exact_quote: string;                        // Their exact words - most important field
    what_this_reveals: string;                  // Qualitative interpretation
    identity_dimension: IdentityDimension;      // Which aspect of identity

    // === QUALITATIVE CONTEXT ===
    situation_context: string;                  // What was happening when they said this
    why_significant: string;                    // Why this matters for understanding them
    confidence_level: 'low' | 'medium' | 'high';  // Simple confidence assessment

    // === PATTERN CONNECTIONS ===
    connects_to: string[];                      // Simple tags for finding related shards
    contradicts: string[];                      // Shard IDs that conflict with this

    // === METADATA ===
    source_type: 'conversation' | 'note' | 'document';
    source_id: string;
    created_at: number;
}

// === USER PERSONA (Collection of Shards) ===

export interface UserPersona {
    user_id: string;

    // === ORGANIZED BY DIMENSION ===
    dimensions: {
        [key in IdentityDimension]: {
            key_quotes: string[];                   // Most revealing quotes for this dimension
            core_patterns: string[];               // Main patterns identified
            contradictions: string[];              // Internal conflicts in this area
            shard_ids: string[];                   // All shards for this dimension
        }
    };

    // === OVERALL INSIGHTS ===
    personality_summary: string;               // Qualitative overview of who they are
    core_values: string[];                     // What matters most to them
    behavioral_patterns: string[];            // How they consistently act
    internal_tensions: string[];              // Where they contradict themselves

    // === METADATA ===
    total_shards: number;
    last_updated: number;
    created_at: number;
}

// === SIMPLIFIED EXTRACTION REQUEST ===

export interface ExtractShardsRequest {
    user_id: string;
    content_to_analyze: string;
    context: {
        what_were_they_discussing?: string;
        source_type: 'conversation' | 'note' | 'document';
        source_id: string;
    };
}

export interface ExtractShardsResponse {
    shards: PersonaShard[];
    extraction_summary: {
        total_revelations: number;
        dimensions_touched: IdentityDimension[];
        most_significant_insight: string;
    };
}

// === AI PROMPT FOR SHARD EXTRACTION ===

export const SHARD_EXTRACTION_PROMPT = `
You are analyzing content to understand someone's personality and identity. Focus on EXACT QUOTES where they reveal something about themselves.

Look for moments where they say things like:
- "I always..." / "I never..."
- "I hate when..." / "I love when..."
- "I'm the type of person who..."
- "I can't stand..." / "I really value..."
- "I work best when..." / "I struggle with..."
- "What matters to me is..."
- "I believe..." / "I think..."

For each revelation, extract:

1. EXACT_QUOTE: Their precise words (most important!)
2. WHAT_THIS_REVEALS: What this tells us about who they are as a person
3. IDENTITY_DIMENSION: Which aspect of identity this touches (values, personality, work style, etc.)
4. SITUATION_CONTEXT: What were they talking about when they said this?
5. WHY_SIGNIFICANT: Why is this important for understanding them?
6. CONFIDENCE_LEVEL: How sure are you this is meaningful? (low/medium/high)
7. CONNECTS_TO: Simple tags that might connect to other aspects of their personality

Focus on quality over quantity. Only extract clear, meaningful revelations where they're telling us something important about themselves.
`;

// === PERSONA SYNTHESIS PROMPT ===

export const PERSONA_SYNTHESIS_PROMPT = `
Looking at all these personality shards for this user, provide a comprehensive qualitative analysis:

PERSONALITY_SUMMARY: In 2-3 sentences, who is this person? What makes them unique?

CORE_VALUES: What do they consistently care about across different contexts?

BEHAVIORAL_PATTERNS: How do they consistently act or approach things?

INTERNAL_TENSIONS: Where do they contradict themselves or have conflicting desires?

For each identity dimension that has shards:
- KEY_QUOTES: The most revealing 2-3 quotes for this dimension
- CORE_PATTERNS: Main patterns you see in this area
- CONTRADICTIONS: Any internal conflicts in this dimension

Focus on qualitative insights that help understand this person deeply.
`;

// === EXAMPLE SHARD (Simple & Clear) ===

export const EXAMPLE_SHARD: PersonaShard = {
    shard_id: "shard_001",
    user_id: "user_123",

    exact_quote: "I absolutely hate when people schedule meetings without an agenda - it feels like they don't respect my time",
    what_this_reveals: "Values structured communication and sees preparation as a form of respect. Has strong boundaries around time management.",
    identity_dimension: IdentityDimension.COMMUNICATION,

    situation_context: "Discussing frustrating workplace experiences with a friend",
    why_significant: "Shows they have clear boundaries and values around respect and preparation. This likely affects how they interact professionally.",
    confidence_level: "high",

    connects_to: ["structure", "respect", "time_management", "boundaries", "workplace"],
    contradicts: [],

    source_type: "conversation",
    source_id: "conv_456",
    created_at: Date.now()
};

// === SIMPLIFIED VALIDATION ===

export function validateShard(shard: Partial<PersonaShard>): string[] {
    const errors: string[] = [];

    if (!shard.exact_quote?.trim()) {
        errors.push("exact_quote is required - this is the most important field");
    }

    if (!shard.what_this_reveals?.trim()) {
        errors.push("what_this_reveals is required - explain what this tells us about them");
    }

    if (!shard.identity_dimension) {
        errors.push("identity_dimension is required");
    }

    if (!['low', 'medium', 'high'].includes(shard.confidence_level || '')) {
        errors.push("confidence_level must be 'low', 'medium', or 'high'");
    }

    return errors;
}

// === WHAT GEMINI FLASH SHOULD FOCUS ON ===

/*
PRIMARY FOCUS: EXACT QUOTES
- The user's precise words are the most valuable data
- Everything else is interpretation of those quotes
- Quality quotes reveal deep personality insights

QUALITATIVE OVER QUANTITATIVE:
- "High confidence" not "0.87 confidence"
- "Values structure and respect" not numerical personality scores
- "Contradicts their stated preference for flexibility" not conflict metrics

SIMPLE STRUCTURE:
- Flat fields, minimal nesting
- Clear enums and simple types
- Easy for LLM to generate consistently

PATTERN RECOGNITION:
- Focus on connecting shards through simple tags
- Identify contradictions through clear language
- Build comprehensive understanding through accumulation of insights

This approach maximizes what Gemini Flash does well (qualitative analysis, quote extraction, pattern recognition) while minimizing what it struggles with (complex nested structures, precise numerical scoring, complex reasoning chains).
*/