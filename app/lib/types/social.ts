export interface SocialAccount {
  id: string;
  provider: string;
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  token_type?: string;
  scope?: string;
  userId: string;
}

export interface UserWithAccounts {
  id: string;
  accounts: SocialAccount[];
}

export interface SocialMetrics {
  engagement: number;
  reach: number;
  impressions: number;
  // Add other relevant metrics
} 