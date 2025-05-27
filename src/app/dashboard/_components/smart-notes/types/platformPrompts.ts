// Platform-specific post type prompts for Smart Notes

export type PlatformKey = 'instagram' | 'youtube' | 'gmail';

export interface PlatformPrompt {
  key: string;
  description: string;
}

export const platformPrompts: Record<PlatformKey, PlatformPrompt[]> = {
  instagram: [
    { key: 'post', description: 'Single image or video post (classic feed post)' },
    { key: 'carousel', description: 'Multi-image swipeable post' },
    { key: 'reel', description: 'Short vertical video, optimized for discovery' },
    { key: 'story', description: 'Temporary 24-hour content (images, videos, stickers)' },
    { key: 'close_friends_story', description: 'Story visible only to selected close friends' },
    { key: 'live', description: 'Real-time video streaming' },
    { key: 'collab_post', description: 'Shared post with another account' },
    { key: 'broadcast_channel', description: 'Mass announcement messages in DMs (text, polls, etc.)' },
  ],
  youtube: [
    { key: 'video', description: 'Standard long-form video' },
    { key: 'shorts', description: 'Short vertical video (under 60 seconds)' },
    { key: 'live_stream', description: 'Real-time broadcast with live chat' },
    { key: 'premiere', description: 'Scheduled video launch with live chat feature' },
    { key: 'community_post', description: 'Non-video updates: polls, images, or text posts' },
    { key: 'story', description: 'Temporary mobile-only short content (for eligible creators)' },
    { key: 'podcast', description: 'Video/audio podcast uploaded to YouTube’s podcast tab' },
  ],
  gmail: [
    { key: 'newsletter', description: 'Email campaign for updates, content, or announcements' },
    { key: 'brand_pitch', description: 'Email proposing a collab or sponsorship to a brand' },
    { key: 'outreach', description: 'Personalized message to build a relationship or network' },
    { key: 'exclusive_drop', description: 'Special offer or content sent to a targeted list' },
    { key: 'automated_response', description: 'Pre-written reply triggered by a specific action' },
    { key: 'drip_sequence', description: 'Multi-step campaign sent over days/weeks' },
  ],
};
