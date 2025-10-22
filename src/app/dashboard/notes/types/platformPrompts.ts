// Platform-specific post type prompts for Smart Notes

export type PlatformKey = 'instagram' | 'youtube' | 'gmail';

export interface PlatformPrompt {
  key: string;
  description: string;
  translationKey?: string; // Key for progressive translation system
}

export const platformPrompts: Record<PlatformKey, PlatformPrompt[]> = {
  instagram: [
    { key: 'post', description: 'Single image or video post (classic feed post)', translationKey: 'platform.instagram.post.description' },
    { key: 'carousel', description: 'Multi-image swipeable post', translationKey: 'platform.instagram.carousel.description' },
    { key: 'reel', description: 'Short vertical video, optimized for discovery', translationKey: 'platform.instagram.reel.description' },
    { key: 'story', description: 'Temporary 24-hour content (images, videos, stickers)', translationKey: 'platform.instagram.story.description' },
    { key: 'close_friends_story', description: 'Story visible only to selected close friends', translationKey: 'platform.instagram.close_friends_story.description' },
    { key: 'live', description: 'Real-time video streaming', translationKey: 'platform.instagram.live.description' },
    { key: 'collab_post', description: 'Shared post with another account', translationKey: 'platform.instagram.collab_post.description' },
    { key: 'broadcast_channel', description: 'Mass announcement messages in DMs (text, polls, etc.)', translationKey: 'platform.instagram.broadcast_channel.description' },
  ],
  youtube: [
    { key: 'video', description: 'Standard long-form video', translationKey: 'platform.youtube.video.description' },
    { key: 'shorts', description: 'Short vertical video (under 60 seconds)', translationKey: 'platform.youtube.shorts.description' },
    { key: 'live_stream', description: 'Real-time broadcast with live chat', translationKey: 'platform.youtube.live_stream.description' },
    { key: 'premiere', description: 'Scheduled video launch with live chat feature', translationKey: 'platform.youtube.premiere.description' },
    { key: 'community_post', description: 'Non-video updates: polls, images, or text posts', translationKey: 'platform.youtube.community_post.description' },
    { key: 'story', description: 'Temporary mobile-only short content (for eligible creators)', translationKey: 'platform.youtube.story.description' },
    { key: 'podcast', description: 'Video/audio podcast uploaded to YouTube\'s podcast tab', translationKey: 'platform.youtube.podcast.description' },
  ],
  gmail: [
    { key: 'newsletter', description: 'Email campaign for updates, content, or announcements', translationKey: 'platform.gmail.newsletter.description' },
    { key: 'brand_pitch', description: 'Email proposing a collab or sponsorship to a brand', translationKey: 'platform.gmail.brand_pitch.description' },
    { key: 'outreach', description: 'Personalized message to build a relationship or network', translationKey: 'platform.gmail.outreach.description' },
    { key: 'exclusive_drop', description: 'Special offer or content sent to a targeted list', translationKey: 'platform.gmail.exclusive_drop.description' },
    { key: 'automated_response', description: 'Pre-written reply triggered by a specific action', translationKey: 'platform.gmail.automated_response.description' },
    { key: 'drip_sequence', description: 'Multi-step campaign sent over days/weeks', translationKey: 'platform.gmail.drip_sequence.description' },
  ],
};
