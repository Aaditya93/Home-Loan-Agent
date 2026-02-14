import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Runner, isFinalResponse, stringifyContent, StreamingMode } from '@google/adk';
import { connectDB } from './db/connection.js';
import { MongoSessionService } from './db/mongo-session-service.js';
import { rootAgent } from './agent.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// --- ADK Runner Setup ---
const sessionService = new MongoSessionService();
const APP_NAME = 'home-loan-agent';
const runner = new Runner({
    appName: APP_NAME,
    agent: rootAgent,
    sessionService,

});

// Middleware
app.use(cors());
app.use(express.json());

// --- Health Check Endpoints ---

app.get('/', (_req, res) => {
    res.send('Home Loan Agent Service is Running 🚀');
});

app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: APP_NAME,
    });
});

// --- Chat Endpoint ---

app.post('/api/chat', async (req, res) => {
    try {
        const { message, sessionId: incomingSessionId, userId } = req.body;

        console.log('Received chat request:', { message, incomingSessionId, userId });

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Set headers for SSE
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        // If no sessionId provided, create a new session
        let sessionId = incomingSessionId;
        let sessionExists = false;
        if (sessionId) {
            const existingSession = await sessionService.getSession({
                appName: APP_NAME,
                userId,
                sessionId
            });
            if (existingSession) {
                sessionExists = true;
            }
        }
        if (!sessionExists) {
            const session = await sessionService.createSession({
                appName: APP_NAME,
                userId,
                sessionId

            });
            sessionId = session.id;
        }

        // Send the sessionId to the client immediately
        res.write(`data: ${JSON.stringify({ sessionId })}\n\n`);

        // Build the Content object expected by ADK
        const newMessage = {
            role: 'user' as const,
            parts: [{ text: message }],
        };
        console.log('Sending message to agent:', { newMessage });

        // Run the agent and stream events
        let eventCount = 0;
        let responseText = '';

        for await (const event of runner.runAsync({
            userId,
            sessionId,
            newMessage,
            runConfig: { streamingMode: StreamingMode.SSE }
        })) {
            eventCount++;
            const isFinal = isFinalResponse(event);

            // Extract content to stream
            const content = stringifyContent(event);
            if (content) {
                // If it's the final response, we accumulate it too
                if (isFinal) {
                    responseText += content;
                }

                // Stream the chunk to the client
                res.write(`data: ${JSON.stringify({
                    chunk: content,
                    isFinal,
                    author: event.author
                })}\n\n`);
            }

            console.log(`[Event #${eventCount}] author=${event.author}, isFinal=${isFinal}, contentLength=${content?.length}`);
        }

        console.log(`[Chat] Total events: ${eventCount}, responseText length: ${responseText.length}`);

        if (!responseText && eventCount === 0) {
            res.write(`data: ${JSON.stringify({ error: 'I was unable to generate a response. Please try again.' })}\n\n`);
        }

        res.write('event: end\ndata: {}\n\n');
        res.end();
    } catch (error: any) {
        console.error('Error processing agent request:', error);
        // If headers weren't sent yet, we can send a 500. Otherwise, we send an error event.
        if (!res.headersSent) {
            res.status(500).json({ error: 'Internal Server Error', details: error.message });
        } else {
            res.write(`data: ${JSON.stringify({ error: 'Internal Server Error', details: error.message })}\n\n`);
            res.end();
        }
    }
});

// --- Session Management Endpoints ---

// List all sessions for a user
app.get('/api/sessions', async (req, res) => {
    try {
        const userId = (req.query.userId as string) || 'default_user';
        const { sessions } = await sessionService.listSessions({ appName: APP_NAME, userId });

        const summaries = sessions.map((s) => ({
            sessionId: s.id,
            lastUpdateTime: s.lastUpdateTime,
            eventCount: s.events.length,
        }));

        res.json({ sessions: summaries });
    } catch (error: any) {
        console.error('Error listing sessions:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

// Get chat history for a specific session
app.get('/api/sessions/:sessionId', async (req, res) => {
    try {
        const userId = (req.query.userId as string) || 'default_user';
        const session = await sessionService.getSession({
            appName: APP_NAME,
            userId,
            sessionId: req.params.sessionId,
        });

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Extract readable messages from session events
        const messages = session.events
            .filter((e) => e.content?.parts?.length)
            .map((e) => ({
                role: e.author === 'user' ? 'user' : 'agent',
                text: stringifyContent(e),
                timestamp: e.timestamp,
            }));

        res.json({ sessionId: session.id, messages });
    } catch (error: any) {
        console.error('Error getting session:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

// Delete a session
app.delete('/api/sessions/:sessionId', async (req, res) => {
    try {
        const userId = (req.query.userId as string) || 'default_user';
        await sessionService.deleteSession({
            appName: APP_NAME,
            userId,
            sessionId: req.params.sessionId,
        });

        res.json({ success: true, message: 'Session deleted' });
    } catch (error: any) {
        console.error('Error deleting session:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

// --- Server Startup ---

async function startServer() {
    // Start listening FIRST so Cloud Run's health check passes immediately
    app.listen(PORT, () => {
        console.log(`✅ Server running on port ${PORT}`);
        console.log(`   Health: http://localhost:${PORT}/health`);
        console.log(`   Chat:   POST http://localhost:${PORT}/api/chat`);
    });

    // Then connect to MongoDB (non-fatal — server stays up even if DB is slow)
    try {
        await connectDB();
    } catch (error) {
        console.error('⚠️ MongoDB connection failed at startup — will retry on first request:', error);
    }
}

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('⏳ SIGTERM received — shutting down gracefully...');
    process.exit(0);
});

startServer();
