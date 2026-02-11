import { VideoSegmentModel, IVideoSegment } from '../db/models/VideoSegment.js';
import { generateEmbeddings } from './embeddings.js';

function dotProduct(a: number[], b: number[]): number {
    return a.reduce((sum, val, i) => sum + val * b[i], 0);
}

function magnitude(v: number[]): number {
    return Math.sqrt(v.reduce((sum, val) => sum + val * val, 0));
}

function cosineSimilarity(a: number[], b: number[]): number {
    const magA = magnitude(a);
    const magB = magnitude(b);
    if (magA === 0 || magB === 0) return 0;
    return dotProduct(a, b) / (magA * magB);
}

export interface SearchResult {
    segment: IVideoSegment;
    similarity: number;
}

export async function searchRelevantSegments(query: string, limit: number = 5): Promise<SearchResult[]> {
    // 1. Generate embedding for the query
    const queryEmbeddings = await generateEmbeddings([query]);
    const queryVector = queryEmbeddings[0];

    // 2. Fetch all segments with embeddings
    // Note: In a production environment with millions of records, use Atlas Vector Search.
    // For small-medium datasets, in-memory cosine similarity is acceptable.
    const allSegments = await VideoSegmentModel.find({ embedding: { $exists: true } }).select('+embedding').lean();

    // 3. Calculate similarity
    const results: SearchResult[] = allSegments.map((segment: any) => {
        const similarity = cosineSimilarity(queryVector, segment.embedding);
        return {
            segment: segment as IVideoSegment,
            similarity
        };
    });

    // 4. Sort and limit
    results.sort((a, b) => b.similarity - a.similarity);

    return results.slice(0, limit);
}
