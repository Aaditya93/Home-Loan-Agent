import {
    BaseSessionService,
    CreateSessionRequest,
    Session,
    GetSessionRequest,
    ListSessionsRequest,
    ListSessionsResponse,
    DeleteSessionRequest,
    AppendEventRequest,
    createSession as adkCreateSession,
    Event
} from '@google/adk';
import SessionModel from './models/session.model.js';
// import { v4 as uuidv4 } from 'uuid'; // Recommended for IDs

export class MongoSessionService extends BaseSessionService {

    async createSession(request: CreateSessionRequest): Promise<Session> {
        // 1. Use a robust ID generator (or let Mongo do it, but explicit UUID is safer for SDKs)
        // If you don't have uuid installed, your random string is "okay" for testing but risky for prod.
        const sessionId = request.sessionId || crypto.randomUUID();

        const sessionData = {
            sessionId: sessionId,
            appName: request.appName,
            userId: request.userId,
            state: request.state || {},
            events: [],
            // Mongoose timestamps are better, but we init this for the SDK return
            lastUpdateTime: Date.now()
        };

        try {
            // 2. Create and Save
            const mongoSession = new SessionModel(sessionData);
            await mongoSession.save();

            // 3. Return the SDK-compatible Session object
            return adkCreateSession({
                id: sessionData.sessionId, // Map sessionId -> id
                appName: sessionData.appName,
                userId: sessionData.userId,
                state: sessionData.state,
                events: [],
                lastUpdateTime: sessionData.lastUpdateTime
            });
        } catch (error) {
            console.error("Failed to create session in Mongo:", error);
            throw error; // Re-throw so the SDK knows it failed
        }
    }

    async getSession(request: GetSessionRequest): Promise<Session | undefined> {
        try {
            const mongoSession = await SessionModel.findOne({
                sessionId: request.sessionId,
                userId: request.userId,
                appName: request.appName
            }).lean(); // .lean() makes it a plain JS object (faster)

            if (!mongoSession) return undefined;

            return adkCreateSession({
                id: mongoSession.sessionId,
                appName: mongoSession.appName,
                userId: mongoSession.userId,
                state: mongoSession.state,
                events: mongoSession.events as Event[],
                lastUpdateTime: mongoSession.lastUpdateTime
            });
        } catch (error) {
            console.error(`Failed to get session ${request.sessionId}:`, error);
            throw error;
        }
    }

    async listSessions(request: ListSessionsRequest): Promise<ListSessionsResponse> {
        const mongoSessions = await SessionModel.find({
            userId: request.userId,
            appName: request.appName
        })
            .sort({ lastUpdateTime: -1 })
            .lean();

        const sessions = mongoSessions.map(ms => adkCreateSession({
            id: ms.sessionId,
            appName: ms.appName,
            userId: ms.userId,
            state: ms.state,
            events: ms.events as Event[],
            lastUpdateTime: ms.lastUpdateTime
        }));

        return { sessions };
    }

    async deleteSession(request: DeleteSessionRequest): Promise<void> {
        await SessionModel.deleteOne({
            sessionId: request.sessionId,
            userId: request.userId,
            appName: request.appName
        });
    }

    // Optimized appendEvent
    override async appendEvent(request: AppendEventRequest): Promise<Event> {
        // 1. Let the parent class handle internal logic/validation
        const event = await super.appendEvent(request);

        // 2. Efficiently push ONLY the new event to MongoDB
        // We also update the 'state' because the agent might have changed its memory 
        // during this turn (e.g., "remembering" the user's name).
        await SessionModel.updateOne(
            { sessionId: request.session.id },
            {
                $push: { events: event },
                $set: {
                    state: request.session.state, // Sync the latest state
                    lastUpdateTime: Date.now()
                }
            }
        );

        return event;
    }
}