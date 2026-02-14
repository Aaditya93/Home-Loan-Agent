import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISession extends Document {
    sessionId: string;
    appName: string;
    userId: string;
    title: string;
    state: Record<string, any>;
    events: any[];
    lastUpdateTime: number;
}

const SessionSchema: Schema = new Schema({
    sessionId: { type: String, required: true, unique: true },
    appName: { type: String, required: true },
    userId: { type: String, required: true },
    title: {
        type: String,
        default: "New Chat",
        trim: true
    },
    state: { type: Schema.Types.Mixed, default: {} },
    events: { type: [Schema.Types.Mixed], default: [] },
    lastUpdateTime: { type: Number, default: Date.now }
}, { timestamps: true });


SessionSchema.index({ userId: 1, appName: 1 });


const SessionModel: Model<ISession> =
    mongoose.models.Session || mongoose.model<ISession>("Session", SessionSchema);

export default SessionModel;