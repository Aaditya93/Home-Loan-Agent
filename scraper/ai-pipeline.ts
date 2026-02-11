import { GoogleGenerativeAI } from '@google/generative-ai';
import { writeFile } from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const OUTPUT_DIR = path.resolve(import.meta.dirname, 'output');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface ProcessedSections {
    documentList: string;
    eligibility: string;
    interestRatesFaq: string;
}

const SYSTEM_PROMPT = `You are an expert financial content analyst specializing in Indian home loans. 
Your job is to analyze raw scraped text from a bank's home loan webpage and extract, organize, and summarize the information into exactly 3 well-structured sections.

IMPORTANT INSTRUCTIONS:
- Extract ONLY information that is present in the raw text. Do NOT fabricate data.
- If a section's information is not available in the text, write "Information not available from the scraped content."
- Write in clean, professional, easy-to-read prose with bullet points where appropriate.
- Use Indian financial terminology (₹, Lakhs, Crores, CIBIL, etc.)
- Remove any marketing fluff — focus on factual, actionable information.`;

const USER_PROMPT = `Analyze the following raw text scraped from a bank's home loan webpage. Extract and organize the information into exactly 3 sections.

Return your response as a valid JSON object with exactly these 3 keys:
- "documentList": A comprehensive, well-formatted summary of all documents required for a home loan application (identity proofs, income proofs, property documents, etc.)
- "eligibility": A clear summary of eligibility criteria (age, income, employment type, CIBIL score, property requirements, etc.)
- "interestRatesFaq": A summary of interest rates, processing fees, tenure options, and commonly asked questions/answers about the home loan product.

Each value should be a clean, readable text string with proper formatting using newlines and bullet points (use "- " for bullets).

RAW TEXT:
---
{RAW_TEXT}
---

Return ONLY the JSON object, no markdown fences, no extra text.`;

/**
 * Sends raw scraped text to Gemini and gets back 3 structured sections.
 */
export async function processWithAI(
    rawText: string,
    bankName: string
): Promise<ProcessedSections> {
    console.log(`  🤖 Processing with Gemini AI for ${bankName}...`);

    const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: SYSTEM_PROMPT,
        generationConfig: {
            responseMimeType: 'application/json',
        },
    });

    // Truncate raw text if too long (Gemini context limit safety)
    const maxChars = 100_000;
    const trimmedText = rawText.length > maxChars
        ? rawText.substring(0, maxChars) + '\n\n[Content truncated due to length...]'
        : rawText;

    const prompt = USER_PROMPT.replace('{RAW_TEXT}', trimmedText);

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    // Parse the JSON response
    let sections: ProcessedSections;
    try {
        // Primary: direct JSON parse (responseMimeType should give clean JSON)
        const parsed = JSON.parse(responseText);
        sections = {
            documentList: parsed.documentList || 'Information not available from the scraped content.',
            eligibility: parsed.eligibility || 'Information not available from the scraped content.',
            interestRatesFaq: parsed.interestRatesFaq || 'Information not available from the scraped content.',
        };
    } catch {
        // Fallback: try extracting JSON from markdown fences or surrounding text
        try {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                sections = {
                    documentList: parsed.documentList || 'Information not available.',
                    eligibility: parsed.eligibility || 'Information not available.',
                    interestRatesFaq: parsed.interestRatesFaq || 'Information not available.',
                };
            } else {
                throw new Error('No JSON object found in response');
            }
        } catch {
            console.error(`  ⚠️ Failed to parse AI response as JSON. Using raw response as fallback.`);
            sections = {
                documentList: 'Failed to parse AI response. Raw response:\n' + responseText,
                eligibility: 'Failed to parse AI response.',
                interestRatesFaq: 'Failed to parse AI response.',
            };
        }
    }

    return sections;
}

/**
 * Processes raw text through AI and saves the 3 section files.
 */
export async function processAndSave(
    bankKey: string,
    bankName: string,
    rawText: string
): Promise<ProcessedSections> {
    const sections = await processWithAI(rawText, bankName);

    const bankDir = path.join(OUTPUT_DIR, bankKey);

    // Save each section as a text file
    await writeFile(
        path.join(bankDir, 'document-list.txt'),
        `# ${bankName} — Document Requirements\n\n${sections.documentList}`,
        'utf-8'
    );
    await writeFile(
        path.join(bankDir, 'eligibility.txt'),
        `# ${bankName} — Eligibility Criteria\n\n${sections.eligibility}`,
        'utf-8'
    );
    await writeFile(
        path.join(bankDir, 'interest-rates-faq.txt'),
        `# ${bankName} — Interest Rates & FAQs\n\n${sections.interestRatesFaq}`,
        'utf-8'
    );

    console.log(`  📄 Saved 3 section files for ${bankName}`);
    return sections;
}
