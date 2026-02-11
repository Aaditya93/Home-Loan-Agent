export interface TranscriptItem {
    text: string;
    duration: number;
    offset: number;
}

export interface VideoSegment {
    text: string;
    startTime: number;
    duration: number;
}

export interface ProcessedVideo {
    videoId: string;
    segments: VideoSegment[];
}
