// Persona data for HeyContent Prompt System
// Each persona includes a full profile for use in prompt selection and research tools

export interface PersonaProfile {
  id: string;
  name: string;
  description: string;
  tone: string[];
  goals: string[];
  platformHabits: string[];
  contentNeeds: string[];
}

export const personas: PersonaProfile[] = [
  {
    id: 'starter',
    name: 'The Starter',
    description: 'Just getting into content. Eager, learning, sometimes overwhelmed, but excited to try.',
    tone: ['encouraging', 'simple', 'friendly'],
    goals: ['learn the basics', 'build confidence', 'publish first content'],
    platformHabits: ['explores multiple platforms', 'follows tutorials', 'asks lots of questions'],
    contentNeeds: ['step-by-step guides', 'templates', 'motivation', 'quick wins']
  },
  {
    id: 'side_hustler',
    name: 'The Side Hustler',
    description: 'Juggling multiple priorities. Wants efficiency, clarity, and results.',
    tone: ['efficient', 'casual', 'confident'],
    goals: ['promote product', 'save time', 'grow audience on the side'],
    platformHabits: ['posts in batches', 'uses scheduling tools', 'active in evenings/weekends'],
    contentNeeds: ['short-form scripts', 'batch content ideas', 'time-saving tips']
  },
  {
    id: 'everyday_influencer',
    name: 'The Everyday Influencer',
    description: 'Wants to grow and pitch brands. Focused on engagement and personal brand.',
    tone: ['authentic', 'aspirational', 'engaging'],
    goals: ['grow followers', 'land brand deals', 'increase engagement'],
    platformHabits: ['active on Instagram/TikTok', 'tracks analytics', 'DMs with brands'],
    contentNeeds: ['brand pitch templates', 'caption ideas', 'collab outreach']
  },
  {
    id: 'storyteller',
    name: 'The Storyteller',
    description: 'Focused on narrative and emotion. Loves sharing personal stories and connecting deeply.',
    tone: ['personal', 'emotional', 'narrative'],
    goals: ['engagement', 'connection', 'inspiration'],
    platformHabits: ['writes long captions', 'shares behind-the-scenes', 'uses stories'],
    contentNeeds: ['story prompts', 'emotional hooks', 'audience questions']
  },
  {
    id: 'trend_hacker',
    name: 'The Trend Hacker',
    description: "Chasing what's next. Loves trends, memes, and viral moments.",
    tone: ['high energy', 'fun', 'edgy'],
    goals: ['go viral', 'stay relevant', 'grow fast'],
    platformHabits: ['jumps on trends', 'uses trending sounds', 'posts frequently'],
    contentNeeds: ['trend ideas', 'hook templates', 'meme formats']
  },
  {
    id: 'professional_creative',
    name: 'The Professional Creative',
    description: 'High-output, agency-level work. Values polish, strategy, and results.',
    tone: ['polished', 'strategic', 'professional'],
    goals: ['deliver for clients', 'optimize performance', 'scale content'],
    platformHabits: ['uses content calendars', 'A/B tests', 'collaborates with teams'],
    contentNeeds: ['campaign briefs', 'performance reports', 'advanced templates']
  },
  {
    id: 'quiet_genius',
    name: 'The Quiet Genius',
    description: 'Creative but introverted. Prefers depth over volume, and quality over hype.',
    tone: ['thoughtful', 'insightful', 'calm'],
    goals: ['share expertise', 'build a niche audience', 'create meaningful work'],
    platformHabits: ['publishes less often', 'writes long-form', 'engages in comments'],
    contentNeeds: ['deep-dive prompts', 'thought leadership', 'discussion starters']
  }
];
