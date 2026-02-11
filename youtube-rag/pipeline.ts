import { fetchTranscript, chunkTranscript } from './transcript.js';
import { generateEmbeddings } from './embeddings.js';
import { saveVideoSegments } from './store.js';
import { VideoSegmentModel } from '../db/models/VideoSegment.js';

export async function processVideo(videoId: string) {
    console.log(`Processing video: ${videoId}`);

    // Check if already processed by counting segments
    const segmentCount = await VideoSegmentModel.countDocuments({ videoId });
    if (segmentCount > 0) {
        console.log(`Video ${videoId} already processed (${segmentCount} segments found). Skipping.`);
        return;
    }

    // 1. Fetch
    const rawTranscript = await fetchTranscript(videoId);
    if (!rawTranscript || rawTranscript.length === 0) {
        throw new Error(`No transcript found for video ${videoId}`);
    }

    // 2. Chunk
    const chunks = chunkTranscript(rawTranscript);
    console.log(`Generated ${chunks.length} chunks for video ${videoId}`);

    // 3. Embed
    const texts = chunks.map(c => c.text);
    const embeddings = await generateEmbeddings(texts);

    // Attach embeddings to chunks
    const segmentsWithEmbeddings = chunks.map((chunk, i) => ({
        ...chunk,
        embedding: embeddings[i]
    }));

    // 4. Store
    await saveVideoSegments(videoId, segmentsWithEmbeddings);

    console.log(`Successfully processed video ${videoId}`);
}

export async function processVideos(videoIds: string[]) {
    for (const id of videoIds) {
        try {
            await processVideo(id);
        } catch (error) {
            console.error(`Failed to process video ${id}:`, error);
            // Continue with next video
        }
    }
}
