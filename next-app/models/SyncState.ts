import mongoose, { Schema, Model, Document } from 'mongoose';

export interface ISyncState extends Document {
    key: string;
    value?: unknown;
    createdAt: Date;
    updatedAt: Date;
}

const syncStateSchema = new Schema<ISyncState>({
    key: { type: String, required: true, unique: true, trim: true },
    value: { type: Schema.Types.Mixed },
}, { timestamps: true });

const SyncState: Model<ISyncState> = (mongoose.models.SyncState as Model<ISyncState>) || mongoose.model<ISyncState>('SyncState', syncStateSchema);
export default SyncState;
