import { readFile } from 'fs/promises';
import { join } from 'path';

/**
 * Reads a webflow HTML file from the public folder and extracts the body content
 */
export async function getWebflowHtmlContent(filename: string): Promise<string> {
  try {
    const filePath = join(process.cwd(), 'core', 'public', filename);
    const html = await readFile(filePath, 'utf-8');
    
    // Extract body content - look for <body> tag and get everything inside
    // Use non-greedy match to get content up to </body>
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch && bodyMatch[1]) {
      return bodyMatch[1];
    }
    
    // Fallback: if no body tag found, try to find content after </head>
    const headEndMatch = html.match(/<\/head>([\s\S]*)/i);
    if (headEndMatch && headEndMatch[1]) {
      // Remove any remaining </html> or other closing tags
      return headEndMatch[1]
        .replace(/<\/html>/i, '')
        .trim();
    }
    
    // Last resort: return everything after removing DOCTYPE, html, and head tags
    let content = html
      .replace(/<!DOCTYPE[^>]*>/i, '')
      .replace(/<html[^>]*>/i, '')
      .replace(/<\/html>/i, '')
      .replace(/<head[^>]*>[\s\S]*?<\/head>/i, '');
    
    return content.trim();
  } catch (error) {
    console.error(`Error reading webflow HTML file ${filename}:`, error);
    return '';
  }
}

