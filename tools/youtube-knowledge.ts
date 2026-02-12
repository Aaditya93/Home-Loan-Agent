/**
 * Tool checks the knowledge base of YouTube videos for relevant information
 */
import { z } from 'zod';
import { FunctionTool } from '@google/adk';
import { searchRelevantSegments } from '../youtube-rag/retrieval.js';
import { connectDB } from '../db/connection.js';

export const youtubeKnowledge = new FunctionTool({
    name: 'youtube_knowledge',
    description: 'SEARCH THIS FIRST for almost all home loan questions. This tool searches a knowledge base of expert YouTube videos to find real-world advice, explanations, and tips.',
    parameters: z.object({
        query: z.string().describe('The user\'s question or search query'),
    }),
    execute: async ({ query }) => {
        await connectDB();
        try {
            console.log(`Searching YouTube knowledge base for: "${query}"`);
            const results = await searchRelevantSegments(query, 5);

            if (results.length === 0) {
                return {
                    response: "I couldn't find any relevant information in the video knowledge base."
                };
            }

            const context = results.map((r, i) => {
                const segment = r.segment;
                return `[Result ${i + 1}]
Video ID: https://youtu.be/${segment.videoId}?t=${Math.floor(segment.startTime)}
Title: ${segment.title || 'Unknown Title'}
Relevance: ${(r.similarity * 100).toFixed(1)}%
Content: ${segment.text}
-------------------`;
            }).join('\n');

            return {
                response: `Found relevant information from YouTube videos:\n\n${context}`
            };
        } catch (error: any) {
            console.error("Error searching YouTube knowledge base:", error);
            return {
                response: `Error searching knowledge base: ${error.message}`
            };
        }
    }
});
