import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Runner, isFinalResponse, stringifyContent } from '@google/adk';
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
        const { message, sessionId: incomingSessionId, userId = 'default_user' } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // If no sessionId provided, create a new session
        let sessionId = incomingSessionId;
        if (!sessionId) {
            const session = await sessionService.createSession({
                appName: APP_NAME,
                userId,
            });
            sessionId = session.id;
        }

        // Build the Content object expected by ADK
        const newMessage = {
            role: 'user' as const,
            parts: [{ text: message }],
        };

        // Run the agent and collect events
        let responseText = '';
        let eventCount = 0;
        for await (const event of runner.runAsync({ userId, sessionId, newMessage })) {
            eventCount++;
            const isFinal = isFinalResponse(event);
            console.log(`[Event #${eventCount}] author=${event.author}, isFinal=${isFinal}, parts=${JSON.stringify(event.content?.parts?.map(p => p.text ? 'text' : p.functionCall ? 'functionCall' : 'other'))}`);
            if (isFinal) {
                responseText += stringifyContent(event);
            }
        }

        console.log(`[Chat] Total events: ${eventCount}, responseText length: ${responseText.length}`);

        if (!responseText) {
            responseText = 'I was unable to generate a response. Please try again.';
        }

        res.json({ response: responseText, sessionId });
    } catch (error: any) {
        console.error('Error processing agent request:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
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
