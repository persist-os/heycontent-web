// Social platform types
export type Platform = 'youtube' | 'gmail' | 'instagram' | 'tiktok';

// Centralized OAuth scopes for each platform
export const INSTAGRAM_BUSINESS_SCOPES = [
  'instagram_business_basic',
  'instagram_business_content_publish',
  'instagram_business_manage_messages',
  'instagram_business_manage_comments',
] as const;

export const FACEBOOK_INSTAGRAM_SCOPES = [
  'public_profile',
  'instagram_basic',
  'instagram_content_publish',
  'instagram_manage_insights',
  'instagram_manage_comments',
  'pages_show_list',
  'pages_read_engagement',
] as const;

export const TIKTOK_SCOPES = [
  'user.info.basic',
  'video.list',
] as const;

export const YOUTUBE_SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube.force-ssl',
  'openid',
  'email',
  'profile',
] as const;

export const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.labels',
  'https://mail.google.com/',
  'email',
  'profile',
  'openid',
] as const;

// Platform-specific OAuth configurations
export const PLATFORM_CONFIGS: Record<Platform, {
  clientId: string | undefined;
  clientSecret: string | undefined;
  redirectUri: string;
  scope: readonly string[];
}> = {
  instagram: {
    clientId: process.env.INSTAGRAM_BASIC_CLIENT_ID,
    clientSecret: process.env.INSTAGRAM_BASIC_CLIENT_SECRET,
    redirectUri: process.env.INSTAGRAM_BASIC_REDIRECT_URI!,
    scope: INSTAGRAM_BUSINESS_SCOPES,
  },
  tiktok: {
    clientId: process.env.TIKTOK_CLIENT_ID,
    clientSecret: process.env.TIKTOK_CLIENT_SECRET,
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/social/callback/tiktok`,
    scope: TIKTOK_SCOPES,
  },
  youtube: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/social/callback/youtube/oauth`,
    scope: YOUTUBE_SCOPES,
  },
  gmail: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/social/callback/gmail`,
    scope: GMAIL_SCOPES,
  },
};

// Platform-specific OAuth URL builders
export const PLATFORM_AUTH_URL_BUILDERS: Record<Platform, (config: typeof PLATFORM_CONFIGS[Platform], state: string, useFacebook?: boolean) => string> = {
  youtube: (config, state) =>
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${config.clientId}&` +
    `redirect_uri=${config.redirectUri}&` +
    `scope=${config.scope.join(' ')}&` +
    `response_type=code&` +
    `access_type=offline&` +
    `prompt=consent&` +
    `state=${state}`,
  gmail: (config, state) =>
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${config.clientId}&` +
    `redirect_uri=${config.redirectUri}&` +
    `scope=${config.scope.join(' ')}&` +
    `response_type=code&` +
    `access_type=offline&` +
    `prompt=consent&` +
    `state=${state}`,
  instagram: (config, state, useFacebook) => {
    if (useFacebook) {
      return `https://www.facebook.com/v18.0/dialog/oauth?` +
        `client_id=${process.env.INSTAGRAM_GRAPH_CLIENT_ID}&` +
        `redirect_uri=${config.redirectUri}&` +
        `scope=${encodeURIComponent(FACEBOOK_INSTAGRAM_SCOPES.join(','))}&` +
        `response_type=code&` +
        `state=${state}`;
    } else {
      return `https://www.instagram.com/oauth/authorize?` +
        `client_id=${config.clientId}&` +
        `redirect_uri=${config.redirectUri}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent(config.scope.join(','))}&` +
        `state=${state}`;
    }
  },
  tiktok: (config, state) =>
    `https://www.tiktok.com/auth/authorize?` +
    `client_key=${config.clientId}&` +
    `redirect_uri=${config.redirectUri}&` +
    `scope=${config.scope.join(',')}&` +
    `response_type=code&` +
    `state=${state}`,
};
