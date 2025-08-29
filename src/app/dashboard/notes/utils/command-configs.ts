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
  // Things On My Mind - Space for whatever's floating around in your head
  idea_bank: {
    quickCommands: [
      {
        id: 'trend-mining',
        label: 'What\'s everyone talking about lately?',
        description: 'See what\'s on people\'s minds in your space right now',
        icon: createIcon(TrendingUp),
        category: 'Explore'
      },
      {
        id: 'audience-question-harvest',
        label: 'What are people asking me about?',
        description: 'Look at what questions keep coming up from people who follow you',
        icon: createIcon(MessageCircle),
        category: 'Explore'
      },
      {
        id: 'competitor-gap-finder',
        label: 'What\'s not being talked about yet?',
        description: 'Find topics that people care about but aren\'t seeing much of',
        icon: createIcon(Search),
        category: 'Explore'
      },
      {
        id: 'viral-concept-builder',
        label: 'How can I make this really resonate?',
        description: 'Take something you\'re thinking about and make it connect with people',
        icon: createIcon(Zap),
        category: 'Develop'
      },
      {
        id: 'series-multiplier',
        label: 'How can I explore this from different angles?',
        description: 'Take one thing on your mind and look at it from multiple perspectives',
        icon: createIcon(Layers),
        category: 'Develop'
      },
      {
        id: 'signature-series-creator',
        label: 'How can I turn this into something I\'m known for?',
        description: 'Take something you keep coming back to and make it your thing',
        icon: createIcon(Star),
        category: 'Develop'
      },
      {
        id: 'seasonal-calendar',
        label: 'What should I be thinking about in the coming months?',
        description: 'Look ahead at what might be on people\'s minds seasonally',
        icon: createIcon(Calendar),
        category: 'Plan'
      },
      {
        id: 'pain-point-miner',
        label: 'What\'s bothering people that I could help with?',
        description: 'Think about the struggles people have that you understand',
        icon: createIcon(AlertTriangle),
        category: 'Explore'
      },
      {
        id: 'hook-variations',
        label: 'How can I grab attention right away?',
        description: 'Come up with different ways to draw people in from the start',
        icon: createIcon(Megaphone),
        category: 'Develop'
      },
      {
        id: 'engagement-bait',
        label: 'How can I get people talking about this?',
        description: 'Think about what would make people want to respond or share',
        icon: createIcon(MessageSquare),
        category: 'Develop'
      }
    ],
    defaultPrompts: [
      'Research the top 10 trending topics in [my niche] right now and create 15 unique content angles I can own. Focus on topics gaining momentum in the last 30 days that align with my expertise. For each trend, give me: the core trend, why it\'s gaining traction, my unique angle, and 3 specific content ideas with hooks.',
      'Analyze my last 100 comments, DMs, and community interactions to identify the top 10 questions my audience keeps asking. Turn each question into a viral content concept with: the question reframed as a hook, the core answer, 3 supporting points, and a call-to-action that drives engagement.',
      'Find 5 major content gaps in my space that successful people aren\'t covering yet. Research my top 10 competitors and identify: topics they\'re missing, angles they haven\'t explored, formats they\'re not using, and audience pain points they\'re not addressing. Give me specific content ideas for each gap.',
      'Take this basic idea: [IDEA] and transform it into a viral concept designed for maximum shareability. Include: 5 scroll-stopping hook variations, emotional triggers that drive shares, pattern interrupts to maintain attention, and specific calls-to-action for comments, saves, and shares.',
      'Transform this single concept: [CONCEPT] into a 10-part content series. Each piece should have: a unique hook that works standalone, a specific angle or sub-topic, optimal length for platform, and strategic sequencing to keep viewers coming back for more.',
      'Turn this concept: [CONCEPT] into a signature series that becomes my trademark content. Design a recurring format with: a memorable series name and branding, consistent format structure (intro, main content, outro), weekly/monthly schedule that\'s sustainable, 12 episode topics that build on each other, unique visual elements and catchphrases, audience participation elements, monetization opportunities (sponsorships, products, courses), and a content calendar for the first quarter. Make this series so uniquely mine that when people see this format, they immediately think of me.',
      'Create a detailed 3-month content calendar around upcoming trends, holidays, and seasonal moments. Include: specific posting dates, trend-based content ideas, holiday tie-ins for my niche, seasonal emotional triggers, and backup content for algorithm changes.'
    ],
    categories: ['Explore', 'Develop', 'Plan']
  },

  // Things I'm Writing Out - When you need to get your thoughts organized and flowing
  content_script: {
    quickCommands: [
      {
        id: 'full-script-creator',
        label: 'Can you help me write this out completely?',
        description: 'Turn your thoughts into something clear and flowing',
        icon: createIcon(FileText),
        category: 'Write'
      },
      {
        id: 'hook-generator',
        label: 'How can I start this in a way that draws people in?',
        description: 'Come up with different opening approaches that feel natural',
        icon: createIcon(Megaphone),
        category: 'Write'
      },
      {
        id: 'retention-booster',
        label: 'How can I keep people interested all the way through?',
        description: 'Make sure your writing holds people\'s attention naturally',
        icon: createIcon(Activity),
        category: 'Polish'
      },
      {
        id: 'platform-adapter',
        label: 'How should I adjust this for different places?',
        description: 'Adapt your writing for where people will see it',
        icon: createIcon(RefreshCw),
        category: 'Polish'
      },
      {
        id: 'hashtag-researcher',
        label: 'What tags would help people find this?',
        description: 'Think about what people search for when looking for this topic',
        icon: createIcon(Hash),
        category: 'Polish'
      },
      {
        id: 'cta-psychology',
        label: 'How should I end this to get people to respond?',
        description: 'Figure out the right way to invite people to engage',
        icon: createIcon(Target),
        category: 'Polish'
      },
      {
        id: 'thumbnail-concepts',
        label: 'What image would make people curious?',
        description: 'Think about what visual would make someone want to look closer',
        icon: createIcon(Camera),
        category: 'Polish'
      },
      {
        id: 'story-structure',
        label: 'How can I tell this like a story?',
        description: 'Give your writing a natural flow that draws people along',
        icon: createIcon(BookOpen),
        category: 'Write'
      },
      {
        id: 'algorithm-optimization',
        label: 'How can I help more people see this?',
        description: 'Think about what helps things get discovered naturally',
        icon: createIcon(Settings),
        category: 'Polish'
      }
    ],
    defaultPrompts: [
      'Write a complete script from this concept: [CONCEPT]. Structure it with: a scroll-stopping hook in the first 3 seconds, natural flow that maintains attention, specific examples and concrete details, strategic pattern interrupts every 15-20 seconds, and a strong call-to-action. Make it sound conversational and authentic, like I\'m talking to my best friend.',
      'Create 10 different hook variations for this content: [CONTENT TOPIC]. Each hook should: stop scrollers within 3 seconds, create curiosity or urgency, be under 10 words, work without sound, and rank them by scroll-stopping potential. Include visual, text, and verbal hook options.',
      'Add retention tactics to keep viewers watching till the end. Include: curiosity gaps every 15 seconds, pattern interrupts (questions, surprises, conflicts), preview of what\'s coming, emotional peaks and valleys, and a payoff that rewards full viewing. Prevent drop-offs at typical exit points.',
      'Adapt this script for multiple platforms with specific requirements: TikTok (15-60 seconds, trending audio, fast pace), Instagram Reels (30-90 seconds, save-worthy), YouTube Shorts (under 60 seconds, loop potential), and Twitter (text + video, news angle). Maintain core message while optimizing for each platform\'s algorithm.',
      'Research 20 hashtags my specific audience actually follows and engages with. Avoid basic trending tags and find: niche-specific hashtags with 10K-500K posts, community hashtags my audience uses, location-based tags if relevant, branded hashtags from related people, and mix of broad/medium/specific reach. Include engagement rates for each.',
      'Write 5 different calls-to-action using psychology that will drive the specific engagement I want: [DESIRED ACTION]. Use persuasion principles like social proof, scarcity, reciprocity, and authority. Make each CTA feel natural, not pushy, and include specific language that triggers action.',
      'Generate 5 thumbnail concepts that would make someone stop mid-scroll and click. Consider: high contrast colors, emotional faces, clear text overlay (under 6 words), curiosity-inducing elements, and platform-specific dimensions. Rank by click-through potential and explain the psychology behind each.'
    ],
    categories: ['Write', 'Polish']
  },

  // Things About People I Care About - Keep track of relationships and connections that matter
  collaboration_note: {
    quickCommands: [
      {
        id: 'scope-definer',
        label: 'How can I be clear about what I\'ll do?',
        description: 'Set boundaries so everyone knows what to expect',
        icon: createIcon(Shield),
        category: 'Boundaries'
      },
      {
        id: 'rate-calculator',
        label: 'What\'s fair for me to ask for this?',
        description: 'Figure out what makes sense based on what you bring to this',
        icon: createIcon(DollarSign),
        category: 'Value'
      },
      {
        id: 'contract-reviewer',
        label: 'What should I look out for in this agreement?',
        description: 'Spot things that might not work in your favor',
        icon: createIcon(Eye),
        category: 'Boundaries'
      },
      {
        id: 'timeline-setter',
        label: 'How long should this reasonably take?',
        description: 'Set a timeline that works for everyone involved',
        icon: createIcon(Clock),
        category: 'Planning'
      },
      {
        id: 'payment-securer',
        label: 'How can I make sure I get paid on time?',
        description: 'Set up payment terms that protect you',
        icon: createIcon(CheckCircle),
        category: 'Value'
      },
      {
        id: 'brand-alignment-checker',
        label: 'Does this feel right for me?',
        description: 'Think about whether this fits with who you are',
        icon: createIcon(UserCheck),
        category: 'Reflection'
      },
      {
        id: 'usage-rights-negotiator',
        label: 'What should I keep control of?',
        description: 'Think about what ownership and usage rights matter to you',
        icon: createIcon(FileCheck),
        category: 'Boundaries'
      },
      {
        id: 'deliverable-breakdown',
        label: 'How should I organize what I\'ll deliver?',
        description: 'Break down the work into clear pieces everyone understands',
        icon: createIcon(List),
        category: 'Planning'
      }
    ],
    defaultPrompts: [
      'Break this collaboration into specific, measurable deliverables to prevent scope creep. For each deliverable, define: exact specifications (dimensions, length, format), delivery timeline with milestones, revision rounds included (max 2-3), approval process and timeframes, and what\'s NOT included. Create bulletproof language that protects against "just one more thing" requests.',
      'Calculate fair pricing for this collaboration. I have [X] followers, [Y]% engagement rate, [Z] average views, in the [NICHE] space. Research: industry standard rates for my metrics, value of deliverables requested, usage rights and exclusivity, timeline and rush fees, and comparable people rates. Provide a rate range with justification.',
      'Review this contract and flag terms I should negotiate to protect myself. Look for: payment timeline and late fees, content ownership and usage rights, exclusivity clauses, cancellation terms, liability limitations, revision limits, approval processes, and any language that favors the brand unfairly. Suggest specific negotiations.',
      'Create a realistic timeline for this project with proper buffer time. Account for: initial concept development, first draft creation, brand feedback and revisions (2-3 rounds), final approvals, and content delivery. Add 20-30% buffer time for delays and build in milestone checkpoints for payment and approval.',
      'Structure payment terms to protect against late payment and scope creep. Recommend: 50% upfront payment, milestone payments tied to deliverables, final payment on delivery, late payment fees (2-5% per week), kill fee if project cancelled, and additional charges for scope changes. Include specific payment timeline language.',
      'Analyze if this brand partnership aligns with my values and audience expectations. Consider: brand reputation and controversies, product quality and price point, target audience overlap, message alignment with my content, long-term relationship potential, and impact on my credibility. Provide a recommendation with reasoning.'
    ],
    categories: ['Boundaries', 'Value', 'Reflection', 'Planning']
  },

  // What I Don't Want to Forget - Hold onto something you learned or figured out
  analytics_insight: {
    quickCommands: [
      {
        id: 'revenue-connector',
        label: 'What\'s actually working to bring in money?',
        description: 'Connect what you\'re doing to what\'s paying off',
        icon: createIcon(DollarSign),
        category: 'Understanding'
      },
      {
        id: 'drop-off-analyzer',
        label: 'Why are people losing interest?',
        description: 'Figure out where and why people stop paying attention',
        icon: createIcon(BarChart),
        category: 'Learning'
      },
      {
        id: 'audience-profiler',
        label: 'Who really connects with what I\'m doing?',
        description: 'Understand the people who genuinely care about your work',
        icon: createIcon(UserCheck),
        category: 'Understanding'
      },
      {
        id: 'competitor-benchmarker',
        label: 'How am I doing compared to others?',
        description: 'See how your efforts stack up against similar people',
        icon: createIcon(BarChart3),
        category: 'Learning'
      },
      {
        id: 'roi-calculator',
        label: 'What gives me the best return on my time?',
        description: 'Figure out which efforts are worth the energy you put in',
        icon: createIcon(Percent),
        category: 'Understanding'
      },
      {
        id: 'growth-forecaster',
        label: 'Where am I headed if I keep this up?',
        description: 'Get a sense of what to expect based on how things are going',
        icon: createIcon(TrendingUp),
        category: 'Learning'
      },
      {
        id: 'engagement-optimizer',
        label: 'How can I get people more involved?',
        description: 'Find ways to get more genuine responses and sharing',
        icon: createIcon(Activity),
        category: 'Understanding'
      },
      {
        id: 'monetization-spotter',
        label: 'What opportunities am I not seeing?',
        description: 'Spot chances to turn your work into income you might be missing',
        icon: createIcon(Star),
        category: 'Understanding'
      }
    ],
    defaultPrompts: [
      'Analyze my content from the last 90 days and identify which pieces directly led to revenue opportunities. Connect specific posts/videos to: brand deal inquiries, product sales, email signups, course purchases, speaking opportunities, and affiliate commissions. Create a revenue attribution model showing which content types and topics drive the most monetary value.',
      'Analyze my drop-off points and explain why viewers are leaving at those specific moments. Look for patterns in: hook effectiveness (first 3-5 seconds), content pacing and flow, topic transition points, call-to-action placement, content length vs. topic complexity, and seasonal/timing factors. Provide specific fixes for each drop-off pattern.',
      'Profile my most engaged followers to understand who they are and what they want more of. Analyze: demographics and interests, content they engage with most, topics that drive their comments, sharing behavior patterns, purchase indicators, and content requests. Create an ideal follower persona and content strategy to attract more like them.',
      'Compare my performance metrics to successful people in my niche over the last 6 months. Benchmark: follower growth rate, engagement rates by platform, content frequency and consistency, monetization strategies, audience overlap, and content performance patterns. Identify where I\'m ahead, behind, and opportunities to differentiate.',
      'Calculate ROI for different content types to identify what gives the best return on time invested. Measure: time spent creating vs. engagement received, reach per hour of work, monetization potential by format, production costs vs. performance, and long-term value creation. Recommend optimal content mix for maximum ROI.',
      'Based on my current growth patterns and industry trends, predict where my metrics will be in 6 months. Forecast: follower growth trajectory, engagement rate trends, content performance evolution, monetization potential, market opportunities, and potential challenges. Include best-case, realistic, and conservative scenarios.'
    ],
    categories: ['Understanding', 'Learning']
  },

  // Trying to Figure Something Out - When you need space to work through something complicated
  reflection_journal: {
    quickCommands: [
      {
        id: 'win-highlighter',
        label: 'What good things am I not noticing?',
        description: 'Look for progress and wins you might be taking for granted',
        icon: createIcon(Award),
        category: 'Perspective'
      },
      {
        id: 'lesson-extractor',
        label: 'What can I take away from this difficult thing?',
        description: 'Find the useful lessons hidden in challenges',
        icon: createIcon(Lightbulb),
        category: 'Learning'
      },
      {
        id: 'pattern-spotter',
        label: 'What patterns do I notice in how I work?',
        description: 'See the cycles in your energy, creativity, and productivity',
        icon: createIcon(Activity),
        category: 'Understanding'
      },
      {
        id: 'burnout-detector',
        label: 'Am I getting overwhelmed?',
        description: 'Check if you\'re pushing too hard and need to slow down',
        icon: createIcon(AlertTriangle),
        category: 'Self-Care'
      },
      {
        id: 'goal-realigner',
        label: 'Do my goals still feel right?',
        description: 'Think about whether what you\'re aiming for still makes sense',
        icon: createIcon(Target),
        category: 'Reflection'
      },
      {
        id: 'confidence-tracker',
        label: 'What helps me feel confident vs. what doesn\'t?',
        description: 'Notice what builds you up and what tears you down',
        icon: createIcon(TrendingUp),
        category: 'Self-Care'
      },
      {
        id: 'energy-analyzer',
        label: 'When do I feel most like myself?',
        description: 'Notice when you\'re at your best creatively and personally',
        icon: createIcon(Gauge),
        category: 'Understanding'
      },
      {
        id: 'relationship-evaluator',
        label: 'How are the people I work with affecting me?',
        description: 'Think about how different relationships impact your work and mood',
        icon: createIcon(Users),
        category: 'Reflection'
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
    categories: ['Perspective', 'Learning', 'Understanding', 'Self-Care', 'Reflection']
  },

  // Things I Need to Handle - Sort out what needs to get done so you don't forget anything important
  task_checklist: {
    quickCommands: [
      {
        id: 'revenue-prioritizer',
        label: 'Which of these things actually matter?',
        description: 'Figure out what\'s worth your time and energy',
        icon: createIcon(DollarSign),
        category: 'Focus'
      },
      {
        id: 'batch-optimizer',
        label: 'How can I group these together?',
        description: 'Organize similar things so you can handle them at once',
        icon: createIcon(Layers),
        category: 'Organization'
      },
      {
        id: 'delegation-spotter',
        label: 'What can I let someone else handle?',
        description: 'Find things you can hand off, automate, or just skip',
        icon: createIcon(Users),
        category: 'Simplify'
      },
      {
        id: 'content-scheduler',
        label: 'How can I turn these into a simple schedule?',
        description: 'Organize your tasks into a rhythm that feels manageable',
        icon: createIcon(Calendar),
        category: 'Organization'
      },
      {
        id: 'energy-matcher',
        label: 'When do I have energy for each type of thing?',
        description: 'Match tasks to when you naturally feel up for them',
        icon: createIcon(Gauge),
        category: 'Organization'
      },
      {
        id: 'milestone-creator',
        label: 'How can I break this into smaller wins?',
        description: 'Turn big overwhelming things into smaller victories',
        icon: createIcon(CheckCircle),
        category: 'Motivation'
      },
      {
        id: 'time-estimator',
        label: 'How long will these really take?',
        description: 'Be honest about time so you don\'t overcommit yourself',
        icon: createIcon(Clock),
        category: 'Planning'
      },
      {
        id: 'procrastination-breaker',
        label: 'How can I stop putting these off?',
        description: 'Break down the things you keep avoiding into easier pieces',
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
    categories: ['Focus', 'Organization', 'Simplify', 'Planning', 'Motivation']
  },

  // Things I'm Writing Out - When you need to get your thoughts organized and flowing clearly
  email_draft: {
    quickCommands: [
      {
        id: 'brand-inquiry-responder',
        label: 'How should I respond to this?',
        description: 'Write a response that feels professional but still like you',
        icon: createIcon(Mail),
        category: 'Writing'
      },
      {
        id: 'rate-negotiator',
        label: 'How can I ask for what I\'m worth?',
        description: 'Stand up for fair payment in a way that feels confident',
        icon: createIcon(DollarSign),
        category: 'Value'
      },
      {
        id: 'polite-decliner',
        label: 'How can I say no nicely?',
        description: 'Turn something down while keeping the relationship good',
        icon: createIcon(X),
        category: 'Boundaries'
      },
      {
        id: 'scope-clarifier',
        label: 'What should I ask to understand this better?',
        description: 'Ask the right questions so everyone\'s on the same page',
        icon: createIcon(FileCheck),
        category: 'Clarity'
      },
      {
        id: 'follow-up-strategist',
        label: 'How can I check in without being pushy?',
        description: 'Follow up in a way that shows interest but gives them space',
        icon: createIcon(Send),
        category: 'Relationship'
      },
      {
        id: 'payment-securer',
        label: 'How can I make sure payment goes smoothly?',
        description: 'Set up payment terms that work for everyone',
        icon: createIcon(Shield),
        category: 'Value'
      },
      {
        id: 'boundary-setter',
        label: 'How can I be clear about my limits?',
        description: 'Communicate what you can and can\'t do in a friendly way',
        icon: createIcon(Target),
        category: 'Boundaries'
      },
      {
        id: 'value-communicator',
        label: 'How can I show what I bring without sounding boastful?',
        description: 'Share your strengths in a way that feels natural',
        icon: createIcon(Award),
        category: 'Value'
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
    categories: ['Writing', 'Value', 'Boundaries', 'Clarity', 'Relationship']
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