import React from 'react';
import { 
  Lightbulb, 
  FileText, 
  Users, 
  BarChart3, 
  BookOpen, 
  CheckSquare, 
  Mail,
  Brain,
  Table,
  List,
  Heading1,
  Heading2,
  Heading3,
  Clock,
  Target,
  Zap,
  Hash,
  Megaphone,
  TrendingUp,
  MessageSquare,
  Calendar,
  FileCheck,
  Sparkles,
  Send,
  Edit3,
  Eye,
  Timer,
  Star,
  AlertTriangle,
  CheckCircle,
  Palette,
  Volume2,
  DollarSign,
  Shield,
  Scissors,
  Copy,
  RefreshCw,
  ArrowUp,
  Search,
  Layers,
  UserCheck,
  MessageCircle,
  PlayCircle,
  BarChart,
  Activity,
  Gauge,
  Percent,
  Award,
  Briefcase,
  Settings,
  Camera,
  X
} from 'lucide-react';

// Re-export existing types for consistency
export interface CommandOption {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
  requiresInput?: boolean;
  category?: string;
}

export interface TypeSpecificConfig {
  quickCommands: Omit<CommandOption, 'action'>[];
  defaultPrompts: string[];
  categories: string[];
}

export type NoteType = 
  | 'idea_bank' 
  | 'content_script' 
  | 'collaboration_note' 
  | 'analytics_insight' 
  | 'reflection_journal' 
  | 'task_checklist' 
  | 'email_draft';

// Helper function to create icon components
const createIcon = (IconComponent: React.ComponentType<{ className?: string }>) => 
  React.createElement(IconComponent, { className: "w-4 h-4" });

// GENERATION COMMANDS - Create new content from scratch
export const NOTE_TYPE_CONFIGS: Record<NoteType, TypeSpecificConfig> = {
  // Idea Bank - Turn blank page into content goldmine
  idea_bank: {
    quickCommands: [
      {
        id: 'trend-mining',
        label: 'What\'s trending in my niche right now?',
        description: 'Research current hot topics and trending conversations in your space',
        icon: createIcon(TrendingUp),
        category: 'Research'
      },
      {
        id: 'audience-question-harvest',
        label: 'What questions is my audience asking?',
        description: 'Analyze your comments, DMs, and community to find common questions',
        icon: createIcon(MessageCircle),
        category: 'Research'
      },
      {
        id: 'competitor-gap-finder',
        label: 'What content gaps can I find and own?',
        description: 'Identify topics and angles other creators in your space aren\'t covering',
        icon: createIcon(Search),
        category: 'Research'
      },
      {
        id: 'viral-concept-builder',
        label: 'How can I make this idea go viral?',
        description: 'Transform your concept to maximize shareability and engagement',
        icon: createIcon(Zap),
        category: 'Generate'
      },
      {
        id: 'series-multiplier',
        label: 'How can I turn this into 10 pieces of content?',
        description: 'Expand one concept into multiple pieces with different angles',
        icon: createIcon(Layers),
        category: 'Generate'
      },
      {
        id: 'signature-series-creator',
        label: 'How can I turn this into a signature series?',
        description: 'Build a recurring, branded content series that becomes your trademark',
        icon: createIcon(Star),
        category: 'Generate'
      },
      {
        id: 'seasonal-calendar',
        label: 'What should I post in the next 3 months?',
        description: 'Plan upcoming content around trends, holidays, and seasonal moments',
        icon: createIcon(Calendar),
        category: 'Plan'
      },
      {
        id: 'pain-point-miner',
        label: 'What problems can I solve with content?',
        description: 'Identify your audience\'s biggest struggles and frustrations',
        icon: createIcon(AlertTriangle),
        category: 'Research'
      },
      {
        id: 'hook-variations',
        label: 'How can I hook viewers in the first 3 seconds?',
        description: 'Create multiple scroll-stopping opening options to test',
        icon: createIcon(Megaphone),
        category: 'Generate'
      },
      {
        id: 'engagement-bait',
        label: 'How can I get more comments and shares?',
        description: 'Design content that naturally encourages engagement and sharing',
        icon: createIcon(MessageSquare),
        category: 'Generate'
      }
    ],
    defaultPrompts: [
      'Research the top 10 trending topics in [my niche] right now and create 15 unique content angles I can own. Focus on topics gaining momentum in the last 30 days that align with my expertise. For each trend, give me: the core trend, why it\'s gaining traction, my unique angle, and 3 specific content ideas with hooks.',
      'Analyze my last 100 comments, DMs, and community interactions to identify the top 10 questions my audience keeps asking. Turn each question into a viral content concept with: the question reframed as a hook, the core answer, 3 supporting points, and a call-to-action that drives engagement.',
      'Find 5 major content gaps in my space that successful creators aren\'t covering yet. Research my top 10 competitors and identify: topics they\'re missing, angles they haven\'t explored, formats they\'re not using, and audience pain points they\'re not addressing. Give me specific content ideas for each gap.',
      'Take this basic idea: [IDEA] and transform it into a viral concept designed for maximum shareability. Include: 5 scroll-stopping hook variations, emotional triggers that drive shares, pattern interrupts to maintain attention, and specific calls-to-action for comments, saves, and shares.',
      'Transform this single concept: [CONCEPT] into a 10-part content series. Each piece should have: a unique hook that works standalone, a specific angle or sub-topic, optimal length for platform, and strategic sequencing to keep viewers coming back for more.',
      'Turn this concept: [CONCEPT] into a signature series that becomes my trademark content. Design a recurring format with: a memorable series name and branding, consistent format structure (intro, main content, outro), weekly/monthly schedule that\'s sustainable, 12 episode topics that build on each other, unique visual elements and catchphrases, audience participation elements, monetization opportunities (sponsorships, products, courses), and a content calendar for the first quarter. Make this series so uniquely mine that when people see this format, they immediately think of me.',
      'Create a detailed 3-month content calendar around upcoming trends, holidays, and seasonal moments. Include: specific posting dates, trend-based content ideas, holiday tie-ins for my niche, seasonal emotional triggers, and backup content for algorithm changes.'
    ],
    categories: ['Research', 'Generate', 'Plan']
  },

  // Content Script - From concept to scroll-stopping content
  content_script: {
    quickCommands: [
      {
        id: 'full-script-creator',
        label: 'Can you write the full script for this concept?',
        description: 'Create a complete, engaging script with natural flow',
        icon: createIcon(FileText),
        category: 'Create'
      },
      {
        id: 'hook-generator',
        label: 'What are 10 ways to hook viewers immediately?',
        description: 'Generate multiple opening options to grab attention fast',
        icon: createIcon(Megaphone),
        category: 'Create'
      },
      {
        id: 'retention-booster',
        label: 'How can I keep people watching till the end?',
        description: 'Add tactics to maintain attention and prevent drop-offs',
        icon: createIcon(Activity),
        category: 'Optimize'
      },
      {
        id: 'platform-adapter',
        label: 'How do I adapt this for different platforms?',
        description: 'Reformat content for TikTok, Instagram, YouTube, and Twitter',
        icon: createIcon(RefreshCw),
        category: 'Adapt'
      },
      {
        id: 'hashtag-researcher',
        label: 'What hashtags will my audience actually use?',
        description: 'Find hashtags your specific followers engage with',
        icon: createIcon(Hash),
        category: 'Optimize'
      },
      {
        id: 'cta-psychology',
        label: 'What call-to-action will actually get results?',
        description: 'Create CTAs that drive the specific action you want',
        icon: createIcon(Target),
        category: 'Optimize'
      },
      {
        id: 'thumbnail-concepts',
        label: 'What thumbnail would make people stop scrolling?',
        description: 'Design thumbnail ideas that grab attention and get clicks',
        icon: createIcon(Camera),
        category: 'Create'
      },
      {
        id: 'story-structure',
        label: 'How can I structure this as a compelling story?',
        description: 'Apply storytelling frameworks to maximize engagement',
        icon: createIcon(BookOpen),
        category: 'Create'
      },
      {
        id: 'algorithm-optimization',
        label: 'How can I optimize this for the algorithm?',
        description: 'Apply platform-specific optimization for maximum reach',
        icon: createIcon(Settings),
        category: 'Optimize'
      }
    ],
    defaultPrompts: [
      'Write a complete script from this concept: [CONCEPT]. Structure it with: a scroll-stopping hook in the first 3 seconds, natural flow that maintains attention, specific examples and concrete details, strategic pattern interrupts every 15-20 seconds, and a strong call-to-action. Make it sound conversational and authentic, like I\'m talking to my best friend.',
      'Create 10 different hook variations for this content: [CONTENT TOPIC]. Each hook should: stop scrollers within 3 seconds, create curiosity or urgency, be under 10 words, work without sound, and rank them by scroll-stopping potential. Include visual, text, and verbal hook options.',
      'Add retention tactics to keep viewers watching till the end. Include: curiosity gaps every 15 seconds, pattern interrupts (questions, surprises, conflicts), preview of what\'s coming, emotional peaks and valleys, and a payoff that rewards full viewing. Prevent drop-offs at typical exit points.',
      'Adapt this script for multiple platforms with specific requirements: TikTok (15-60 seconds, trending audio, fast pace), Instagram Reels (30-90 seconds, save-worthy), YouTube Shorts (under 60 seconds, loop potential), and Twitter (text + video, news angle). Maintain core message while optimizing for each platform\'s algorithm.',
      'Research 20 hashtags my specific audience actually follows and engages with. Avoid basic trending tags and find: niche-specific hashtags with 10K-500K posts, community hashtags my audience uses, location-based tags if relevant, branded hashtags from related creators, and mix of broad/medium/specific reach. Include engagement rates for each.',
      'Write 5 different calls-to-action using psychology that will drive the specific engagement I want: [DESIRED ACTION]. Use persuasion principles like social proof, scarcity, reciprocity, and authority. Make each CTA feel natural, not pushy, and include specific language that triggers action.',
      'Generate 5 thumbnail concepts that would make someone stop mid-scroll and click. Consider: high contrast colors, emotional faces, clear text overlay (under 6 words), curiosity-inducing elements, and platform-specific dimensions. Rank by click-through potential and explain the psychology behind each.'
    ],
    categories: ['Create', 'Optimize', 'Adapt']
  },

  // Collaboration Note - Protect your brand and get paid fairly
  collaboration_note: {
    quickCommands: [
      {
        id: 'scope-definer',
        label: 'How can I prevent scope creep on this project?',
        description: 'Define clear boundaries and deliverables to protect yourself',
        icon: createIcon(Shield),
        category: 'Protect'
      },
      {
        id: 'rate-calculator',
        label: 'What should I charge for this collaboration?',
        description: 'Calculate fair pricing based on your metrics and market rates',
        icon: createIcon(DollarSign),
        category: 'Money'
      },
      {
        id: 'contract-reviewer',
        label: 'What red flags should I watch for in this contract?',
        description: 'Identify terms you need to negotiate to protect your interests',
        icon: createIcon(Eye),
        category: 'Protect'
      },
      {
        id: 'timeline-setter',
        label: 'What\'s a realistic timeline for this project?',
        description: 'Set deadlines that account for revisions and approval cycles',
        icon: createIcon(Clock),
        category: 'Plan'
      },
      {
        id: 'payment-securer',
        label: 'How can I protect myself from late payments?',
        description: 'Structure payment terms and late fees to secure payment',
        icon: createIcon(CheckCircle),
        category: 'Money'
      },
      {
        id: 'brand-alignment-checker',
        label: 'Does this partnership align with my brand?',
        description: 'Evaluate if this collaboration fits your values and audience',
        icon: createIcon(UserCheck),
        category: 'Strategy'
      },
      {
        id: 'usage-rights-negotiator',
        label: 'What usage rights should I retain?',
        description: 'Understand and negotiate content ownership and usage terms',
        icon: createIcon(FileCheck),
        category: 'Protect'
      },
      {
        id: 'deliverable-breakdown',
        label: 'How should I break down these deliverables?',
        description: 'Structure work into clear, measurable components',
        icon: createIcon(List),
        category: 'Plan'
      }
    ],
    defaultPrompts: [
      'Break this collaboration into specific, measurable deliverables to prevent scope creep. For each deliverable, define: exact specifications (dimensions, length, format), delivery timeline with milestones, revision rounds included (max 2-3), approval process and timeframes, and what\'s NOT included. Create bulletproof language that protects against "just one more thing" requests.',
      'Calculate fair pricing for this collaboration. I have [X] followers, [Y]% engagement rate, [Z] average views, in the [NICHE] space. Research: industry standard rates for my metrics, value of deliverables requested, usage rights and exclusivity, timeline and rush fees, and comparable creator rates. Provide a rate range with justification.',
      'Review this contract and flag terms I should negotiate to protect myself. Look for: payment timeline and late fees, content ownership and usage rights, exclusivity clauses, cancellation terms, liability limitations, revision limits, approval processes, and any language that favors the brand unfairly. Suggest specific negotiations.',
      'Create a realistic timeline for this project with proper buffer time. Account for: initial concept development, first draft creation, brand feedback and revisions (2-3 rounds), final approvals, and content delivery. Add 20-30% buffer time for delays and build in milestone checkpoints for payment and approval.',
      'Structure payment terms to protect against late payment and scope creep. Recommend: 50% upfront payment, milestone payments tied to deliverables, final payment on delivery, late payment fees (2-5% per week), kill fee if project cancelled, and additional charges for scope changes. Include specific payment timeline language.',
      'Analyze if this brand partnership aligns with my values and audience expectations. Consider: brand reputation and controversies, product quality and price point, target audience overlap, message alignment with my content, long-term relationship potential, and impact on my credibility. Provide a recommendation with reasoning.'
    ],
    categories: ['Protect', 'Money', 'Strategy', 'Plan']
  },

  // Analytics Insight - Turn data into revenue decisions
  analytics_insight: {
    quickCommands: [
      {
        id: 'revenue-connector',
        label: 'Which content is actually making me money?',
        description: 'Connect your metrics to actual revenue and monetization',
        icon: createIcon(DollarSign),
        category: 'Money'
      },
      {
        id: 'drop-off-analyzer',
        label: 'Why are people leaving my content early?',
        description: 'Identify exactly where and why viewers are dropping off',
        icon: createIcon(BarChart),
        category: 'Performance'
      },
      {
        id: 'audience-profiler',
        label: 'Who are my best followers and what do they want?',
        description: 'Understand your most engaged audience and their preferences',
        icon: createIcon(UserCheck),
        category: 'Audience'
      },
      {
        id: 'competitor-benchmarker',
        label: 'How do I compare to other creators in my space?',
        description: 'Benchmark your performance against similar creators',
        icon: createIcon(BarChart3),
        category: 'Strategy'
      },
      {
        id: 'roi-calculator',
        label: 'What content gives me the best ROI?',
        description: 'Identify which content types give the best return on effort',
        icon: createIcon(Percent),
        category: 'Money'
      },
      {
        id: 'growth-forecaster',
        label: 'Where will my metrics be in 6 months?',
        description: 'Predict your growth trajectory based on current trends',
        icon: createIcon(TrendingUp),
        category: 'Strategy'
      },
      {
        id: 'engagement-optimizer',
        label: 'How can I boost my engagement rate?',
        description: 'Find specific ways to increase comments, shares, and saves',
        icon: createIcon(Activity),
        category: 'Performance'
      },
      {
        id: 'monetization-spotter',
        label: 'What monetization opportunities am I missing?',
        description: 'Identify revenue opportunities you might be overlooking',
        icon: createIcon(Star),
        category: 'Money'
      }
    ],
    defaultPrompts: [
      'Analyze my content from the last 90 days and identify which pieces directly led to revenue opportunities. Connect specific posts/videos to: brand deal inquiries, product sales, email signups, course purchases, speaking opportunities, and affiliate commissions. Create a revenue attribution model showing which content types and topics drive the most monetary value.',
      'Analyze my drop-off points and explain why viewers are leaving at those specific moments. Look for patterns in: hook effectiveness (first 3-5 seconds), content pacing and flow, topic transition points, call-to-action placement, content length vs. topic complexity, and seasonal/timing factors. Provide specific fixes for each drop-off pattern.',
      'Profile my most engaged followers to understand who they are and what they want more of. Analyze: demographics and interests, content they engage with most, topics that drive their comments, sharing behavior patterns, purchase indicators, and content requests. Create an ideal follower persona and content strategy to attract more like them.',
      'Compare my performance metrics to successful creators in my niche over the last 6 months. Benchmark: follower growth rate, engagement rates by platform, content frequency and consistency, monetization strategies, audience overlap, and content performance patterns. Identify where I\'m ahead, behind, and opportunities to differentiate.',
      'Calculate ROI for different content types to identify what gives the best return on time invested. Measure: time spent creating vs. engagement received, reach per hour of work, monetization potential by format, production costs vs. performance, and long-term value creation. Recommend optimal content mix for maximum ROI.',
      'Based on my current growth patterns and industry trends, predict where my metrics will be in 6 months. Forecast: follower growth trajectory, engagement rate trends, content performance evolution, monetization potential, market opportunities, and potential challenges. Include best-case, realistic, and conservative scenarios.'
    ],
    categories: ['Money', 'Performance', 'Audience', 'Strategy']
  },

  // Reflection Journal - Learn from wins and setbacks
  reflection_journal: {
    quickCommands: [
      {
        id: 'win-highlighter',
        label: 'What progress am I not celebrating enough?',
        description: 'Identify wins and growth you might be overlooking',
        icon: createIcon(Award),
        category: 'Growth'
      },
      {
        id: 'lesson-extractor',
        label: 'What can I learn from this setback?',
        description: 'Extract valuable lessons and insights from challenges',
        icon: createIcon(Lightbulb),
        category: 'Learning'
      },
      {
        id: 'pattern-spotter',
        label: 'What patterns do I see in my creative process?',
        description: 'Identify cycles in your creativity, productivity, and energy',
        icon: createIcon(Activity),
        category: 'Insight'
      },
      {
        id: 'burnout-detector',
        label: 'Am I showing signs of burnout?',
        description: 'Check for early warning signs affecting your content',
        icon: createIcon(AlertTriangle),
        category: 'Wellness'
      },
      {
        id: 'goal-realigner',
        label: 'Do my goals still make sense?',
        description: 'Evaluate if your objectives align with what you\'ve learned',
        icon: createIcon(Target),
        category: 'Strategy'
      },
      {
        id: 'confidence-tracker',
        label: 'What builds vs. kills my creative confidence?',
        description: 'Understand what impacts your creative confidence',
        icon: createIcon(TrendingUp),
        category: 'Growth'
      },
      {
        id: 'energy-analyzer',
        label: 'When am I most creative and productive?',
        description: 'Map your optimal creative and work patterns',
        icon: createIcon(Gauge),
        category: 'Insight'
      },
      {
        id: 'relationship-evaluator',
        label: 'How are my collaborations affecting my work?',
        description: 'Assess how business relationships impact your creativity',
        icon: createIcon(Users),
        category: 'Strategy'
      }
    ],
    defaultPrompts: [
      'Help me identify progress I\'ve made this month that I might be undervaluing or taking for granted. Look for: skill improvements that have become automatic, follower quality increases, brand perception shifts, content creation efficiency gains, financial progress (even small), and personal growth markers. Celebrate these wins properly.',
      'Analyze what went wrong with this situation: [SITUATION] and extract valuable lessons for future success. Break down: what factors I could control vs. couldn\'t, decision points where different choices might have helped, external factors that influenced the outcome, skills or knowledge gaps revealed, and specific actions to prevent similar issues.',
      'Identify patterns in my creative process, productivity cycles, and energy levels over the past 3 months. Look for: times of day when I\'m most creative, content types that energize vs. drain me, external factors that boost/hurt performance, seasonal or cyclical changes, and optimal work rhythms. Use this to optimize my schedule.',
      'Assess whether I\'m showing early burnout signs and what I should change to protect my energy and creativity. Check for: decreased enthusiasm for content creation, quality decline in work, increased procrastination, physical exhaustion, cynicism about the industry, and social withdrawal. Provide specific recovery strategies.',
      'Based on what I\'ve learned about myself and my audience over the past 6 months, how should I adjust my goals and priorities? Consider: what\'s working better than expected, what\'s harder than anticipated, new opportunities that have emerged, personal values shifts, and market changes. Realign goals with reality.',
      'Analyze what consistently builds vs. undermines my creative confidence over time. Identify: types of feedback that motivate vs. discourage, comparison triggers that hurt confidence, content creation activities that boost self-belief, external validation dependencies, and internal confidence sources. Build a confidence protection plan.'
    ],
    categories: ['Growth', 'Learning', 'Insight', 'Wellness', 'Strategy']
  },

  // Task Checklist - Stop drowning in busywork
  task_checklist: {
    quickCommands: [
      {
        id: 'revenue-prioritizer',
        label: 'Which tasks will actually make me money?',
        description: 'Identify and prioritize tasks by direct revenue impact',
        icon: createIcon(DollarSign),
        category: 'Priority'
      },
      {
        id: 'batch-optimizer',
        label: 'How can I group these tasks efficiently?',
        description: 'Organize similar tasks into focused work sessions',
        icon: createIcon(Layers),
        category: 'Efficiency'
      },
      {
        id: 'delegation-spotter',
        label: 'What should I stop doing myself?',
        description: 'Find tasks to delegate, automate, or eliminate',
        icon: createIcon(Users),
        category: 'Strategy'
      },
      {
        id: 'content-scheduler',
        label: 'How do I turn tasks into a content calendar?',
        description: 'Transform your task list into a strategic content schedule',
        icon: createIcon(Calendar),
        category: 'Plan'
      },
      {
        id: 'energy-matcher',
        label: 'When should I do each type of task?',
        description: 'Match tasks to your natural energy levels throughout the day',
        icon: createIcon(Gauge),
        category: 'Efficiency'
      },
      {
        id: 'milestone-creator',
        label: 'How can I break this into motivating wins?',
        description: 'Create celebration checkpoints for big projects',
        icon: createIcon(CheckCircle),
        category: 'Motivation'
      },
      {
        id: 'time-estimator',
        label: 'How long will these actually take?',
        description: 'Get realistic time estimates to prevent overcommitment',
        icon: createIcon(Clock),
        category: 'Plan'
      },
      {
        id: 'procrastination-breaker',
        label: 'How can I stop avoiding these tasks?',
        description: 'Break overwhelming tasks into manageable steps',
        icon: createIcon(Target),
        category: 'Motivation'
      }
    ],
    defaultPrompts: [
      'Reorder these tasks by direct revenue impact, prioritizing money-making activities first. Categorize each task as: immediate revenue (client work, sales activities), medium-term revenue (content creation, lead generation), long-term revenue (relationship building, skill development), or non-revenue (admin, maintenance). Create a priority ranking with revenue potential for each.',
      'Group these tasks into efficient 2-3 hour focused work batches. Organize by: similar energy requirements, shared tools or platforms, related cognitive load, natural workflow sequence, and minimal context switching. Create themed blocks like "Content Creation," "Business Admin," "Engagement & Community," etc.',
      'Identify which tasks I should delegate, automate, or stop doing entirely. For each task, evaluate: my skill level vs. time cost, availability of alternatives (tools, VAs, freelancers), importance to core business, and ROI of doing vs. outsourcing. Provide specific delegation recommendations with cost estimates.',
      'Transform this task list into a strategic content production calendar. Map tasks to: optimal posting times, content pillars and themes, seasonal opportunities, platform-specific requirements, and audience engagement patterns. Create a weekly/monthly rhythm that sustains consistent output.',
      'Organize tasks by optimal energy levels and times of day. Match: high-creativity tasks to peak energy hours, routine admin to low-energy periods, relationship/communication tasks to midday energy, and planning/strategy to fresh morning hours. Account for my natural circadian rhythm and energy patterns.',
      'Break these big goals and projects into weekly milestones worth celebrating. Create: specific achievement markers, reward systems for completion, progress tracking methods, and motivation checkpoints. Make each milestone feel significant enough to maintain momentum without being overwhelming.'
    ],
    categories: ['Priority', 'Efficiency', 'Strategy', 'Plan', 'Motivation']
  },

  // Email Draft - Professional communication that protects your interests
  email_draft: {
    quickCommands: [
      {
        id: 'brand-inquiry-responder',
        label: 'How do I respond to this brand inquiry professionally?',
        description: 'Craft a professional response that protects your interests',
        icon: createIcon(Mail),
        category: 'Response'
      },
      {
        id: 'rate-negotiator',
        label: 'How do I counter this lowball offer?',
        description: 'Negotiate higher rates professionally with data backing',
        icon: createIcon(DollarSign),
        category: 'Negotiate'
      },
      {
        id: 'polite-decliner',
        label: 'How do I say no while keeping doors open?',
        description: 'Decline professionally while maintaining future opportunities',
        icon: createIcon(X),
        category: 'Response'
      },
      {
        id: 'scope-clarifier',
        label: 'What questions should I ask about this project?',
        description: 'Ask strategic questions to clarify scope and prevent issues',
        icon: createIcon(FileCheck),
        category: 'Protect'
      },
      {
        id: 'follow-up-strategist',
        label: 'How do I follow up without seeming desperate?',
        description: 'Write professional follow-ups that show interest, not desperation',
        icon: createIcon(Send),
        category: 'Strategy'
      },
      {
        id: 'payment-securer',
        label: 'How do I secure payment terms upfront?',
        description: 'Lock in favorable payment terms and late fees',
        icon: createIcon(Shield),
        category: 'Protect'
      },
      {
        id: 'boundary-setter',
        label: 'How do I set professional boundaries?',
        description: 'Communicate limits on revisions, timeline, and scope',
        icon: createIcon(Target),
        category: 'Protect'
      },
      {
        id: 'value-communicator',
        label: 'How do I communicate my value without bragging?',
        description: 'Articulate your worth and expertise professionally',
        icon: createIcon(Award),
        category: 'Strategy'
      }
    ],
    defaultPrompts: [
      'Draft a professional response to this brand inquiry that shows genuine interest while protecting my rates and setting proper boundaries. Include: enthusiasm for the brand and project, questions about deliverables and timeline, my rate range with justification, next steps for discussion, and professional tone that establishes credibility without desperation.',
      'Counter this lowball offer professionally using data to justify higher rates. My metrics: [X] followers, [Y]% engagement rate, [Z] average views in [NICHE]. Include: appreciation for the opportunity, market rate research for my level, specific value I bring to their campaign, alternative package options, and willingness to discuss while maintaining rate integrity.',
      'Politely decline this opportunity while keeping doors open for future collaborations that might be a better fit. Include: gratitude for thinking of me, specific reason for declining (timing, fit, budget), alternative suggestions if possible, invitation to connect for future opportunities, and warm, professional tone that maintains the relationship.',
      'Draft strategic questions about this project to clarify scope and prevent misunderstandings. Ask about: specific deliverables and formats, timeline and deadline flexibility, usage rights and exclusivity, budget range and payment terms, revision rounds included, brand guidelines and approval process, and any requirements not mentioned in the initial brief.',
      'Write a follow-up email that shows continued interest without appearing desperate or pushy. Include: reference to previous conversation, brief value reminder, understanding of their timeline, soft inquiry about status, additional relevant work or insights, and professional closing that doesn\'t pressure for immediate response.',
      'Secure favorable payment terms by professionally requesting milestone payments and late fees. Propose: 50% payment upfront before work begins, 50% on final delivery, 5% late fee after 30 days, kill fee if project cancelled, and additional charges for scope changes. Frame as standard business practice, not personal preference.'
    ],
    categories: ['Response', 'Negotiate', 'Protect', 'Strategy']
  }
};

// Universal commands for formatting and organization
export const UNIVERSAL_COMMANDS: Omit<CommandOption, 'action'>[] = [
  // Quick formatting
  {
    id: 'bullet-list',
    label: 'Can you make this into bullet points?',
    description: 'Transform content into scannable bullet points',
    icon: createIcon(List),
    category: 'Format'
  },
  {
    id: 'numbered-list',
    label: 'Can you number these steps?',
    description: 'Turn into sequential, easy-to-follow instructions',
    icon: createIcon(List),
    category: 'Format'
  },
  {
    id: 'add-headers',
    label: 'Can you add section headers?',
    description: 'Break up long content with clear headings for readability',
    icon: createIcon(Heading2),
    category: 'Format'
  },
  {
    id: 'table',
    label: 'Can you organize this into a table?',
    description: 'Structure information in rows and columns for clarity',
    icon: createIcon(Table),
    category: 'Format'
  },
  
  // Content enhancement
  {
    id: 'action-items',
    label: 'What are my specific next steps?',
    description: 'Extract clear, actionable tasks from ideas and discussions',
    icon: createIcon(CheckCircle),
    category: 'Action'
  },
  {
    id: 'summary',
    label: 'Can you summarize the key points?',
    description: 'Create digestible highlights from long content',
    icon: createIcon(FileText),
    category: 'Summarize'
  }
];

// Helper functions
export function getCommandsForNoteType(noteType: NoteType): {
  typeSpecificCommands: Omit<CommandOption, 'action'>[];
  universalCommands: Omit<CommandOption, 'action'>[];
  defaultPrompts: string[];
  categories: string[];
} {
  const config = NOTE_TYPE_CONFIGS[noteType] || NOTE_TYPE_CONFIGS.idea_bank;
  
  return {
    typeSpecificCommands: config.quickCommands,
    universalCommands: UNIVERSAL_COMMANDS,
    defaultPrompts: config.defaultPrompts,
    categories: config.categories
  };
}

export function getPromptsForNoteType(noteType: NoteType): string[] {
  const config = NOTE_TYPE_CONFIGS[noteType] || NOTE_TYPE_CONFIGS.idea_bank;
  return config.defaultPrompts;
}

export function hasTypeSpecificCommand(noteType: NoteType, commandId: string): boolean {
  const config = NOTE_TYPE_CONFIGS[noteType];
  if (!config) return false;
  
  return config.quickCommands.some(cmd => cmd.id === commandId);
}