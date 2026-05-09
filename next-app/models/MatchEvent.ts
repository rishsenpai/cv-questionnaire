import mongoose, { Schema, Model, Document, Types } from 'mongoose';

export type MatchSource = 'jobseeker' | 'admin-cv' | 'admin-vacancy';
export type MatchType = 'AI Semantic' | 'TF-IDF';

export interface IMatchEvent extends Document {
    cvId?: Types.ObjectId;
    cvFullName?: string;
    vacancyId?: Types.ObjectId;
    vacancyTitle?: string;
    score: number;
    matchType: MatchType;
    source: MatchSource;
    createdAt: Date;
}

const matchEventSchema = new Schema<IMatchEvent>({
    cvId: { type: Schema.Types.ObjectId, ref: 'CV', index: true },
    cvFullName: { type: String, trim: true },
    vacancyId: { type: Schema.Types.ObjectId, ref: 'Vacancy', index: true },
    vacancyTitle: { type: String, trim: true },
    score: { type: Number, required: true },
    matchType: { type: String, enum: ['AI Semantic', 'TF-IDF'], required: true },
    source: { type: String, enum: ['jobseeker', 'admin-cv', 'admin-vacancy'], required: true, index: true },
    createdAt: { type: Date, default: Date.now, index: true, expires: 60 * 60 * 24 * 90 },
});

matchEventSchema.index({ cvId: 1, vacancyId: 1, createdAt: -1 });
matchEventSchema.index({ source: 1, createdAt: -1 });

const MatchEvent: Model<IMatchEvent> =
    (mongoose.models.MatchEvent as Model<IMatchEvent>) ||
    mongoose.model<IMatchEvent>('MatchEvent', matchEventSchema);
export default MatchEvent;
