/**
 * Email personalization utilities.
 * Reusable pattern for personalizing email content with user data.
 */

export interface UserRecipient {
  email: string
  name: string
}

/**
 * Convert HTML to formatted plain text while preserving formatting.
 * Preserves line breaks, converts bold to **bold**, italic to *italic*, etc.
 * 
 * @param html HTML content to convert
 * @returns Formatted plain text
 */
export function htmlToFormattedText(html: string): string {
  if (!html) return ''
  
  let text = html
  
  // Preserve line breaks: <br>, <br/>, <p>, </p>, <div>, </div> -> newlines
  text = text.replace(/<br\s*\/?>/gi, '\n')
  text = text.replace(/<\/p>/gi, '\n\n')
  text = text.replace(/<p[^>]*>/gi, '')
  text = text.replace(/<\/div>/gi, '\n')
  text = text.replace(/<div[^>]*>/gi, '')
  text = text.replace(/<\/h[1-6]>/gi, '\n\n')
  text = text.replace(/<h[1-6][^>]*>/gi, '')
  
  // Convert bold: <b>, <strong> -> **text**
  text = text.replace(/<(b|strong)[^>]*>(.*?)<\/\1>/gi, '**$2**')
  
  // Convert italic: <i>, <em> -> *text*
  text = text.replace(/<(i|em)[^>]*>(.*?)<\/\1>/gi, '*$2*')
  
  // Convert links: <a href="url">text</a> -> text (url)
  text = text.replace(/<a[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi, '$2 ($1)')
  
  // Remove all remaining HTML tags
  text = text.replace(/<[^>]+>/g, '')
  
  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '...')
  
  // Clean up multiple newlines (max 2 consecutive)
  text = text.replace(/\n{3,}/g, '\n\n')
  
  // Trim whitespace from each line but preserve intentional spacing
  text = text.split('\n').map(line => line.trim()).join('\n')
  
  // Remove leading/trailing whitespace
  return text.trim()
}

/**
 * Personalize email content by automatically appending user's name to greeting.
 * Falls back to 'there' if name is missing.
 * 
 * @param content Original email content
 * @param greeting Optional greeting to prepend (e.g., "Hi")
 * @param userName User's name (or empty string if not available)
 * @returns Personalized content
 */
export function personalizeContent(
  content: string,
  greeting: string,
  userName: string
): string {
  // Automatically append name to greeting
  if (greeting.trim()) {
    const name = userName || 'there'
    const personalizedGreeting = `${greeting.trim()} ${name},`
    return `${personalizedGreeting}\n\n${content}`
  }
  
  return content
}

/**
 * Personalize HTML content by automatically appending user's name to greeting.
 * Handles HTML-safe replacement.
 * 
 * @param htmlContent Original HTML content
 * @param greeting Optional greeting to prepend
 * @param userName User's name
 * @returns Personalized HTML content
 */
export function personalizeHtmlContent(
  htmlContent: string,
  greeting: string,
  userName: string
): string {
  // Automatically append name to greeting
  if (greeting.trim()) {
    const name = userName || 'there'
    const personalizedGreeting = `${greeting.trim()} ${name},`
    
    // Escape HTML in greeting for safety
    const escapedGreeting = personalizedGreeting
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
    
    // Convert newlines to <br> for HTML
    const htmlGreeting = escapedGreeting.replace(/\n/g, '<br>')
    
    return `<p>${htmlGreeting}</p>\n\n${htmlContent}`
  }
  
  return htmlContent
}

