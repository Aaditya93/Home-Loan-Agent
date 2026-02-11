import mongoose, { Schema, Document } from 'mongoose';

export interface IVideoSegment extends Document {
    videoId: string;
    title?: string;
    text: string;
    startTime: number;
    duration: number;
    embedding?: number[];
    metadata?: Record<string, any>;
    processedAt: Date;
}

const VideoSegmentSchema = new Schema(
    {
        videoId: { type: String, required: true, index: true }, // Index for fast retrieval of all segments for a video
        title: { type: String },
        text: { type: String, required: true },
        startTime: { type: Number, required: true },
        duration: { type: Number, required: true },
        embedding: { type: [Number], select: false }, // Hide embeddings by default
        metadata: { type: Schema.Types.Mixed },
        processedAt: { type: Date, default: Date.now }
    },
    { timestamps: true }
);

// Compound index to ensure uniqueness of a segment if needed, 
// or just to query specific parts. 
// For now, videoId + startTime is a good candidate for uniqueness to avoid duplicates
VideoSegmentSchema.index({ videoId: 1, startTime: 1 }, { unique: true });

export const VideoSegmentModel = mongoose.model<IVideoSegment>(
    'VideoSegment',
    VideoSegmentSchema
);
