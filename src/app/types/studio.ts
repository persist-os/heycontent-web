export type RecordingFormat = "vertical" | "horizontal" | "square";

export interface TeleprompterConfig {
  enabled: boolean;
  text: string;
  speed: number;
}

export interface VocalCoachConfig {
  enabled: boolean;
  tips: string[];
}

export interface RecordingConfig {
  format: RecordingFormat | null;
  teleprompter: TeleprompterConfig | null;
  vocalCoach: VocalCoachConfig | null;
}

export interface EditingConfig {
  mode: "trim" | "effects" | "series" | null;
}

export interface ThumbnailConfig {
  style: "bold" | "minimal" | "text" | null;
}

export interface StudioPreviewContent {
  type: "recording" | "editing" | "thumbnail" | null;
  data: RecordingConfig | EditingConfig | ThumbnailConfig;
} 