import * as cheerio from 'cheerio';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

const OUTPUT_DIR = path.resolve(import.meta.dirname, 'output');

/**
 * Fetches a URL and extracts clean text content by stripping
 * all HTML tags, scripts, styles, navigation, and other noise.
 */
export async function scrapeUrl(url: string): Promise<string> {
    console.log(`  📥 Fetching: ${url}`);

    const response = await fetch(url, {
        headers: {
            'User-Agent':
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
        },
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch ${url}`);
    }

    const html = await response.text();
    return extractTextFromHtml(html);
}

/**
 * Strips all non-content HTML elements and returns clean, readable text.
 */
function extractTextFromHtml(html: string): string {
    const $ = cheerio.load(html);

    // Remove non-content elements
    $(
        'script, style, noscript, iframe, svg, link, meta, nav, footer, header, aside, form, button, input, select, textarea, [role="navigation"], [role="banner"], [role="contentinfo"], .cookie-banner, .popup, .modal, .ad, .advertisement'
    ).remove();

    // Get text from body, collapse whitespace
    const rawText = $('body').text();

    // Clean up the text
    const cleaned = rawText
        .replace(/\t/g, ' ')                    // tabs → spaces
        .replace(/[ ]{2,}/g, ' ')               // collapse multiple spaces
        .replace(/\n{3,}/g, '\n\n')             // collapse 3+ newlines to 2
        .split('\n')
        .map((line) => line.trim())             // trim each line
        .filter((line) => line.length > 0)      // remove empty lines
        .join('\n');

    return cleaned;
}

/**
 * Scrapes a bank URL and saves the raw text to the output directory.
 * Returns the cleaned text content.
 */
export async function scrapeAndSave(bankKey: string, url: string): Promise<string> {
    const text = await scrapeUrl(url);

    // Ensure output directory exists
    const bankDir = path.join(OUTPUT_DIR, bankKey);
    await mkdir(bankDir, { recursive: true });

    // Save raw text
    const rawPath = path.join(bankDir, 'raw.txt');
    await writeFile(rawPath, text, 'utf-8');
    console.log(`  💾 Saved raw text to: ${rawPath} (${text.length} chars)`);

    return text;
}
