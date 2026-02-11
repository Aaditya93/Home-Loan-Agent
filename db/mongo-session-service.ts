import {
    BaseSessionService,
    CreateSessionRequest,
    Session,
    GetSessionRequest,
    ListSessionsRequest,
    ListSessionsResponse,
    DeleteSessionRequest,
    AppendEventRequest,
    createSession as adkCreateSession
} from '@google/adk';
import { SessionModel } from './models/session.model.js';
import { Event } from '@google/adk';

export class MongoSessionService extends BaseSessionService {
    async createSession(request: CreateSessionRequest): Promise<Session> {
        const sessionId = request.sessionId || Math.random().toString(36).substring(7);

        const sessionData = {
            id: sessionId,
            appName: request.appName,
            userId: request.userId,
            state: request.state || {},
            events: [],
            lastUpdateTime: Date.now()
        };

        const mongoSession = new SessionModel({
            sessionId: sessionData.id,
            appName: sessionData.appName,
            userId: sessionData.userId,
            state: sessionData.state,
            events: sessionData.events,
            lastUpdateTime: sessionData.lastUpdateTime
        });

        await mongoSession.save();

        return adkCreateSession(sessionData);
    }

    async getSession(request: GetSessionRequest): Promise<Session | undefined> {
        const mongoSession = await SessionModel.findOne({
            sessionId: request.sessionId,
            userId: request.userId,
            appName: request.appName
        });

        if (!mongoSession) return undefined;

        // ADK expects the session object with 'id' instead of 'sessionId'
        return adkCreateSession({
            id: mongoSession.sessionId,
            appName: mongoSession.appName,
            userId: mongoSession.userId,
            state: mongoSession.state,
            events: mongoSession.events as Event[],
            lastUpdateTime: mongoSession.lastUpdateTime
        });
    }

    async listSessions(request: ListSessionsRequest): Promise<ListSessionsResponse> {
        const mongoSessions = await SessionModel.find({
            userId: request.userId,
            appName: request.appName
        }).sort({ lastUpdateTime: -1 });

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

    // Override appendEvent to ensure it's saved to DB
    override async appendEvent(request: AppendEventRequest): Promise<Event> {
        const event = await super.appendEvent(request);

        await SessionModel.updateOne(
            { sessionId: request.session.id },
            {
                $push: { events: event },
                $set: {
                    state: request.session.state,
                    lastUpdateTime: Date.now()
                }
            }
        );

        return event;
    }
}
