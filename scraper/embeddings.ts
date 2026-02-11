import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const EMBEDDING_MODEL = 'gemini-embedding-001';

export interface EmbeddingResult {
    section: string;
    content: string;
    embedding: number[];
}

/**
 * Generates an embedding vector for a given text using Gemini's embedding model.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });

    const result = await model.embedContent(text);
    return result.embedding.values;
}

/**
 * Generates embeddings for all 3 sections of a bank's processed content.
 */
export async function generateAllEmbeddings(
    bankName: string,
    sections: {
        documentList: string;
        eligibility: string;
        interestRatesFaq: string;
    }
): Promise<EmbeddingResult[]> {
    console.log(`  🧬 Generating embeddings for ${bankName}...`);

    const sectionEntries: { key: string; label: string; content: string }[] = [
        { key: 'document_list', label: 'Document List', content: sections.documentList },
        { key: 'eligibility', label: 'Eligibility', content: sections.eligibility },
        { key: 'interest_rates_faq', label: 'Interest Rates & FAQs', content: sections.interestRatesFaq },
    ];

    const results: EmbeddingResult[] = [];

    for (const entry of sectionEntries) {
        const embedding = await generateEmbedding(entry.content);
        results.push({
            section: entry.key,
            content: entry.content,
            embedding,
        });
        console.log(`    ✅ ${entry.label}: ${embedding.length}-dim vector generated`);
    }

    return results;
}
