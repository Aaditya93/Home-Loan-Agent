import { VideoSegmentModel, IVideoSegment } from '../db/models/VideoSegment.js';

export interface SegmentData {
    text: string;
    startTime: number;
    duration: number;
    embedding?: number[];
}

export async function saveVideoSegments(videoId: string, segments: SegmentData[], title?: string) {
    try {
        const operations = segments.map(segment => ({
            updateOne: {
                filter: { videoId, startTime: segment.startTime },
                update: {
                    $set: {
                        videoId,
                        title,
                        text: segment.text,
                        startTime: segment.startTime,
                        duration: segment.duration,
                        embedding: segment.embedding,
                        processedAt: new Date()
                    }
                },
                upsert: true
            }
        }));

        if (operations.length > 0) {
            await VideoSegmentModel.bulkWrite(operations);
            console.log(`Saved ${operations.length} segments for video ${videoId}`);
        }
    } catch (error) {
        console.error(`Error saving segments for video ${videoId}:`, error);
        throw error;
    }
}
