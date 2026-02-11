import { connectDB } from '../db/connection.js';
import { searchRelevantSegments } from '../youtube-rag/retrieval.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const queries = [
    "What are current home loan interest rates?",
    "How to calculate EMI?",
    "Documents required for home loan",
    "Prepayment penalty rules",
    "Tax benefits on home loan"
];

async function main() {
    try {
        console.log('Connecting to DB...');
        await connectDB();
        console.log('Connected.');

        // Test queries
        for (const query of queries) {
            console.log(`\n\n---------------------------------------------------------`);
            console.log(`Searching for: "${query}"`);
            console.log(`---------------------------------------------------------`);

            const start = Date.now();
            const results = await searchRelevantSegments(query, 3);
            const duration = Date.now() - start;

            console.log(`Found ${results.length} results in ${duration}ms:\n`);

            results.forEach((r, i) => {
                const seg = r.segment;
                console.log(`[${i + 1}] Similarity: ${(r.similarity * 100).toFixed(2)}%`);
                console.log(`    Video: https://youtu.be/${seg.videoId}?t=${Math.floor(seg.startTime)}`);
                console.log(`    Text: "${seg.text.substring(0, 150)}..."`);
            });
        }

    } catch (error) {
        console.error("Test failed:", error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected.');
    }
}

main();
