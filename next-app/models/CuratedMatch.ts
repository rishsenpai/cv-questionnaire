import mongoose, { Schema, Model, Document, Types } from 'mongoose';

// 'suggested' = AI-gegenereerd, alleen zichtbaar voor admin tot promote → 'presented'.
export type CuratedMatchStatus = 'suggested' | 'presented' | 'viewed' | 'contact-requested' | 'rejected';

export type CuratedMatchSource = 'admin' | 'auto-embedding' | 'auto-tfidf';

export interface ICuratedMatch extends Document {
    vacancyId: Types.ObjectId;
    cvId: Types.ObjectId;
    // Optioneel: admin/internal vacatures hebben geen werkgever-eigenaar.
    // Voor die matches is de admin de "ontvanger" (email naar APPLICATIONS_EMAIL).
    employerId?: Types.ObjectId;
    status: CuratedMatchStatus;
    source: CuratedMatchSource;
    adminNote?: string;
    matchScore?: number;
    addedAt: Date;
    viewedAt?: Date;
    contactRequestedAt?: Date;
    rejectedAt?: Date;
    notifiedAt?: Date;
    promotedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const curatedMatchSchema = new Schema<ICuratedMatch>({
    vacancyId: { type: Schema.Types.ObjectId, ref: 'Vacancy', required: true, index: true },
    cvId: { type: Schema.Types.ObjectId, ref: 'CV', required: true, index: true },
    employerId: { type: Schema.Types.ObjectId, ref: 'Employer', required: false, index: true },
    status: { type: String, enum: ['suggested', 'presented', 'viewed', 'contact-requested', 'rejected'], default: 'presented', index: true },
    source: { type: String, enum: ['admin', 'auto-embedding', 'auto-tfidf'], default: 'admin', index: true },
    adminNote: { type: String, trim: true },
    matchScore: { type: Number },
    addedAt: { type: Date, default: Date.now, index: true },
    viewedAt: { type: Date },
    contactRequestedAt: { type: Date },
    rejectedAt: { type: Date },
    notifiedAt: { type: Date },
    promotedAt: { type: Date },
}, { timestamps: true });

curatedMatchSchema.index({ vacancyId: 1, cvId: 1 }, { unique: true });
curatedMatchSchema.index({ employerId: 1, status: 1, addedAt: -1 });

const CuratedMatch: Model<ICuratedMatch> =
    (mongoose.models.CuratedMatch as Model<ICuratedMatch>) ||
    mongoose.model<ICuratedMatch>('CuratedMatch', curatedMatchSchema);
export default CuratedMatch;
