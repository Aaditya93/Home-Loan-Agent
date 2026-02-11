import { GoogleGenerativeAI, TaskType } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "models/gemini-embedding-001" });

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
        const result = await model.batchEmbedContents({
            requests: texts.map(text => ({
                content: { role: 'user', parts: [{ text }] },
                taskType: TaskType.RETRIEVAL_DOCUMENT,
                title: "YouTube Transcript Chunk"
            }))
        });

        return result.embeddings.map(e => e.values);
    } catch (error) {
        console.error("Error generating embeddings:", error);
        throw error;
    }
}
