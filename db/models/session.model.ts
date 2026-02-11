import mongoose, { Schema, Document } from 'mongoose';

export interface ISession extends Document {
    sessionId: string;
    appName: string;
    userId: string;
    state: Record<string, any>;
    events: any[];
    lastUpdateTime: number;
}

const SessionSchema: Schema = new Schema({
    sessionId: { type: String, required: true, unique: true },
    appName: { type: String, required: true },
    userId: { type: String, required: true },
    state: { type: Schema.Types.Mixed, default: {} },
    events: { type: [Schema.Types.Mixed], default: [] },
    lastUpdateTime: { type: Number, default: Date.now }
}, { timestamps: true });

// Index for quick lookup by sessionId
SessionSchema.index({ sessionId: 1 });
SessionSchema.index({ userId: 1, appName: 1 });

export const SessionModel = mongoose.model<ISession>('Session', SessionSchema);
