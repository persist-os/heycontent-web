export interface WaitlistSignup {
  id: string;
  name: string;
  timestamp: number;
}

export interface WaitlistQueueProps {
  position: number;
  queueId: string;
  onQueueComplete?: () => void;
  onStageChange?: (stage: 'register' | 'queue' | 'card') => void;
}

export interface RecentSignupProps {
  name: string;
  timeAgo: string;
  index: number;
}

export interface RegistrationFormProps {
  onSubmit: (e: React.FormEvent) => Promise<void>;
  name: string;
  email: string;
  onNameChange: (name: string) => void;
  onEmailChange: (email: string) => void;
}

export interface WaitlistCardProps {
  queueId: string;
  onCopyInviteLink: () => void;
  copied: boolean;
  onShare: (platform: 'twitter' | 'linkedin' | 'whatsapp' | 'instagram' | 'general') => void;
  invitesLeft: number;
  onColorChange: (e: React.MouseEvent) => void;
  colorSchemeIndex: number;
  isFlipped: boolean;
  onCardClick: () => void;
}
