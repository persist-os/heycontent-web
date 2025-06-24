// Simple markdown to HTML converter for contentEditable
export const markdownToHTML = (markdown: string): string => {
  if (!markdown) return '';
  
  let html = markdown;
  
  // Convert images: ![alt](url) -> <img src="url" alt="alt" />
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto; max-height: 300px; border-radius: 8px; margin: 8px 0; display: block;" />');
  
  // Convert bold: **text** -> <strong>text</strong>
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Convert italic: *text* -> <em>text</em>
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Convert underline: <u>text</u> (keep as is)
  // Already HTML, no conversion needed
  
  // Convert headings: # text -> <h1>text</h1>
  html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
  
  // Convert line breaks
  html = html.replace(/\n/g, '<br>');
  
  return html;
};

// Simple HTML to markdown converter for saving
export const htmlToMarkdown = (html: string): string => {
  if (!html) return '';
  
  let markdown = html;
  
  // Convert images: <img src="url" alt="alt" ... /> -> ![alt](url)
  // Handle both attribute orders and make regex more specific to avoid conflicts
  markdown = markdown.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, '![$2]($1)');
  markdown = markdown.replace(/<img[^>]*alt="([^"]*)"[^>]*src="([^"]*)"[^>]*\/?>/gi, '![$1]($2)');
  // Handle images without alt text
  markdown = markdown.replace(/<img[^>]*src="([^"]*)"[^>]*\/?>/gi, '![]($1)');
  
  // Convert bold: <strong>text</strong> -> **text**
  markdown = markdown.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
  markdown = markdown.replace(/<b>(.*?)<\/b>/gi, '**$1**');
  
  // Convert italic: <em>text</em> -> *text*
  markdown = markdown.replace(/<em>(.*?)<\/em>/gi, '*$1*');
  markdown = markdown.replace(/<i>(.*?)<\/i>/gi, '*$1*');
  
  // Convert headings: <h1>text</h1> -> # text
  markdown = markdown.replace(/<h1>(.*?)<\/h1>/gi, '# $1');
  markdown = markdown.replace(/<h2>(.*?)<\/h2>/gi, '## $1');
  markdown = markdown.replace(/<h3>(.*?)<\/h3>/gi, '### $1');
  
  // Convert line breaks: <br> -> \n
  markdown = markdown.replace(/<br\s*\/?>/gi, '  \n'); // Two spaces + newline for hard breaks
  
  // Remove any remaining HTML tags (fallback)
  markdown = markdown.replace(/<[^>]*>/g, '');
  
  // Clean up extra whitespace and ensure proper spacing
  markdown = markdown.replace(/\n\s*\n\s*\n+/g, '\n\n'); // Max 2 consecutive newlines
  markdown = markdown.replace(/^\s+|\s+$/g, ''); // Trim start/end whitespace
  
  return markdown;
}; 