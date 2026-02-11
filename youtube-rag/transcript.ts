import { spawn } from 'child_process';
import path from 'path';
import { TranscriptItem, VideoSegment } from './types.js';

export async function fetchTranscript(videoId: string): Promise<TranscriptItem[]> {
    return new Promise((resolve, reject) => {
        const pythonScript = path.resolve(process.cwd(), 'scripts/fetch_transcript.py');
        const pythonExec = path.resolve(process.cwd(), '.venv/bin/python');
        const pythonProcess = spawn(pythonExec, [pythonScript, videoId]);

        let dataString = '';
        let errorString = '';

        pythonProcess.stdout.on('data', (data) => {
            dataString += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            errorString += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`Python script exited with code ${code}: ${errorString || dataString}`));
                return;
            }

            try {
                const result = JSON.parse(dataString);
                if (result.error) {
                    reject(new Error(result.error));
                } else {
                    resolve(result as TranscriptItem[]);
                }
            } catch (error) {
                reject(new Error(`Failed to parse Python script output: ${dataString}`));
            }
        });
    });
}

export function chunkTranscript(transcript: TranscriptItem[], minWords: number = 150, maxWords: number = 300): VideoSegment[] {
    const chunks: VideoSegment[] = [];
    let currentChunk: TranscriptItem[] = [];
    let currentWordCount = 0;

    for (const item of transcript) {
        const wordCount = item.text.split(/\s+/).length;

        // If adding this item exceeds max words and we have enough content, push chunk
        if (currentWordCount + wordCount > maxWords && currentWordCount >= minWords) {
            chunks.push(createChunk(currentChunk));
            currentChunk = [];
            currentWordCount = 0;
        }

        currentChunk.push(item);
        currentWordCount += wordCount;
    }

    // Add remaining items if any
    if (currentChunk.length > 0) {
        chunks.push(createChunk(currentChunk));
    }

    return chunks;
}

function createChunk(items: TranscriptItem[]): VideoSegment {
    const text = items.map(item => item.text).join(' ');
    const startTime = items[0].offset;
    const endTime = items[items.length - 1].offset + items[items.length - 1].duration;

    return {
        text,
        startTime,
        duration: endTime - startTime
    };
}
