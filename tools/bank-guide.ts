import { FunctionTool } from '@google/adk';
import { z } from 'zod';
import { connectDB } from '../db/connection.js';
import { BankKnowledgeModel, IBankKnowledge } from '../db/models/bank-knowledge.model.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
 * Bank Guide Tool
 * Retrieves scraped home loan data (Eligibility, Documents, Rates/FAQs) for a specific bank
 * and optionally answers a user query using that data as context.
 */
export const bankGuide = new FunctionTool({
    name: 'bank_home_loan_guide',
    description:
        'Retrieves detailed home loan information for a specific bank (Eligibility, Documents, Interest Rates, FAQs). Can also answer specific questions using the bank\'s data. Use this when the user asks about a specific bank\'s home loan policies.',
    parameters: z.object({
        bankName: z
            .string()
            .describe('Name of the bank (e.g., "HDFC", "SBI", "ICICI", "Axis")'),
        query: z
            .string()
            .optional()
            .describe(
                'Specific question about the bank\'s home loan (e.g., "What is the processing fee?", "list the documents required"). If omitted, returns a general summary.'
            ),
    }),
    execute: async ({ bankName, query }) => {
        await connectDB();

        // 1. Find the bank document(s) by fuzzy search on bankName or bankKey
        // We'll search for any document that matches the bank name in bankName or bankKey
        // The collection has multiple docs per bank (one per section).
        // We need to find the DISTINCT bankKey first.

        // Regex for case-insensitive partial match
        const regex = new RegExp(bankName, 'i');

        // Find matches
        const docs = await BankKnowledgeModel.find({
            $or: [{ bankName: regex }, { bankKey: regex }],
        }).lean<IBankKnowledge[]>().exec();

        if (!docs || docs.length === 0) {
            return {
                status: 'error',
                message: `No home loan data found for bank "${bankName}". Please try another bank (e.g., HDFC, SBI, ICICI, Axis).`,
            };
        }

        // Group by bankKey to see if we matched multiple banks
        const banksFound = [...new Set(docs.map((d) => d.bankName))];

        if (banksFound.length > 1) {
            return {
                status: 'ambiguous',
                message: `Multiple banks found matching "${bankName}": ${banksFound.join(', ')}. Please refine your search.`,
            };
        }

        // We have data for exactly one bank
        const targetBank = banksFound[0];
        const bankDocs = docs.filter((d) => d.bankName === targetBank);

        // Organize content
        const sections = {
            documentList: bankDocs.find((d) => d.section === 'document_list')?.content || 'Not available',
            eligibility: bankDocs.find((d) => d.section === 'eligibility')?.content || 'Not available',
            interestRatesFaq: bankDocs.find((d) => d.section === 'interest_rates_faq')?.content || 'Not available',
        };

        const context = `
BANK: ${targetBank}

=== DOCUMENT REQUIREMENTS ===
${sections.documentList}

=== ELIGIBILITY CRITERIA ===
${sections.eligibility}

=== INTEREST RATES & FAQS ===
${sections.interestRatesFaq}
`;

        // If no specific query, return the raw sections (summarized)
        if (!query) {
            return {
                status: 'success',
                bank: targetBank,
                data: sections,
                message: `Retrieved home loan details for ${targetBank}.`,
            };
        }

        // If query exists, use LLM to answer
        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            const prompt = `You are an expert home loan advisor. Use the following context about ${targetBank} to answer the user's question accurately.
            
CONTEXT:
${context}

USER QUESTION: "${query}"

INSTRUCTIONS:
- Answer ONLY based on the provided context.
- If the answer is not in the context, say "I couldn't find that specific information in the ${targetBank} data."
- Be concise and helpful.
- Format with markdown.
`;

            const result = await model.generateContent(prompt);
            const answer = result.response.text();

            return {
                status: 'success',
                bank: targetBank,
                query,
                answer,
                // Include raw data reference if needed
                // sourceData: sections 
            };
        } catch (err) {
            return {
                status: 'error',
                message: 'Failed to generate AI answer.',
                error: String(err),
            };
        }
    },
});
