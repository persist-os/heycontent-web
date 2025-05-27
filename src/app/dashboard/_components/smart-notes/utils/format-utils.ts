export function formatAnalysisToMarkdown(analysis: any): string {
  try {
    if (!analysis) return 'No analysis available';

    // Validate that analysis has the expected structure
    if (typeof analysis !== 'object') {
      console.warn('Analysis is not an object:', analysis);
      return `Analysis data is not in the expected format: ${typeof analysis}`;
    }

    // Content Strategy section
    const contentStrategy = `## Content Strategy Analysis

### Overview
- **Category:** ${analysis.contentStrategy?.overview?.category || 'N/A'}
- **Core Idea:** ${analysis.contentStrategy?.overview?.coreIdea || 'N/A'}
- **Content Type:** ${analysis.contentStrategy?.overview?.contentType || 'N/A'}
- **Stage:** ${analysis.contentStrategy?.overview?.stage || 'N/A'}

### Target Audience
- **Demographics:** ${analysis.contentStrategy?.marketAnalysis?.audience?.demographics || 'N/A'}
- **Interests:** ${analysis.contentStrategy?.marketAnalysis?.audience?.interests || 'N/A'}
- **Psychographics:** ${analysis.contentStrategy?.marketAnalysis?.audience?.psychographics || 'N/A'}

### Competition
- **Direct:** ${analysis.contentStrategy?.marketAnalysis?.competition?.direct || 'N/A'}
- **Indirect:** ${analysis.contentStrategy?.marketAnalysis?.competition?.indirect || 'N/A'}
- **Analysis:** ${analysis.contentStrategy?.marketAnalysis?.competition?.analysis || 'N/A'}`;

    // Platform Strategy section
    const platformsMarkdown = Array.isArray(analysis.platformStrategy?.platforms)
      ? analysis.platformStrategy.platforms.map((p: any) =>
          `- **${p.name}:** ${p.rationale}`
        ).join('\n')
      : 'No platform recommendations available';

    const platformStrategy = `## Platform Strategy

### Recommended Platforms
${platformsMarkdown}

### Posting Schedule
${Object.entries(analysis.platformStrategy?.timing || {}).map(([platform, data]: [string, any]) =>
  `- **${platform}:** ${data.postingSchedule} - ${data.analysis}`
).join('\n') || 'No posting schedule available'}`;

    // Production Plan section
    const productionPlan = `## Production Plan

### Resources
- **Equipment:** ${analysis.productionPlan?.resources?.equipment || 'N/A'}
- **Software:** ${analysis.productionPlan?.resources?.software || 'N/A'}
- **Props:** ${analysis.productionPlan?.resources?.props || 'N/A'}
- **Budget:** ${analysis.productionPlan?.resources?.budget || 'N/A'}

### Timeline
${Object.entries(analysis.productionPlan?.timeline || {}).map(([phase, data]: [string, any]) =>
  `- **${phase}:** ${data.duration} - ${data.goals}`
).join('\n') || 'No timeline available'}`;

    // Growth Strategy section
    const monetizationOptions = Array.isArray(analysis.growthStrategy?.monetization?.options)
      ? analysis.growthStrategy.monetization.options.map((option: string) =>
          `- ${option}`
        ).join('\n')
      : 'No monetization options available';

    const growthTactics = Array.isArray(analysis.growthStrategy?.audience?.growthTactics)
      ? analysis.growthStrategy.audience.growthTactics.map((tactic: string) =>
          `- ${tactic}`
        ).join('\n')
      : 'No growth tactics available';

    const growthStrategy = `## Growth Strategy

### Monetization Options
${monetizationOptions}

### Audience Growth Tactics
${growthTactics}

### Projections
- **Followers (Month 1):** ${analysis.growthStrategy?.projections?.followers?.month1 || 'N/A'}
- **Followers (Month 6):** ${analysis.growthStrategy?.projections?.followers?.month6 || 'N/A'}
- **Revenue (Year 1):** ${analysis.growthStrategy?.projections?.revenue?.year1 || 'N/A'}`;

    // Recommendations section
    const immediateRecs = Array.isArray(analysis.recommendations?.immediate)
      ? analysis.recommendations.immediate.map((rec: string) =>
          `- ${rec}`
        ).join('\n')
      : 'No immediate recommendations available';

    const shortTermRecs = Array.isArray(analysis.recommendations?.shortTerm)
      ? analysis.recommendations.shortTerm.map((rec: string) =>
          `- ${rec}`
        ).join('\n')
      : 'No short-term recommendations available';

    const recommendations = `## Recommendations

### Immediate Actions
${immediateRecs}

### Short-Term Actions
${shortTermRecs}`;

    // Combine all sections
    return `${contentStrategy}\n\n${platformStrategy}\n\n${productionPlan}\n\n${growthStrategy}\n\n${recommendations}`;
  } catch (error) {
    console.error('Error formatting analysis:', error);

    // Provide more detailed error information
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = `${error.name}: ${error.message}`;
      if (error.stack) {
        console.error('Stack trace:', error.stack);
      }
    }

    // Fallback to raw JSON if rendering fails
    try {
      return `## Analysis Results (Raw Data)

### Error
${errorMessage}

### Data
\`\`\`json\n${JSON.stringify(analysis, null, 2)}\n\`\`\``;
    } catch (jsonError) {
      return `## Analysis Results

Error formatting analysis: ${errorMessage}

Additional error: Could not stringify analysis data: ${jsonError instanceof Error ? jsonError.message : 'Unknown JSON error'}`;
    }
  }
}