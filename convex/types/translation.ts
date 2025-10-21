/**
 * Translation Type Definitions
 * 
 * CRITICAL: These types MUST match backend/app/models/translation_models.py exactly
 * Any changes here should be mirrored in Python and vice versa.
 */

// Language name mapping - matches Python LANGUAGE_NAMES
export const LANGUAGE_NAMES: Record<string, string> = {
  ko: "Korean",
  ja: "Japanese",
  zh: "Chinese (Simplified)",
  "zh-TW": "Chinese (Traditional)",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  ru: "Russian",
  ar: "Arabic",
  hi: "Hindi",
  th: "Thai",
  vi: "Vietnamese",
  id: "Indonesian",
  tr: "Turkish",
  pl: "Polish",
  nl: "Dutch",
  sv: "Swedish",
  no: "Norwegian",
  da: "Danish",
  fi: "Finnish",
  cs: "Czech",
  hu: "Hungarian",
  ro: "Romanian",
  uk: "Ukrainian",
  el: "Greek",
  he: "Hebrew",
  fa: "Persian",
  bn: "Bengali",
  ta: "Tamil",
  te: "Telugu",
  mr: "Marathi",
  ur: "Urdu",
  ms: "Malay",
  fil: "Filipino",
};

/**
 * Request to translate a single text
 * Matches backend TranslateRequest
 */
export interface TranslateRequest {
  sourceText: string;
  sourceLang?: string; // Default: "en"
  targetLang: string;
  context?: string;
}

/**
 * Request to translate multiple texts
 * Matches backend BatchTranslateRequest
 */
export interface BatchTranslateRequest {
  texts: string[];
  sourceLang?: string; // Default: "en"
  targetLang: string;
  context?: string;
}

/**
 * Response for single translation
 * Matches backend TranslateResponse
 */
export interface TranslateResponse {
  success: boolean;
  translatedText?: string;
  sourceLang?: string;
  targetLang?: string;
  method?: string;
  error?: string;
}

/**
 * Response for batch translation
 * Matches backend BatchTranslateResponse
 */
export interface BatchTranslateResponse {
  success: boolean;
  translations?: string[];
  sourceLang?: string;
  targetLang?: string;
  method?: string;
  error?: string;
}

/**
 * Language information
 * Matches backend LanguageInfo
 */
export interface LanguageInfo {
  code: string;
  name: string;
}

/**
 * Response for supported languages
 * Matches backend LanguagesResponse
 */
export interface LanguagesResponse {
  success: boolean;
  languages: LanguageInfo[];
  total: number;
}

/**
 * Request to detect language
 * Matches backend DetectLanguageRequest
 */
export interface DetectLanguageRequest {
  text: string;
}

/**
 * Response for language detection
 * Matches backend DetectLanguageResponse
 */
export interface DetectLanguageResponse {
  success: boolean;
  languageCode?: string;
  languageName?: string;
  error?: string;
}

// Type guards for runtime validation
export function isTranslateResponse(obj: any): obj is TranslateResponse {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof obj.success === "boolean"
  );
}

export function isBatchTranslateResponse(
  obj: any
): obj is BatchTranslateResponse {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof obj.success === "boolean" &&
    (obj.translations === undefined || Array.isArray(obj.translations))
  );
}

export function isDetectLanguageResponse(
  obj: any
): obj is DetectLanguageResponse {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof obj.success === "boolean"
  );
}

