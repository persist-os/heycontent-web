/**
 * Translation Type Definitions
 * 
 * CRITICAL: These types MUST match backend/app/models/translation_models.py exactly
 * Any changes here should be mirrored in Python and vice versa.
 */

// Language name mapping - matches Python LANGUAGE_NAMES
export const LANGUAGE_NAMES: Record<string, string> = {
  // European Languages
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  ru: "Russian",
  pl: "Polish",
  nl: "Dutch",
  cs: "Czech",
  hu: "Hungarian",
  ro: "Romanian",
  uk: "Ukrainian",
  el: "Greek",
  
  // Northern European Languages
  sv: "Swedish",
  no: "Norwegian",
  da: "Danish",
  fi: "Finnish",
  is: "Icelandic",
  et: "Estonian",
  lv: "Latvian",
  lt: "Lithuanian",
  
  // Asian Languages - East Asia
  zh: "Chinese (Simplified)",
  "zh-TW": "Chinese (Traditional)",
  ja: "Japanese",
  ko: "Korean",
  mn: "Mongolian",
  
  // Asian Languages - Southeast Asia
  th: "Thai",
  vi: "Vietnamese",
  id: "Indonesian",
  ms: "Malay",
  fil: "Filipino",
  my: "Burmese",
  km: "Khmer",
  lo: "Lao",
  
  // Asian Languages - South Asia
  hi: "Hindi",
  bn: "Bengali",
  ta: "Tamil",
  te: "Telugu",
  mr: "Marathi",
  ur: "Urdu",
  pa: "Punjabi",
  ne: "Nepali",
  si: "Sinhala",
  
  // Asian Languages - Central & West Asia
  ar: "Arabic",
  tr: "Turkish",
  fa: "Persian",
  he: "Hebrew",
  hy: "Armenian",
  az: "Azerbaijani",
  kk: "Kazakh",
  uz: "Uzbek",
  ps: "Pashto",
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

