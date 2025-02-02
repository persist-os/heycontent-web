import { 
  EmailMessage, 
  EmailAnalysis, 
  BusinessContext, 
  CommunicationInsights, 
  RelationshipDynamics, 
  ActionableIntelligence, 
  StrategicImplications,
  ExpertResponse,
  ExpertAnalysis
} from '../types/email';
import { EmailMemoryManager } from '../memory/types';
import { ThreadManagementService } from './thread-management';
import { getCompletion } from '../utils/openai';

export class ExpertEmailAnalysisService {
  constructor(
    private emailMemoryManager: EmailMemoryManager,
    private threadManagementService: ThreadManagementService
  ) {}

  async analyzeEmail(email: EmailMessage, threadHistory?: EmailMessage[]): Promise<EmailAnalysis> {
    // Get ML-powered analysis first
    const mlAnalysis = await this.getMLAnalysis(email, threadHistory);

    const analysis: EmailAnalysis = {
      emailId: email.id,
      businessContext: await this.analyzeBusinessContext(email, threadHistory, mlAnalysis),
      communicationInsights: await this.analyzeCommunicationInsights(email, threadHistory, mlAnalysis),
      relationshipDynamics: await this.analyzeRelationshipDynamics(email, threadHistory, mlAnalysis),
      actionableIntelligence: await this.analyzeActionableIntelligence(email, threadHistory, mlAnalysis),
      strategicImplications: await this.analyzeStrategicImplications(email, threadHistory, mlAnalysis)
    };

    return analysis;
  }

  private async getMLAnalysis(email: EmailMessage, threadHistory?: EmailMessage[]) {
    const prompt = `Analyze this email and its thread history for business insights. Provide analysis in JSON format.

Email:
From: ${email.from}
To: ${email.to.join(', ')}
Subject: ${email.subject}
Body: ${email.body}

${threadHistory ? `Thread History:
${threadHistory.map(e => `
From: ${e.from}
To: ${e.to.join(', ')}
Subject: ${e.subject}
Body: ${e.body}
`).join('\n')}` : ''}

Analyze for:
1. Business context and goals
2. Communication patterns and sentiment
3. Relationship dynamics
4. Action items and decisions
5. Strategic implications

Return in this JSON format:
{
  "businessContext": {
    "goals": string[],
    "stakeholders": string[],
    "projects": string[],
    "risks": string[]
  },
  "communication": {
    "style": string,
    "sentiment": string,
    "keyTopics": string[],
    "engagementLevel": string
  },
  "relationships": {
    "dynamics": string,
    "strength": number,
    "keyInteractions": string[]
  },
  "actions": {
    "immediate": string[],
    "decisions": string[],
    "followUp": boolean
  },
  "strategy": {
    "opportunities": string[],
    "risks": string[],
    "recommendations": string[]
  }
}`;

    try {
      const response = await getCompletion([
        { role: 'system', content: 'You are an expert business email analyzer. Always return valid JSON.' },
        { role: 'user', content: prompt }
      ], {
        model: 'gpt-4-1106-preview',
        temperature: 0.7,
        response_format: { type: "json_object" }
      });

      return JSON.parse(response);
    } catch (error) {
      console.error('Error getting ML analysis:', error);
      return null;
    }
  }

  private async analyzeBusinessContext(email: EmailMessage, threadHistory?: EmailMessage[], mlAnalysis?: any): Promise<BusinessContext> {
    const combinedText = this.getCombinedText(email, threadHistory);
    
    // Combine ML insights with rule-based analysis
    const mlContext = mlAnalysis?.businessContext || {};
    
    return {
      projectsInvolved: [...new Set([
        ...this.extractProjects(combinedText),
        ...(mlContext.projects || [])
      ])],
      businessUnits: [...new Set([
        ...this.extractBusinessUnits(combinedText),
        ...(mlContext.stakeholders?.filter((s: string) => s.includes('team') || s.includes('department')) || [])
      ])],
      stakeholders: [...new Set([
        ...this.extractStakeholders(email, threadHistory),
        ...(mlContext.stakeholders || [])
      ])],
      businessGoals: [...new Set([
        ...this.extractBusinessGoals(combinedText),
        ...(mlContext.goals || [])
      ])],
      riskFactors: [...new Set([
        ...this.extractRiskFactors(combinedText),
        ...(mlContext.risks || [])
      ])],
      budgetImplications: this.extractBudgetImplications(combinedText)
    };
  }

  private async analyzeCommunicationInsights(email: EmailMessage, threadHistory?: EmailMessage[], mlAnalysis?: any): Promise<CommunicationInsights> {
    // Combine ML insights with rule-based analysis
    const mlComm = mlAnalysis?.communication || {};
    
    return {
      communicationStyle: mlComm.style || this.analyzeCommunicationStyle(email.body),
      responsePatterns: this.analyzeResponsePatterns(email, threadHistory),
      sentimentTrends: {
        overall: mlComm.sentiment || this.analyzeSentiment(email.body),
        recentTrend: this.calculateSentimentTrend([email, ...(threadHistory || [])].map(e => mlComm.sentiment || this.analyzeSentiment(e.body))),
        keyIndicators: mlComm.keyTopics || this.extractSentimentIndicators(email.body)
      },
      collaborationMetrics: {
        teamEngagement: mlComm.engagementLevel || this.calculateTeamEngagement([email, ...(threadHistory || [])]),
        crossFunctionalInteractions: this.extractBusinessUnits(this.getCombinedText(email, threadHistory)),
        decisionMakingEfficiency: this.calculateDecisionEfficiency([email, ...(threadHistory || [])])
      },
      engagementLevel: mlComm.engagementLevel || this.calculateTeamEngagement([email, ...(threadHistory || [])])
    };
  }

  private async analyzeRelationshipDynamics(email: EmailMessage, threadHistory?: EmailMessage[], mlAnalysis?: any): Promise<RelationshipDynamics> {
    // Combine ML insights with rule-based analysis
    const mlRel = mlAnalysis?.relationships || {};
    
    return {
      relationshipStrength: mlRel.strength || this.calculateRelationshipStrength(email, threadHistory),
      interactionHistory: {
        ...this.analyzeInteractionHistory(email, threadHistory),
        keyInteractions: [...new Set([
          ...this.extractKeyInteractions(email, threadHistory),
          ...(mlRel.keyInteractions || [])
        ])]
      },
      stakeholderInfluence: this.analyzeStakeholderInfluence(email),
      collaborationPatterns: this.analyzeCollaborationPatterns(email, threadHistory),
      collaborationHistory: {
        successfulProjects: this.countSuccessfulProjects(email, threadHistory),
        challengingInteractions: this.countChallengingInteractions(email, threadHistory)
      }
    };
  }

  private async analyzeActionableIntelligence(email: EmailMessage, threadHistory?: EmailMessage[], mlAnalysis?: any): Promise<ActionableIntelligence> {
    // Combine ML insights with rule-based analysis
    const mlActions = mlAnalysis?.actions || {};
    
    return {
      immediateActions: [...new Set([
        ...this.extractImmediateActions(email),
        ...(mlActions.immediate || []).map((action: string) => ({
          task: action,
          priority: this.determinePriority(action),
          deadline: this.extractDeadline(action) || 'Not specified'
        }))
      ])],
      decisions: [...new Set([
        ...this.extractDecisions(email, threadHistory),
        ...(mlActions.decisions || []).map((decision: string) => ({
          type: this.categorizeDecision(decision),
          status: this.determineDecisionStatus(decision),
          nextSteps: this.identifyNextSteps(decision)
        }))
      ])],
      followUpRequired: mlActions.followUp || this.analyzeFollowUpRequirements(email),
      decisionPoints: this.extractDecisionPoints(email.body).map(point => ({
        topic: point,
        status: this.determineDecisionStatus(point)
      }))
    };
  }

  private async analyzeStrategicImplications(email: EmailMessage, threadHistory?: EmailMessage[], mlAnalysis?: any): Promise<StrategicImplications> {
    // Combine ML insights with rule-based analysis
    const mlStrategy = mlAnalysis?.strategy || {};
    
    return {
      businessOpportunities: [...new Set([
        ...this.identifyOpportunities(email, threadHistory),
        ...(mlStrategy.opportunities || [])
      ])],
      potentialChallenges: [...new Set([
        ...this.assessRisks(email, threadHistory),
        ...(mlStrategy.risks || [])
      ])],
      recommendedActions: [...new Set([
        ...this.generateRecommendations(email, threadHistory),
        ...(mlStrategy.recommendations || [])
      ])],
      alignmentWithGoals: this.assessGoalAlignment(email)
    };
  }

  // Helper methods for text analysis
  private getCombinedText(email: EmailMessage, threadHistory?: EmailMessage[]): string {
    const texts = [email.subject, email.body];
    if (threadHistory) {
      texts.push(...threadHistory.map(e => `${e.subject} ${e.body}`));
    }
    return texts.join(' ');
  }

  private extractProjects(text: string): string[] {
    const projectPatterns = [
      /project[s]?\s*[:|-]?\s*([^.,;]+)/gi,
      /(?:working on|involved in)\s+([^.,;]+)/gi
    ];
    return this.extractMatchingPatterns(text, projectPatterns);
  }

  private extractBusinessUnits(text: string): string[] {
    const unitPatterns = [
      /(?:department|team|division|unit)[s]?\s*[:|-]?\s*([^.,;]+)/gi,
      /(?:from|with)\s+the\s+([^.,;]+)\s+(?:team|department|division|unit)/gi
    ];
    return this.extractMatchingPatterns(text, unitPatterns);
  }

  private extractStakeholders(email: EmailMessage, threadHistory?: EmailMessage[]): string[] {
    const stakeholders = new Set<string>();
    stakeholders.add(this.formatEmailAddress(email.from));
    email.to.forEach(to => stakeholders.add(this.formatEmailAddress(to)));
    if (email.cc) email.cc.forEach(cc => stakeholders.add(this.formatEmailAddress(cc)));
    
    if (threadHistory) {
      threadHistory.forEach(e => {
        stakeholders.add(this.formatEmailAddress(e.from));
        e.to.forEach(to => stakeholders.add(this.formatEmailAddress(to)));
        if (e.cc) e.cc.forEach(cc => stakeholders.add(this.formatEmailAddress(cc)));
      });
    }

    return Array.from(stakeholders);
  }

  private formatEmailAddress(email: string): string {
    const match = email.match(/<(.+?)>/) ?? [null, email];
    return match[1].toLowerCase();
  }

  // Continue with other helper methods...
  private extractMatchingPatterns(text: string, patterns: RegExp[]): string[] {
    const matches = new Set<string>();
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        if (match[1]) matches.add(match[1].trim());
      }
    });
    return Array.from(matches);
  }

  // Add implementations for remaining methods...
  private extractBusinessGoals(text: string): string[] {
    const goalPatterns = [
      /goals?[s]?\s*[:|-]?\s*([^.,;]+)/gi,
      /objectives?[s]?\s*[:|-]?\s*([^.,;]+)/gi,
      /aiming to\s+([^.,;]+)/gi
    ];
    return this.extractMatchingPatterns(text, goalPatterns);
  }

  private extractRiskFactors(text: string): string[] {
    const riskPatterns = [
      /risk[s]?\s*[:|-]?\s*([^.,;]+)/gi,
      /concern[s]?\s*[:|-]?\s*([^.,;]+)/gi,
      /(?:potential|possible)\s+(?:issue|problem)[s]?\s*[:|-]?\s*([^.,;]+)/gi
    ];
    return this.extractMatchingPatterns(text, riskPatterns);
  }

  private extractBudgetImplications(text: string): string[] {
    const budgetPatterns = [
      /budget[s]?\s*[:|-]?\s*([^.,;]+)/gi,
      /cost[s]?\s*[:|-]?\s*([^.,;]+)/gi,
      /(?:financial|monetary)\s+impact[s]?\s*[:|-]?\s*([^.,;]+)/gi
    ];
    return this.extractMatchingPatterns(text, budgetPatterns);
  }

  // Add remaining method implementations as needed...

  // Helper methods for BusinessContext
  private analyzeCommunicationStyle(body: string): string {
    const formalPatterns = /dear|sincerely|regards|respectfully|pursuant|accordingly/gi;
    const casualPatterns = /hey|hi|hello|thanks|cheers|bye/gi;
    const directPatterns = /need|must|should|asap|urgent|immediately/gi;
    
    const formalCount = (body.match(formalPatterns) || []).length;
    const casualCount = (body.match(casualPatterns) || []).length;
    const directCount = (body.match(directPatterns) || []).length;
    
    if (formalCount > casualCount) return 'Formal';
    if (directCount > formalCount && directCount > casualCount) return 'Direct';
    return 'Casual';
  }

  private analyzeResponsePatterns(email: EmailMessage, threadHistory?: EmailMessage[]): {
    averageResponseTime: string;
    consistencyScore: number;
    engagementLevel: string;
  } {
    if (!threadHistory?.length) {
      return {
        averageResponseTime: 'N/A',
        consistencyScore: 1,
        engagementLevel: 'Initial Contact'
      };
    }

    // Calculate average response time
    const responseTimes: number[] = [];
    for (let i = 1; i < threadHistory.length; i++) {
      const timeDiff = threadHistory[i].date.getTime() - threadHistory[i-1].date.getTime();
      responseTimes.push(timeDiff);
    }
    
    const avgTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const avgHours = Math.round(avgTime / (1000 * 60 * 60));
    
    // Calculate consistency score (0-1)
    const stdDev = Math.sqrt(
      responseTimes.reduce((sq, n) => sq + Math.pow(n - avgTime, 2), 0) / responseTimes.length
    );
    const consistencyScore = Math.max(0, Math.min(1, 1 - (stdDev / avgTime)));

    // Determine engagement level
    let engagementLevel = 'Medium';
    if (avgHours <= 24 && consistencyScore > 0.7) engagementLevel = 'High';
    if (avgHours >= 72 || consistencyScore < 0.3) engagementLevel = 'Low';

    return {
      averageResponseTime: `${avgHours} hours`,
      consistencyScore,
      engagementLevel
    };
  }

  private analyzeSentiment(text: string): string {
    const positiveScore = (text.match(/thank|appreciate|great|good|excellent|perfect|happy|pleased/gi) || []).length;
    const negativeScore = (text.match(/sorry|issue|problem|concern|wrong|bad|unfortunate/gi) || []).length;
    
    if (positiveScore > negativeScore) return 'positive';
    if (negativeScore > positiveScore) return 'negative';
    return 'neutral';
  }

  private calculateSentimentTrend(sentiments: string[]): string {
    if (sentiments.length < 2) return 'Stable';
    const recent = sentiments.slice(-3);
    if (recent.every(s => s === 'positive')) return 'Improving';
    if (recent.every(s => s === 'negative')) return 'Declining';
    return 'Mixed';
  }

  private extractSentimentIndicators(text: string): string[] {
    const indicators = [];
    if (text.match(/thank|appreciate|great|excellent/gi)) indicators.push('Positive Appreciation');
    if (text.match(/urgent|asap|immediate/gi)) indicators.push('Time Sensitivity');
    if (text.match(/concern|issue|problem/gi)) indicators.push('Concerns Raised');
    if (text.match(/agree|approve|accept/gi)) indicators.push('Agreement');
    return indicators;
  }

  private analyzeSentimentScore(text: string): number {
    const sentiment = this.analyzeSentiment(text);
    switch (sentiment) {
      case 'positive': return 0.8;
      case 'negative': return 0.2;
      default: return 0.5;
    }
  }

  private calculateEngagementScore(emails: EmailMessage[]): number {
    const factors = {
      frequency: Math.min(1, emails.length / 10),
      responseLength: this.calculateAverageResponseLength(emails),
      participantDiversity: this.calculateParticipantDiversity(emails)
    };
    
    return Object.values(factors).reduce((a, b) => a + b, 0) / Object.keys(factors).length;
  }

  private calculateAverageResponseLength(emails: EmailMessage[]): number {
    const avgLength = emails.reduce((sum, email) => sum + email.body.length, 0) / emails.length;
    return Math.min(1, avgLength / 1000); // Normalize to 0-1
  }

  private calculateParticipantDiversity(emails: EmailMessage[]): number {
    const uniqueParticipants = new Set(
      emails.flatMap(email => [email.from, ...email.to])
    );
    return Math.min(1, uniqueParticipants.size / 5); // Normalize to 0-1
  }

  private calculateTeamEngagement(emails: EmailMessage[]): string {
    const engagementScore = this.calculateEngagementScore(emails);
    if (engagementScore > 0.7) return 'High';
    if (engagementScore > 0.4) return 'Medium';
    return 'Low';
  }

  private calculateDecisionEfficiency(emails: EmailMessage[]): string {
    const decisionPoints = emails
      .map(e => this.extractDecisionPoints(e.body))
      .flat();
    
    if (decisionPoints.length === 0) return 'No decisions required';
    
    const resolvedDecisions = decisionPoints
      .filter(d => this.determineDecisionStatus(d) === 'Resolved')
      .length;
    
    const efficiency = resolvedDecisions / decisionPoints.length;
    if (efficiency > 0.7) return 'High';
    if (efficiency > 0.4) return 'Medium';
    return 'Low';
  }

  private extractActionItems(text: string): string[] {
    const actionPatterns = [
      /(?:need|should|must) to ([^.,]+)/i,
      /please ([^.,]+)/i,
      /(?:will|going to) ([^.,]+)/i,
      /action required:? ([^.,]+)/i
    ];
    
    return this.extractMatchingPatterns(text, actionPatterns);
  }

  private determinePriority(action: string): 'High' | 'Medium' | 'Low' {
    if (action.match(/urgent|asap|immediate|critical/i)) return 'High';
    if (action.match(/soon|next|follow|important/i)) return 'Medium';
    return 'Low';
  }

  private extractDeadline(text: string): string | null {
    const deadlinePatterns = [
      /by ([^.,]+)/i,
      /due ([^.,]+)/i,
      /before ([^.,]+)/i
    ];
    
    for (const pattern of deadlinePatterns) {
      const match = text.match(pattern);
      if (match?.[1]) return match[1].trim();
    }
    
    return null;
  }

  private extractDecisionPoints(text: string): string[] {
    const decisionPatterns = [
      /decide on ([^.,]+)/i,
      /decision (?:needed|required) for ([^.,]+)/i,
      /approve ([^.,]+)/i,
      /choose (?:between)? ([^.,]+)/i
    ];
    
    return this.extractMatchingPatterns(text, decisionPatterns);
  }

  private categorizeDecision(decision: string): string {
    if (decision.match(/approv/i)) return 'Approval';
    if (decision.match(/select|choose|pick/i)) return 'Selection';
    if (decision.match(/allocat|budget|fund/i)) return 'Resource Allocation';
    if (decision.match(/schedule|timeline|date/i)) return 'Timeline';
    return 'General';
  }

  private determineDecisionStatus(decision: string): string {
    if (decision.match(/approved|accepted|confirmed/i)) return 'Approved';
    if (decision.match(/rejected|declined|denied/i)) return 'Rejected';
    if (decision.match(/pending|awaiting|waiting/i)) return 'Pending';
    if (decision.match(/in progress|reviewing/i)) return 'In Review';
    return 'Open';
  }

  private identifyNextSteps(decision: string): string[] {
    const nextStepPatterns = [
      /next steps?:? ([^.,]+)/i,
      /follow(?:ing)? up with ([^.,]+)/i,
      /will ([^.,]+)/i,
      /plan to ([^.,]+)/i
    ];
    
    return this.extractMatchingPatterns(decision, nextStepPatterns);
  }

  private extractFollowUpItems(text: string): string[] {
    const followUpPatterns = [
      /follow up on ([^.,]+)/i,
      /check (?:on|about) ([^.,]+)/i,
      /monitor ([^.,]+)/i,
      /track ([^.,]+)/i
    ];
    
    return this.extractMatchingPatterns(text, followUpPatterns);
  }

  private extractTimeline(text: string): string | null {
    const timelinePatterns = [
      /by ([^.,]+)/i,
      /within ([^.,]+)/i,
      /(?:in|after) ([^.,]+)/i
    ];
    
    for (const pattern of timelinePatterns) {
      const match = text.match(pattern);
      if (match?.[1]) return match[1].trim();
    }
    
    return null;
  }

  private extractAssignees(email: EmailMessage): string[] {
    return [
      ...email.to,
      ...(email.cc || [])
    ].map(addr => this.formatEmailAddress(addr));
  }

  private determineRole(emailAddress: string): string {
    const address = emailAddress.toLowerCase();
    if (address.includes('ceo') || address.includes('president')) return 'Executive';
    if (address.includes('manager') || address.includes('director')) return 'Manager';
    if (address.includes('lead') || address.includes('head')) return 'Team Lead';
    return 'Team Member';
  }

  private assessImpactLevel(email: EmailMessage): string {
    const role = this.determineRole(email.from);
    const recipients = email.to.length + (email.cc?.length || 0);
    
    if (role === 'Executive' || recipients > 10) return 'High';
    if (role === 'Manager' || recipients > 5) return 'Medium';
    return 'Low';
  }

  private assessAuthority(email: EmailMessage): string {
    const role = this.determineRole(email.from);
    const text = `${email.subject} ${email.body}`;
    
    if (role === 'Executive' || text.match(/approve|authorize|decide/i)) return 'Final Decision Maker';
    if (role === 'Manager' || text.match(/recommend|suggest|propose/i)) return 'Influencer';
    return 'Contributor';
  }

  private identifyPreferredChannels(email: EmailMessage, threadHistory?: EmailMessage[]): string[] {
    const channels = new Set<string>();
    channels.add('Email');
    
    const allEmails = threadHistory ? [...threadHistory, email] : [email];
    const combinedText = this.getCombinedText(email, threadHistory);
    
    if (combinedText.match(/call|phone|dial/i)) channels.add('Phone');
    if (combinedText.match(/meet|meeting|discuss in person/i)) channels.add('Meetings');
    if (combinedText.match(/slack|chat|message/i)) channels.add('Chat');
    
    return Array.from(channels);
  }

  private calculateMeetingFrequency(email: EmailMessage, threadHistory?: EmailMessage[]): string {
    const combinedText = this.getCombinedText(email, threadHistory);
    const meetingMatches = combinedText.match(/meet|meeting|discuss|sync|catch up/gi);
    
    if (!meetingMatches) return 'Rare';
    if (meetingMatches.length > 5) return 'Frequent';
    if (meetingMatches.length > 2) return 'Regular';
    return 'Occasional';
  }

  private calculateInteractionFrequency(emails: EmailMessage[]): string {
    if (emails.length < 2) return 'New Contact';
    
    const daysBetween = this.calculateAverageDaysBetween(emails);
    if (daysBetween <= 1) return 'Daily';
    if (daysBetween <= 7) return 'Weekly';
    if (daysBetween <= 30) return 'Monthly';
    return 'Infrequent';
  }

  private calculateAverageDaysBetween(emails: EmailMessage[]): number {
    if (emails.length < 2) return Infinity;
    
    const sortedDates = emails
      .map(e => e.date.getTime())
      .sort((a, b) => a - b);
    
    const differences = [];
    for (let i = 1; i < sortedDates.length; i++) {
      differences.push((sortedDates[i] - sortedDates[i-1]) / (1000 * 60 * 60 * 24));
    }
    
    return differences.reduce((a, b) => a + b, 0) / differences.length;
  }

  private assessInteractionQuality(emails: EmailMessage[]): string {
    const factors = {
      sentiment: this.calculateAverageSentiment(emails),
      engagement: this.calculateEngagementScore(emails),
      responseRate: this.calculateResponseRate(emails)
    };
    
    const averageScore = Object.values(factors).reduce((a, b) => a + b, 0) / Object.keys(factors).length;
    if (averageScore > 0.7) return 'Excellent';
    if (averageScore > 0.5) return 'Good';
    return 'Fair';
  }

  private calculateAverageSentiment(emails: EmailMessage[]): number {
    const sentiments = emails.map(e => this.analyzeSentimentScore(e.body));
    return sentiments.reduce((a, b) => a + b, 0) / sentiments.length;
  }

  private calculateResponseRate(emails: EmailMessage[]): number {
    if (emails.length < 2) return 1;
    
    const threadIds = new Set(emails.map(e => e.threadId));
    const responseRate = emails.length / threadIds.size;
    
    return Math.min(1, responseRate / 3); // Normalize to 0-1
  }

  private identifyOpportunities(email: EmailMessage, threadHistory?: EmailMessage[]): string[] {
    const combinedText = this.getCombinedText(email, threadHistory);
    const opportunityPatterns = [
      /opportunity to ([^.,]+)/i,
      /potential for ([^.,]+)/i,
      /could (?:benefit|improve|enhance) ([^.,]+)/i,
      /suggest(?:ed)? (?:to|that) ([^.,]+)/i,
      /recommend(?:ed)? (?:to|that) ([^.,]+)/i
    ];
    
    return this.extractMatchingPatterns(combinedText, opportunityPatterns);
  }

  private assessRisks(email: EmailMessage, threadHistory?: EmailMessage[]): string[] {
    const combinedText = this.getCombinedText(email, threadHistory);
    const riskPatterns = [
      /risk[s]?\s*[:|-]?\s*([^.,;]+)/gi,
      /concern[s]?\s*[:|-]?\s*([^.,;]+)/gi,
      /(?:potential|possible)\s+(?:issue|problem)[s]?\s*[:|-]?\s*([^.,;]+)/gi,
      /challenge[s]?\s*[:|-]?\s*([^.,;]+)/gi
    ];
    
    return this.extractMatchingPatterns(combinedText, riskPatterns);
  }

  private generateRecommendations(email: EmailMessage, threadHistory?: EmailMessage[]): string[] {
    const recommendations: string[] = [];
    const text = this.getCombinedText(email, threadHistory);

    // Project-based recommendations
    const projects = this.extractProjects(text);
    projects.forEach(project => {
      recommendations.push(`Review progress on ${project}`);
    });

    // Communication-based recommendations
    if (this.analyzeSentiment(text) === 'negative') {
      recommendations.push('Schedule follow-up meeting to address concerns');
    }

    // Action-based recommendations
    const actions = this.extractActionItems(text);
    if (actions.length > 0) {
      recommendations.push('Create action item tracking document');
    }

    // Decision-based recommendations
    const decisions = this.extractDecisionPoints(text);
    if (decisions.length > 0) {
      recommendations.push('Document decisions and share with stakeholders');
    }

    return recommendations;
  }

  private assessGoalAlignment(email: EmailMessage): Array<{
    goal: string;
    alignment: 'high' | 'medium' | 'low';
    gaps: string[];
  }> {
    const goals = this.extractBusinessGoals(this.getCombinedText(email));
    return goals.map(goal => {
      const alignment = this.calculateGoalAlignment(email, goal);
      return {
        goal,
        alignment: alignment >= 0.7 ? 'high' : alignment >= 0.4 ? 'medium' : 'low',
        gaps: this.identifyGoalGaps(email, goal)
      };
    });
  }

  private calculateGoalAlignment(email: EmailMessage, goal: string): number {
    const text = this.getCombinedText(email);
    const goalKeywords = this.extractKeywords(goal);
    const matchingKeywords = goalKeywords.filter(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    );
    return matchingKeywords.length / goalKeywords.length;
  }

  private extractKeywords(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);
  }

  private identifyGoalGaps(email: EmailMessage, goal: string): string[] {
    const gaps: string[] = [];
    const text = this.getCombinedText(email);
    
    // Check for missing resources
    if (!text.match(/budget|resource|funding|team/i)) {
      gaps.push('Resource allocation not discussed');
    }
    
    // Check for missing timeline
    if (!text.match(/deadline|timeline|schedule|date/i)) {
      gaps.push('Timeline not specified');
    }
    
    // Check for missing responsibilities
    if (!text.match(/responsible|assign|owner|lead/i)) {
      gaps.push('Responsibilities not assigned');
    }
    
    // Check for missing metrics
    if (!text.match(/metric|measure|track|success|kpi/i)) {
      gaps.push('Success metrics not defined');
    }
    
    return gaps;
  }

  private categorizeOpportunity(opportunity: string): string {
    if (opportunity.match(/revenue|sales|profit|income/i)) return 'Revenue Generation';
    if (opportunity.match(/cost|save|reduce|efficiency/i)) return 'Cost Optimization';
    if (opportunity.match(/process|workflow|automation/i)) return 'Process Improvement';
    if (opportunity.match(/partner|alliance|collaboration/i)) return 'Partnership';
    if (opportunity.match(/market|customer|segment/i)) return 'Market Expansion';
    return 'General Improvement';
  }

  private assessOpportunityImpact(opportunity: string): string {
    const impactIndicators = {
      high: /significant|substantial|major|critical|huge/i,
      medium: /moderate|considerable|notable|good/i,
      low: /minor|small|minimal|slight/i
    };

    if (opportunity.match(impactIndicators.high)) return 'High Impact';
    if (opportunity.match(impactIndicators.medium)) return 'Medium Impact';
    if (opportunity.match(impactIndicators.low)) return 'Low Impact';
    return 'Impact To Be Determined';
  }

  private determineTimeframe(text: string): string {
    if (text.match(/immediate|urgent|asap|today|now/i)) return 'Immediate';
    if (text.match(/this (?:week|month)|soon|shortly/i)) return 'Short-term';
    if (text.match(/next (?:quarter|year)|long-term|future/i)) return 'Long-term';
    return 'Timeline To Be Determined';
  }

  private categorizeRisk(risk: string): string {
    if (risk.match(/security|breach|hack|data|privacy/i)) return 'Security Risk';
    if (risk.match(/budget|cost|financial|funding/i)) return 'Financial Risk';
    if (risk.match(/schedule|deadline|delay|time/i)) return 'Timeline Risk';
    if (risk.match(/quality|performance|reliability/i)) return 'Quality Risk';
    if (risk.match(/scope|requirement|change/i)) return 'Scope Risk';
    return 'Operational Risk';
  }

  private assessRiskSeverity(risk: string): string {
    const severityIndicators = {
      high: /critical|severe|major|significant|urgent/i,
      medium: /moderate|considerable|important/i,
      low: /minor|minimal|negligible/i
    };

    if (risk.match(severityIndicators.high)) return 'High';
    if (risk.match(severityIndicators.medium)) return 'Medium';
    if (risk.match(severityIndicators.low)) return 'Low';
    return 'To Be Assessed';
  }

  private suggestMitigationSteps(risk: string): string[] {
    const steps: string[] = [];
    
    if (this.categorizeRisk(risk) === 'Security Risk') {
      steps.push('Review security protocols', 'Conduct security assessment', 'Update security measures');
    } else if (this.categorizeRisk(risk) === 'Financial Risk') {
      steps.push('Review budget allocation', 'Identify cost-saving opportunities', 'Create contingency fund');
    } else if (this.categorizeRisk(risk) === 'Timeline Risk') {
      steps.push('Review project timeline', 'Identify critical path', 'Add buffer time');
    } else if (this.categorizeRisk(risk) === 'Quality Risk') {
      steps.push('Implement quality checks', 'Review quality standards', 'Enhance monitoring');
    } else if (this.categorizeRisk(risk) === 'Scope Risk') {
      steps.push('Review requirements', 'Define clear boundaries', 'Establish change control');
    } else {
      steps.push('Monitor situation', 'Create contingency plan', 'Regular status updates');
    }
    
    return steps;
  }

  private calculateRelationshipStrength(email: EmailMessage, threadHistory?: EmailMessage[]): number {
    if (!threadHistory?.length) return 0.5; // Neutral for new relationships
    
    const factors = {
      historyLength: Math.min(1, threadHistory.length / 10),
      responseRate: this.analyzeResponsePatterns(email, threadHistory).consistencyScore,
      sentiment: this.analyzeSentimentScore(this.getCombinedText(email, threadHistory)),
      engagement: this.calculateEngagementScore(threadHistory)
    };
    
    return Object.values(factors).reduce((a, b) => a + b, 0) / Object.keys(factors).length;
  }

  private analyzeInteractionHistory(email: EmailMessage, threadHistory?: EmailMessage[]): {
    frequency: string;
    quality: string;
    lastInteraction: Date;
  } {
    const allEmails = threadHistory ? [...threadHistory, email] : [email];
    const latestDate = new Date(Math.max(...allEmails.map(e => e.date.getTime())));
    
    return {
      frequency: this.calculateInteractionFrequency(allEmails),
      quality: this.assessInteractionQuality(allEmails),
      lastInteraction: latestDate
    };
  }

  private extractKeyInteractions(email: EmailMessage, threadHistory?: EmailMessage[]): string[] {
    const allEmails = threadHistory ? [...threadHistory, email] : [email];
    return allEmails
      .filter(e => this.isSignificantInteraction(e))
      .map(e => `${this.determineInteractionType(e)} (${e.date.toLocaleDateString()})`);
  }

  private isSignificantInteraction(email: EmailMessage): boolean {
    const text = `${email.subject} ${email.body}`;
    return text.match(/agree|approve|decide|confirm|important|urgent|critical/i) !== null;
  }

  private determineInteractionType(email: EmailMessage): string {
    const text = `${email.subject} ${email.body}`.toLowerCase();
    if (text.match(/agree|approve|accept/)) return 'Agreement';
    if (text.match(/decide|decision/)) return 'Decision';
    if (text.match(/meet|discuss/)) return 'Meeting';
    if (text.match(/update|status/)) return 'Update';
    return 'General';
  }

  private analyzeStakeholderInfluence(email: EmailMessage): {
    role: string;
    impactLevel: string;
    decisionMakingAuthority: string;
  } {
    return {
      role: this.determineRole(email.from),
      impactLevel: this.assessImpactLevel(email),
      decisionMakingAuthority: this.assessAuthority(email)
    };
  }

  private analyzeCollaborationPatterns(email: EmailMessage, threadHistory?: EmailMessage[]): {
    preferredChannels: string[];
    meetingFrequency: string;
    responseStyle: string;
  } {
    return {
      preferredChannels: this.identifyPreferredChannels(email, threadHistory),
      meetingFrequency: this.calculateMeetingFrequency(email, threadHistory),
      responseStyle: this.analyzeCommunicationStyle(email.body)
    };
  }

  private extractImmediateActions(email: EmailMessage): {
    task: string;
    priority: 'High' | 'Medium' | 'Low';
    deadline: string;
  }[] {
    const actions = this.extractActionItems(email.body);
    return actions.map(action => ({
      task: action,
      priority: this.determinePriority(action),
      deadline: this.extractDeadline(action) || 'Not specified'
    }));
  }

  private extractDecisions(email: EmailMessage, threadHistory?: EmailMessage[]): {
    type: string;
    status: string;
    nextSteps: string[];
  }[] {
    const decisions = this.extractDecisionPoints(email.body);
    return decisions.map(decision => ({
      type: this.categorizeDecision(decision),
      status: this.determineDecisionStatus(decision),
      nextSteps: this.identifyNextSteps(decision)
    }));
  }

  private analyzeFollowUpRequirements(email: EmailMessage): boolean {
    const text = `${email.subject} ${email.body}`.toLowerCase();
    return text.match(/follow.?up|get.?back|respond|reply|confirm/i) !== null;
  }

  private countSuccessfulProjects(email: EmailMessage, threadHistory?: EmailMessage[]): number {
    const text = this.getCombinedText(email, threadHistory);
    const successPatterns = [
      /successful(?:ly)?\s+complet(?:ed|ion)/gi,
      /project\s+success/gi,
      /milestone\s+achieved/gi
    ];
    
    return successPatterns.reduce((count, pattern) => 
      count + (text.match(pattern)?.length || 0), 0);
  }

  private countChallengingInteractions(email: EmailMessage, threadHistory?: EmailMessage[]): number {
    const text = this.getCombinedText(email, threadHistory);
    const challengePatterns = [
      /challeng(?:e|ing)/gi,
      /difficult(?:y|ies)/gi,
      /problem(?:s|atic)/gi,
      /concern(?:s|ing)/gi
    ];
    
    return challengePatterns.reduce((count, pattern) => 
      count + (text.match(pattern)?.length || 0), 0);
  }
} 