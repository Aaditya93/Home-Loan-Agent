import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './db/connection.js';
import { SessionModel } from './db/models/session.model.js';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080; // Cloud Run expects 8080 by default

// Middleware
app.use(cors());
app.use(express.json());

// Health Check Endpoints
app.get('/', (req, res) => {
    res.send('Home Loan Agent Service is Running 🚀');
});

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'home-loan-agent'
    });
});

// Agent Interaction Endpoint with Persistence
app.post('/api/chat', async (req, res) => {
    try {
        const { message, sessionId, userId } = req.body;

        if (!message || !sessionId) {
            return res.status(400).json({ error: 'Message and sessionId are required' });
        }

        // 1. Retrieve or Create Session
        let session = await SessionModel.findOne({ sessionId });

        if (!session) {
            session = new SessionModel({
                sessionId,
                userId: userId || 'anonymous',
                appName: 'home-loan-agent',
                events: []
            });
        }

        // 2. Add User Message to History
        session.events.push({ role: 'user', content: message, timestamp: new Date() });

        // 3. Prepare History for Agent
        // Note: The specific format depends on the Agent SDK.
        // For standard LlmAgent, we usually pass the input. 
        // If the agent supports history, we would pass it here.
        // For now, we are simulating the agent execution or using a simple run.
        console.log(`Processing message for session ${sessionId}: ${message}`);

        // TODO: Replace with actual agent execution:
        // const result = await rootAgent.run({ input: message, history: session.events });
        // const responseContent = result.output;

        // Simulating response for now to ensure server stability
        const responseContent = "I received your message. (Persistence is active. History has been updated.)";

        // 4. Update Session with Agent Response
        session.events.push({ role: 'model', content: responseContent, timestamp: new Date() });
        session.lastUpdateTime = Date.now();
        await session.save();

        res.json({
            response: responseContent,
            sessionId: session.sessionId
        });

    } catch (error: any) {
        console.error('Error processing agent request:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

// Start Server
async function startServer() {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`✅ Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
