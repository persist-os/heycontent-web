import { ContentHubInsight } from '@/convex/contentHub'

export const mockContentHubInsight: ContentHubInsight = {
  remix_insight: "Your YouTube 'Everyday Glam Routine' video (180K views) could be transformed into a trending TikTok series. Break down your 5-minute morning routine into quick 30-second clips for each step. This bite-sized format is perfect for TikTok's fast-paced audience who love quick beauty hacks.",
  smartnote_summary: "Recent activity shows strong engagement on skincare routines and affordable makeup tutorials. Your audience responds well to authentic, relatable content featuring drugstore products and realistic beauty standards with honest before-and-after results.",
  conversation_starter: "What's your biggest skincare struggle right now? Drop it in the comments below - I'm planning my next skincare series and want to address the issues you're actually dealing with! 💕",
  youtube_hook: "Stop wasting money on expensive skincare - here's my exact $30 routine that cleared my skin in 30 days",
  youtube_format: "Get ready with me style video featuring morning and evening routines, product close-ups, application techniques, and honest reviews. Include before/after shots and product links in description.",
  youtube_cta: "Give this video a thumbs up if you want more affordable skincare content! Subscribe and hit the bell for weekly beauty tips 💄",
  instagram_hook: "The YouTube routine everyone's asking about, but make it Instagram ✨ (swipe for each step)",
  instagram_format: "Multi-post strategy: Reel series (one per skincare step) + carousel post summarizing all steps + Stories with polls asking which step to feature on YouTube next. Cross-reference YouTube video in bio link.",
  instagram_cta: "Full tutorial on my YouTube (link in bio) + exclusive discount codes in my email newsletter - link in Stories! Which step do you want me to break down next? 👇",
  gmail_hook: "Behind the scenes of my viral skincare content (+ exclusive 20% off)",
  gmail_format: "Weekly newsletter connecting YouTube and Instagram content with exclusive insights: why certain products work, subscriber-only discount codes, and sneak peeks of upcoming content across platforms.",
  gmail_cta: "Use code EMAIL20 for 20% off the products from this week's YouTube video! Plus, reply with your platform preference - should I do more Instagram tutorials or longer YouTube deep-dives?"
}

export const mockConnectedPlatforms = ['youtube']

export const mockDataBundle = {
  hasMinimumPlatforms: false,
  connectedPlatforms: mockConnectedPlatforms
}