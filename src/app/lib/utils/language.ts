import { franc } from 'franc';

export async function detectLanguage(text: string): Promise<string> {
  try {
    // Detect language using franc
    const detectedLang = franc(text);
    
    // Return 'en' if detection failed or confidence is low
    if (detectedLang === 'und' || detectedLang === null) {
      return 'en';
    }

    return detectedLang;
  } catch (error) {
    console.error('Error detecting language:', error);
    return 'en'; // Default to English on error
  }
} 