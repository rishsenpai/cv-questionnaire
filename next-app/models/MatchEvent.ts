import mongoose, { Schema, Model, Document, Types } from 'mongoose';

export type MatchSource = 'jobseeker' | 'admin-cv' | 'admin-vacancy' | 'employer-public' | 'apply';
export type MatchType = 'AI Semantic' | 'TF-IDF';

export interface IMatchEvent extends Document {
    cvId?: Types.ObjectId;
    cvFullName?: string;
    vacancyId?: Types.ObjectId;
    vacancyTitle?: string;
    score: number;
    matchType: MatchType;
    source: MatchSource;
    employerLeadId?: Types.ObjectId;
    // Cross-link naar CuratedMatch wanneer dezelfde actie ook in het werkgever-portaal
    // verschijnt (bv. apply die meteen een 'contact-requested' match aanmaakt).
    curatedMatchId?: Types.ObjectId;
    createdAt: Date;
}

const matchEventSchema = new Schema<IMatchEvent>({
    cvId: { type: Schema.Types.ObjectId, ref: 'CV', index: true },
    cvFullName: { type: String, trim: true },
    vacancyId: { type: Schema.Types.ObjectId, ref: 'Vacancy', index: true },
    vacancyTitle: { type: String, trim: true },
    score: { type: Number, required: true },
    matchType: { type: String, enum: ['AI Semantic', 'TF-IDF'], required: true },
    source: { type: String, enum: ['jobseeker', 'admin-cv', 'admin-vacancy', 'employer-public', 'apply'], required: true, index: true },
    employerLeadId: { type: Schema.Types.ObjectId, ref: 'EmployerLead', index: true },
    curatedMatchId: { type: Schema.Types.ObjectId, ref: 'CuratedMatch', index: true },
    createdAt: { type: Date, default: Date.now, index: true, expires: 60 * 60 * 24 * 90 },
});

matchEventSchema.index({ cvId: 1, vacancyId: 1, createdAt: -1 });
matchEventSchema.index({ source: 1, createdAt: -1 });

const MatchEvent: Model<IMatchEvent> =
    (mongoose.models.MatchEvent as Model<IMatchEvent>) ||
    mongoose.model<IMatchEvent>('MatchEvent', matchEventSchema);
export default MatchEvent;
