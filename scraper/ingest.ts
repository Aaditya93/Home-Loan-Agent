import { connectDB } from '../db/connection.js';
import { BankKnowledgeModel, SectionType } from '../db/models/bank-knowledge.model.js';
import type { EmbeddingResult } from './embeddings.js';

/**
 * Upserts a bank's processed knowledge (text + embedding) into MongoDB.
 * Uses the compound index on (bankKey, section) for conflict resolution.
 */
export async function ingestToDatabase(
    bankKey: string,
    bankName: string,
    sourceUrl: string,
    scrapedAt: Date,
    embeddingResults: EmbeddingResult[]
): Promise<void> {
    console.log(`  💾 Ingesting ${bankName} into MongoDB...`);

    // Ensure DB connection is active
    await connectDB();

    for (const result of embeddingResults) {
        await BankKnowledgeModel.findOneAndUpdate(
            {
                bankKey,
                section: result.section as SectionType,
            },
            {
                $set: {
                    bankName,
                    content: result.content,
                    embedding: result.embedding,
                    sourceUrl,
                    scrapedAt,
                    processedAt: new Date(),
                },
            },
            { upsert: true, new: true }
        );

        console.log(`    ✅ Upserted: ${bankKey}/${result.section}`);
    }
}
