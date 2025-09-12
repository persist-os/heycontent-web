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
  X,
  Heart
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
  | 'email_draft'
  | 'project';

// Helper function to create icon components
const createIcon = (IconComponent: React.ComponentType<{ className?: string }>) => 
  React.createElement(IconComponent, { className: "w-4 h-4" });

// GENERATION COMMANDS - Create new ideas and approaches
export const NOTE_TYPE_CONFIGS: Record<NoteType, TypeSpecificConfig> = {
  // Ideas - Capture thoughts, concepts, and inspiration
  idea_bank: {
    quickCommands: [
      {
        id: 'idea-starter',
        label: 'Help me brainstorm ideas about',
        description: 'Generate initial thoughts and concepts to explore',
        icon: createIcon(Lightbulb),
        category: 'Generate'
      },
      {
        id: 'curiosity-explorer',
        label: 'What should I learn more about?',
        description: 'Identify interesting areas worth exploring deeper',
        icon: createIcon(Search),
        category: 'Explore'
      },
      {
        id: 'connection-finder',
        label: 'How does this connect to other things I know?',
        description: 'Find relationships between different concepts and ideas',
        icon: createIcon(Layers),
        category: 'Connect'
      },
      {
        id: 'question-generator',
        label: 'What questions should I be asking?',
        description: 'Generate thoughtful questions to guide your thinking',
        icon: createIcon(MessageCircle),
        category: 'Question'
      },
      {
        id: 'perspective-shifter',
        label: 'What are different ways to think about this?',
        description: 'Explore various angles and viewpoints',
        icon: createIcon(RefreshCw),
        category: 'Explore'
      },
      {
        id: 'idea-builder',
        label: 'How can I develop this thought further?',
        description: 'Expand and refine your initial ideas',
        icon: createIcon(Zap),
        category: 'Develop'
      },
      {
        id: 'practical-applications',
        label: 'How could I use or apply this?',
        description: 'Find practical ways to implement or use your ideas',
        icon: createIcon(Target),
        category: 'Apply'
      },
      {
        id: 'research-directions',
        label: 'What should I research next?',
        description: 'Identify specific areas or topics to investigate',
        icon: createIcon(BookOpen),
        category: 'Research'
      },
      {
        id: 'idea-organizer',
        label: 'How can I organize these thoughts?',
        description: 'Structure and categorize your ideas clearly',
        icon: createIcon(List),
        category: 'Organize'
      },
      {
        id: 'future-potential',
        label: 'Where could this lead?',
        description: 'Explore potential outcomes and future possibilities',
        icon: createIcon(TrendingUp),
        category: 'Envision'
      }
    ],
    defaultPrompts: [
      'Help me brainstorm ideas about [topic/area of interest]. Generate diverse concepts and approaches I could explore, including: different angles to consider, interesting questions to investigate, potential connections to other topics, and ways to make this personally meaningful.',
      'I\'m curious about [subject/topic]. Help me identify what aspects would be most interesting to learn about, including: fundamental concepts I should understand, practical applications, current developments, and how this connects to my other interests.',
      'Take this initial thought: [IDEA] and help me develop it further. Explore: what makes this idea interesting, different ways to approach it, potential applications or uses, questions it raises, and how I could explore it more deeply.',
      'I want to understand [concept/topic] better. Help me create a learning plan that includes: key areas to focus on, good starting points, resources to explore, ways to practice or apply what I learn, and how to track my progress.',
      'Help me organize these scattered thoughts about [topic]. Structure them into: main themes or categories, relationships between ideas, areas that need more development, questions to explore further, and next steps for each area.',
      'I\'m interested in [field/subject] but don\'t know where to start. Create a beginner-friendly exploration plan with: foundational concepts to learn first, interesting examples or case studies, hands-on activities to try, and ways to gradually build deeper understanding.',
      'Turn this general interest in [topic] into specific, actionable learning goals. Include: what I want to understand or be able to do, timeline for learning, resources and methods to use, ways to measure progress, and how to stay motivated.'
    ],
    categories: ['Generate', 'Explore', 'Connect', 'Question', 'Develop', 'Apply', 'Research', 'Organize', 'Envision']
  },

  // Writing - Draft and organize written content and documents
  content_script: {
    quickCommands: [
      {
        id: 'writing-starter',
        label: 'Help me start writing about',
        description: 'Get help beginning any piece of writing from scratch',
        icon: createIcon(Edit3),
        category: 'Start'
      },
      {
        id: 'thought-organizer',
        label: 'Help me organize these thoughts clearly',
        description: 'Structure scattered ideas into coherent writing',
        icon: createIcon(List),
        category: 'Organize'
      },
      {
        id: 'clarity-improver',
        label: 'Make this clearer and easier to understand',
        description: 'Improve clarity and readability of your writing',
        icon: createIcon(Eye),
        category: 'Clarity'
      },
      {
        id: 'tone-adjuster',
        label: 'Help me adjust the tone of this',
        description: 'Modify the style and voice to match your needs',
        icon: createIcon(Volume2),
        category: 'Style'
      },
      {
        id: 'structure-builder',
        label: 'How should I structure this piece?',
        description: 'Create a logical flow and organization',
        icon: createIcon(Layers),
        category: 'Structure'
      },
      {
        id: 'conclusion-writer',
        label: 'Help me wrap this up effectively',
        description: 'Create strong, satisfying endings',
        icon: createIcon(Target),
        category: 'Finish'
      },
      {
        id: 'example-generator',
        label: 'Add examples to make this clearer',
        description: 'Include concrete examples and illustrations',
        icon: createIcon(Lightbulb),
        category: 'Enhance'
      },
      {
        id: 'length-adjuster',
        label: 'Make this longer/shorter as needed',
        description: 'Expand or condense your writing appropriately',
        icon: createIcon(Scissors),
        category: 'Edit'
      },
      {
        id: 'format-converter',
        label: 'Convert this to a different format',
        description: 'Transform into essay, letter, report, etc.',
        icon: createIcon(RefreshCw),
        category: 'Format'
      },
      {
        id: 'grammar-checker',
        label: 'Check and improve the grammar',
        description: 'Polish grammar, punctuation, and style',
        icon: createIcon(CheckCircle),
        category: 'Polish'
      }
    ],
    defaultPrompts: [
      'Help me write about [topic/subject]. Start from scratch and create: a clear introduction that explains what this is about, main points organized logically, specific examples to illustrate key ideas, and a conclusion that ties everything together. Make it easy to read and understand.',
      'Take these scattered thoughts about [topic] and help me organize them into coherent writing. Structure them with: clear main themes, logical flow between ideas, smooth transitions, and appropriate depth for each point.',
      'Improve this draft to make it clearer and more engaging. Focus on: simplifying complex sentences, adding concrete examples, improving transitions between paragraphs, and ensuring the main message is clear throughout.',
      'Help me adjust the tone and style of this writing for [specific purpose/audience]. Modify: formality level, vocabulary choices, sentence structure, and overall approach while keeping the core message intact.',
      'Transform this piece into [specific format]: essay, letter, report, summary, etc. Adapt: structure and organization, language and tone, length and detail level, and formatting conventions appropriate for the new format.',
      'Add depth and detail to this writing by including: relevant examples and illustrations, supporting evidence or explanations, personal insights or observations, and connections to related topics or ideas.',
      'Help me conclude this piece effectively. Create an ending that: summarizes the main points, provides closure, leaves the reader with something meaningful to think about, and feels natural and satisfying.'
    ],
    categories: ['Start', 'Organize', 'Clarity', 'Style', 'Structure', 'Finish', 'Enhance', 'Edit', 'Format', 'Polish']
  },

  // People - Track relationships, conversations, and collaboration details
  collaboration_note: {
    quickCommands: [
      {
        id: 'relationship-tracker',
        label: 'Help me remember details about this person',
        description: 'Organize important information about someone',
        icon: createIcon(Users),
        category: 'Remember'
      },
      {
        id: 'conversation-summarizer',
        label: 'Summarize this conversation or interaction',
        description: 'Capture key points from meetings or discussions',
        icon: createIcon(MessageSquare),
        category: 'Record'
      },
      {
        id: 'follow-up-planner',
        label: 'What should I follow up on?',
        description: 'Identify next steps and action items from interactions',
        icon: createIcon(Calendar),
        category: 'Plan'
      },
      {
        id: 'relationship-analyzer',
        label: 'Help me understand this relationship better',
        description: 'Reflect on dynamics and communication patterns',
        icon: createIcon(Brain),
        category: 'Understand'
      },
      {
        id: 'communication-improver',
        label: 'How can I communicate better with this person?',
        description: 'Find ways to improve understanding and connection',
        icon: createIcon(MessageCircle),
        category: 'Improve'
      },
      {
        id: 'conflict-resolver',
        label: 'Help me work through this disagreement',
        description: 'Find constructive approaches to resolve conflicts',
        icon: createIcon(Shield),
        category: 'Resolve'
      },
      {
        id: 'boundary-setter',
        label: 'How can I set healthy boundaries?',
        description: 'Establish clear, respectful limits in relationships',
        icon: createIcon(Target),
        category: 'Boundaries'
      },
      {
        id: 'appreciation-expresser',
        label: 'How can I show appreciation effectively?',
        description: 'Find meaningful ways to express gratitude and recognition',
        icon: createIcon(Star),
        category: 'Connect'
      },
      {
        id: 'collaboration-organizer',
        label: 'How can we work together effectively?',
        description: 'Plan and structure collaborative efforts',
        icon: createIcon(UserCheck),
        category: 'Collaborate'
      },
      {
        id: 'networking-tracker',
        label: 'Track connections and networking opportunities',
        description: 'Organize professional and personal network information',
        icon: createIcon(Layers),
        category: 'Network'
      }
    ],
    defaultPrompts: [
      'Help me organize what I know about [person\'s name]. Include: basic information and background, how we met and our connection, important conversations or interactions, their interests and preferences, things to remember for future interactions, and any follow-up items or commitments.',
      'Summarize this conversation/meeting with [person] and identify key takeaways. Capture: main topics discussed, decisions made or agreements reached, action items for me and for them, important insights or information learned, and any follow-up needed.',
      'Help me reflect on my relationship with [person]. Consider: how our communication works, what I appreciate about them, any challenges or areas for improvement, how we can better support each other, and what I\'ve learned from this relationship.',
      'I had a disagreement with [person] about [topic]. Help me think through: what each person\'s perspective might be, underlying concerns or needs, possible compromises or solutions, how to approach a constructive conversation, and ways to preserve the relationship.',
      'Plan how to collaborate effectively with [person] on [project/goal]. Consider: each person\'s strengths and preferences, how to divide responsibilities, communication methods and frequency, timeline and milestones, and how to handle potential challenges.',
      'Help me prepare for an important conversation with [person] about [topic]. Include: key points I want to communicate, questions I should ask, potential concerns they might have, how to approach this sensitively, and desired outcomes from the discussion.',
      'Organize my network of [professional/personal] connections. For each person, track: how we\'re connected, their background and expertise, ways we might help each other, last interaction and follow-up needed, and opportunities for deeper connection.'
    ],
    categories: ['Remember', 'Record', 'Plan', 'Understand', 'Improve', 'Resolve', 'Boundaries', 'Connect', 'Collaborate', 'Network']
  },

  // Insights - Record important learnings, observations, and discoveries
  analytics_insight: {
    quickCommands: [
      {
        id: 'insight-capturer',
        label: 'Help me capture this important realization',
        description: 'Record and organize a key insight or learning',
        icon: createIcon(Lightbulb),
        category: 'Capture'
      },
      {
        id: 'pattern-identifier',
        label: 'What patterns do I notice?',
        description: 'Identify recurring themes or connections in your observations',
        icon: createIcon(Activity),
        category: 'Analyze'
      },
      {
        id: 'lesson-extractor',
        label: 'What can I learn from this experience?',
        description: 'Extract meaningful lessons from events or situations',
        icon: createIcon(BookOpen),
        category: 'Learn'
      },
      {
        id: 'knowledge-connector',
        label: 'How does this connect to what I already know?',
        description: 'Link new insights to existing knowledge and understanding',
        icon: createIcon(Layers),
        category: 'Connect'
      },
      {
        id: 'application-finder',
        label: 'How can I apply this insight?',
        description: 'Find practical ways to use what you\'ve learned',
        icon: createIcon(Target),
        category: 'Apply'
      },
      {
        id: 'understanding-deepener',
        label: 'Help me understand this more deeply',
        description: 'Explore the implications and nuances of an insight',
        icon: createIcon(Brain),
        category: 'Deepen'
      },
      {
        id: 'mistake-analyzer',
        label: 'What went wrong and why?',
        description: 'Analyze mistakes or failures to extract valuable lessons',
        icon: createIcon(AlertTriangle),
        category: 'Learn'
      },
      {
        id: 'success-analyzer',
        label: 'What made this work well?',
        description: 'Understand the factors behind successful outcomes',
        icon: createIcon(CheckCircle),
        category: 'Analyze'
      },
      {
        id: 'trend-spotter',
        label: 'What trends am I noticing?',
        description: 'Identify developing patterns or changes over time',
        icon: createIcon(TrendingUp),
        category: 'Observe'
      },
      {
        id: 'wisdom-organizer',
        label: 'Help me organize these insights',
        description: 'Structure and categorize multiple learnings or observations',
        icon: createIcon(List),
        category: 'Organize'
      }
    ],
    defaultPrompts: [
      'Help me capture and organize this important insight: [INSIGHT/REALIZATION]. Explain: why this matters, how it changes my understanding, what led to this realization, potential applications, and how it connects to other things I know.',
      'Analyze this experience: [EXPERIENCE/SITUATION] and help me extract valuable lessons. Consider: what worked well and why, what didn\'t work and what I\'d do differently, patterns I notice, skills or knowledge I gained, and how this applies to future situations.',
      'I\'ve been learning about [TOPIC/SUBJECT] and want to consolidate my understanding. Help me: summarize key concepts I\'ve grasped, identify connections between different ideas, note areas where I still have questions, and plan how to deepen my knowledge further.',
      'Help me understand why [EVENT/OUTCOME] happened the way it did. Analyze: contributing factors and root causes, what I could control vs. what I couldn\'t, lessons for similar situations, and how this fits into larger patterns I\'ve observed.',
      'Organize these scattered observations and insights about [TOPIC/AREA]. Structure them into: main themes or categories, supporting evidence or examples, relationships between different insights, gaps in my understanding, and actionable conclusions.',
      'I made a mistake with [SITUATION]. Help me learn from it by analyzing: what decisions led to this outcome, warning signs I might have missed, what I\'d do differently, skills or knowledge I need to develop, and how to prevent similar issues.',
      'Track my progress and growth in [AREA/SKILL] over time. Document: what I\'ve learned and improved, challenges I\'ve overcome, patterns in my development, areas of continued growth, and milestones worth celebrating.'
    ],
    categories: ['Capture', 'Analyze', 'Learn', 'Connect', 'Apply', 'Deepen', 'Observe', 'Organize']
  },

  // Reflection - Work through complex thoughts and personal analysis
  reflection_journal: {
    quickCommands: [
      {
        id: 'reflection-starter',
        label: 'Help me think through this situation',
        description: 'Start exploring your thoughts and feelings about something',
        icon: createIcon(Brain),
        category: 'Explore'
      },
      {
        id: 'emotion-processor',
        label: 'Help me understand what I\'m feeling',
        description: 'Identify and work through complex emotions',
        icon: createIcon(Heart),
        category: 'Emotions'
      },
      {
        id: 'decision-analyzer',
        label: 'Help me think through this decision',
        description: 'Weigh options and consider different perspectives',
        icon: createIcon(Target),
        category: 'Decisions'
      },
      {
        id: 'growth-tracker',
        label: 'How have I grown or changed?',
        description: 'Reflect on personal development and progress',
        icon: createIcon(TrendingUp),
        category: 'Growth'
      },
      {
        id: 'value-clarifier',
        label: 'What matters most to me right now?',
        description: 'Explore and clarify your values and priorities',
        icon: createIcon(Star),
        category: 'Values'
      },
      {
        id: 'challenge-processor',
        label: 'Help me work through this challenge',
        description: 'Process difficult situations and find constructive approaches',
        icon: createIcon(AlertTriangle),
        category: 'Challenges'
      },
      {
        id: 'gratitude-finder',
        label: 'What am I grateful for?',
        description: 'Identify positive aspects and things to appreciate',
        icon: createIcon(Award),
        category: 'Positivity'
      },
      {
        id: 'pattern-recognizer',
        label: 'What patterns do I notice in my life?',
        description: 'Identify recurring themes, habits, or cycles',
        icon: createIcon(Activity),
        category: 'Patterns'
      },
      {
        id: 'future-visioner',
        label: 'What do I want for my future?',
        description: 'Explore hopes, dreams, and future possibilities',
        icon: createIcon(Eye),
        category: 'Future'
      },
      {
        id: 'self-compassion',
        label: 'How can I be kinder to myself?',
        description: 'Practice self-acceptance and gentle self-reflection',
        icon: createIcon(Heart),
        category: 'Self-Care'
      }
    ],
    defaultPrompts: [
      'Help me reflect on [situation/experience] and process my thoughts and feelings about it. Guide me through: what happened and how I experienced it, what emotions I\'m feeling and why, different perspectives I might consider, what this means for me personally, and how I want to move forward.',
      'I\'m trying to make a decision about [DECISION]. Help me think through: the options I\'m considering, pros and cons of each choice, what my values and priorities suggest, potential outcomes and consequences, what my gut feeling tells me, and how to approach this decision thoughtfully.',
      'Help me reflect on how I\'ve grown and changed over [time period]. Consider: new skills or knowledge I\'ve gained, challenges I\'ve overcome, ways my thinking has evolved, relationships that have developed, values that have become clearer, and areas where I still want to grow.',
      'I\'m going through [challenge/difficult situation]. Help me process this by exploring: what makes this challenging for me, emotions I\'m experiencing, resources and strengths I have, different ways to approach this, lessons I might learn, and how to take care of myself through this.',
      'Help me clarify what\'s most important to me right now in [area of life]. Explore: values that guide my decisions, priorities that feel most urgent, goals that excite me, things I want to let go of, and how to align my actions with what matters most.',
      'I want to understand the patterns in my [behavior/relationships/work/etc.]. Help me identify: recurring themes I notice, what triggers certain responses, cycles that repeat, what\'s working well vs. what isn\'t, and changes I might want to make.',
      'Help me practice gratitude and recognize positive aspects of my life. Guide me to notice: recent experiences I\'m grateful for, people who have supported me, personal strengths I appreciate, progress I\'ve made, and simple pleasures that bring me joy.'
    ],
    categories: ['Explore', 'Emotions', 'Decisions', 'Growth', 'Values', 'Challenges', 'Positivity', 'Patterns', 'Future', 'Self-Care']
  },

  // Tasks - Organize what needs to be done and track progress
  task_checklist: {
    quickCommands: [
      {
        id: 'task-organizer',
        label: 'Help me organize these tasks',
        description: 'Structure and prioritize your to-do items effectively',
        icon: createIcon(List),
        category: 'Organize'
      },
      {
        id: 'priority-setter',
        label: 'Which tasks should I focus on first?',
        description: 'Identify what\'s most important and urgent',
        icon: createIcon(Star),
        category: 'Prioritize'
      },
      {
        id: 'time-planner',
        label: 'How should I schedule these tasks?',
        description: 'Create a realistic timeline and schedule',
        icon: createIcon(Calendar),
        category: 'Schedule'
      },
      {
        id: 'energy-matcher',
        label: 'When do I have energy for each type of task?',
        description: 'Match tasks to your natural energy levels',
        icon: createIcon(Gauge),
        category: 'Energy'
      },
      {
        id: 'breakdown-helper',
        label: 'Break this big task into smaller steps',
        description: 'Make overwhelming tasks more manageable',
        icon: createIcon(Scissors),
        category: 'Simplify'
      },
      {
        id: 'batch-organizer',
        label: 'Group similar tasks together',
        description: 'Organize related tasks for efficient completion',
        icon: createIcon(Layers),
        category: 'Efficiency'
      },
      {
        id: 'motivation-booster',
        label: 'How can I stay motivated to do this?',
        description: 'Find ways to maintain motivation and momentum',
        icon: createIcon(Zap),
        category: 'Motivation'
      },
      {
        id: 'procrastination-solver',
        label: 'Why am I avoiding this task?',
        description: 'Understand and overcome procrastination barriers',
        icon: createIcon(AlertTriangle),
        category: 'Overcome'
      },
      {
        id: 'progress-tracker',
        label: 'How can I track my progress?',
        description: 'Set up systems to monitor and celebrate progress',
        icon: createIcon(CheckCircle),
        category: 'Track'
      },
      {
        id: 'habit-builder',
        label: 'Turn this into a regular habit',
        description: 'Create sustainable routines and habits',
        icon: createIcon(RefreshCw),
        category: 'Habits'
      }
    ],
    defaultPrompts: [
      'Help me organize and prioritize this list of tasks: [TASK LIST]. Structure them by: importance and urgency levels, estimated time requirements, energy needed for each, dependencies between tasks, and realistic timeline for completion. Create a clear action plan.',
      'I have limited time and energy. Help me decide which of these tasks deserve my attention: [TASK LIST]. Consider: impact on my goals, consequences of not doing them, whether they can be postponed or delegated, and what will give me the best return on my time and effort.',
      'Take this overwhelming project: [PROJECT] and break it down into manageable steps. Create: specific actionable tasks, logical sequence and dependencies, realistic time estimates, milestones to track progress, and ways to maintain motivation throughout.',
      'Help me create a schedule that works with my natural rhythms. I have these tasks: [TASKS]. Consider: when I have the most energy and focus, what types of work suit different times of day, how to batch similar activities, and realistic time blocks that account for breaks and transitions.',
      'I keep procrastinating on [TASK/PROJECT]. Help me understand why and create a plan to move forward. Explore: what makes this task feel difficult or overwhelming, smaller first steps I could take, ways to make it more interesting or rewarding, and strategies to overcome my specific barriers.',
      'Design a system to track progress on [GOAL/PROJECT] that will keep me motivated. Include: clear milestones and checkpoints, ways to measure progress, rewards for achievements, methods to stay accountable, and how to adjust the plan when things change.',
      'Help me build sustainable habits around [AREA/ACTIVITY]. Create a plan for: starting small and building gradually, connecting new habits to existing routines, tracking consistency without being overwhelming, handling setbacks gracefully, and maintaining long-term motivation.'
    ],
    categories: ['Organize', 'Prioritize', 'Schedule', 'Energy', 'Simplify', 'Efficiency', 'Motivation', 'Overcome', 'Track', 'Habits']
  },

  // Messages - Prepare emails, responses, and important communications
  email_draft: {
    quickCommands: [
      {
        id: 'message-drafter',
        label: 'Help me write this message',
        description: 'Draft clear, appropriate messages for any situation',
        icon: createIcon(Edit3),
        category: 'Draft'
      },
      {
        id: 'tone-setter',
        label: 'What tone should I use for this?',
        description: 'Choose the right level of formality and approach',
        icon: createIcon(Volume2),
        category: 'Tone'
      },
      {
        id: 'response-crafter',
        label: 'How should I respond to this message?',
        description: 'Create thoughtful, appropriate responses',
        icon: createIcon(Mail),
        category: 'Respond'
      },
      {
        id: 'boundary-communicator',
        label: 'How can I say no politely?',
        description: 'Decline requests while maintaining good relationships',
        icon: createIcon(Shield),
        category: 'Boundaries'
      },
      {
        id: 'clarification-seeker',
        label: 'What questions should I ask?',
        description: 'Ask the right questions to get clear understanding',
        icon: createIcon(MessageCircle),
        category: 'Clarify'
      },
      {
        id: 'difficult-conversation',
        label: 'Help me address this sensitive topic',
        description: 'Navigate challenging conversations with care',
        icon: createIcon(AlertTriangle),
        category: 'Sensitive'
      },
      {
        id: 'follow-up-writer',
        label: 'How can I follow up appropriately?',
        description: 'Check in without being pushy or annoying',
        icon: createIcon(Send),
        category: 'Follow-up'
      },
      {
        id: 'appreciation-expresser',
        label: 'How can I express gratitude?',
        description: 'Show appreciation in meaningful, genuine ways',
        icon: createIcon(Heart),
        category: 'Gratitude'
      },
      {
        id: 'apology-crafter',
        label: 'Help me apologize appropriately',
        description: 'Take responsibility and make amends effectively',
        icon: createIcon(CheckCircle),
        category: 'Apologize'
      },
      {
        id: 'professional-formatter',
        label: 'Make this more professional',
        description: 'Adjust language and format for professional contexts',
        icon: createIcon(Briefcase),
        category: 'Professional'
      }
    ],
    defaultPrompts: [
      'Help me write [type of message] about [topic/situation]. Make it: clear and easy to understand, appropriate for the relationship and context, respectful and considerate, effective at communicating my main points, and authentic to my voice and personality.',
      'I received this message: [MESSAGE] and need to respond appropriately. Help me craft a response that: addresses their main points, maintains a good relationship, is honest and direct when needed, uses the right tone for the situation, and includes any necessary follow-up questions or information.',
      'I need to decline [request/invitation] but want to do it gracefully. Help me write a response that: expresses genuine appreciation, gives a clear but kind reason, suggests alternatives if appropriate, keeps the door open for future opportunities, and maintains the relationship positively.',
      'Help me write a message to address this difficult situation: [SITUATION]. Structure it to: acknowledge the issue honestly, take responsibility where appropriate, explain my perspective calmly, propose constructive solutions, and work toward resolution while preserving dignity for everyone involved.',
      'I want to follow up on [previous conversation/request] but don\'t want to be pushy. Help me write something that: references our previous interaction, shows continued interest or concern, respects their time and situation, provides any helpful updates or information, and makes it easy for them to respond when ready.',
      'Help me express genuine appreciation to [person] for [what they did]. Write something that: specifically acknowledges their actions, explains the positive impact it had, feels personal and heartfelt, is appropriate for our relationship, and makes them feel truly valued.',
      'I need to apologize for [situation/mistake]. Help me write an apology that: takes full responsibility without excuses, acknowledges the impact on the other person, expresses genuine remorse, outlines specific steps to prevent this in the future, and focuses on making things right.'
    ],
    categories: ['Draft', 'Tone', 'Respond', 'Boundaries', 'Clarify', 'Sensitive', 'Follow-up', 'Gratitude', 'Apologize', 'Professional']
  },

  // Projects - Organize and manage complex endeavors
  project: {
    quickCommands: [
      {
        id: 'project-planner',
        label: 'Help me plan this project',
        description: 'Break down complex projects into manageable phases',
        icon: createIcon(Target),
        category: 'Plan'
      },
      {
        id: 'milestone-tracker',
        label: 'What are the key milestones?',
        description: 'Identify important checkpoints and deliverables',
        icon: createIcon(CheckSquare),
        category: 'Track'
      },
      {
        id: 'resource-mapper',
        label: 'What resources do I need?',
        description: 'Identify people, tools, and materials required',
        icon: createIcon(Users),
        category: 'Resources'
      },
      {
        id: 'timeline-builder',
        label: 'Create a realistic timeline',
        description: 'Estimate duration and sequence of project phases',
        icon: createIcon(Calendar),
        category: 'Timeline'
      }
    ],
    defaultPrompts: [
      'Help me plan [project name]: break it into logical phases, identify key deliverables and milestones, estimate realistic timelines, anticipate potential challenges, and suggest resources or skills needed.',
      'I\'m working on [project description]. Help me identify the most critical milestones that will indicate real progress and keep the project on track.',
      'For this project [project details], what resources, people, or tools should I consider? Include both obvious necessities and things I might overlook.',
      'Help me create a realistic timeline for [project description]. Consider dependencies between tasks, buffer time for unexpected issues, and a sustainable pace of work.'
    ],
    categories: ['Plan', 'Track', 'Resources', 'Timeline']
  }
};

// Universal commands for formatting and organization
export const UNIVERSAL_COMMANDS: Omit<CommandOption, 'action'>[] = [
  // Quick formatting
  {
    id: 'bullet-list',
    label: 'Format as bullet points',
    description: 'Transform into scannable bullet points',
    icon: createIcon(List),
    category: 'Format'
  },
  {
    id: 'numbered-list',
    label: 'Format as numbered list',
    description: 'Create sequential, numbered steps',
    icon: createIcon(List),
    category: 'Format'
  },
  {
    id: 'add-headers',
    label: 'Add section headers',
    description: 'Break up content with clear headings',
    icon: createIcon(Heading2),
    category: 'Format'
  },
  {
    id: 'table',
    label: 'Organize into table',
    description: 'Structure information in rows and columns',
    icon: createIcon(Table),
    category: 'Format'
  },
  
  // Content enhancement
  {
    id: 'action-items',
    label: 'Extract action items',
    description: 'Identify clear, actionable tasks',
    icon: createIcon(CheckCircle),
    category: 'Action'
  },
  {
    id: 'summary',
    label: 'Create summary',
    description: 'Generate key highlights and main points',
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