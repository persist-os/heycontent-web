interface QuotaError {
    service: string;
    error: string;
}

interface InsightEmail {
    subject: string;
    from: string;
    date: string;
    dealValue?: number;
    dealType?: string;
}

interface InsightVideo {
    title: string;
    views: string | number;
    engagement: string | number;
}

interface ExtendedInsightContext {
    why: string[];
    data: string[];
    source?: string;
    sourceDetails?: string[];
    emails?: InsightEmail[];
    videos?: InsightVideo[];
}

interface AIActionableInsight {
    id: string | number;
    type: 'partnership' | 'content' | 'platform';
    opportunity: {
        title: string;
        description: string;
        impact: string;
        timing: string;
        confidence: number;
    };
    action: {
        steps: string[];
        timeToImplement: string;
        expectedOutcome: string;
        requirements: string[];
        type?: string;
        priority?: 'high' | 'medium' | 'low';
    };
    context: ExtendedInsightContext;
}

interface CacheMetadata {
    timestamp: string;
    version: number;
    partial: boolean;
}

interface CachedInsights {
    insights: AIActionableInsight[];
    metadata: CacheMetadata;
}

interface APIInsightResponse {
    title: string;
    type: 'partnership' | 'content' | 'platform';
    description: string;
    confidence: number;
    source?: string;
    action?: {
        steps: string[];
        timeToImplement: string;
        requirements: string[];
        type?: string;
        priority?: 'high' | 'medium' | 'low';
    };
    data?: {
        emails?: InsightEmail[];
        videos?: InsightVideo[];
        sourceDetails?: string[];
        data?: string[];
        engagementPotential?: string;
    };
}
