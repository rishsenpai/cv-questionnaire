import mongoose, { Schema, Model, Document, Types } from 'mongoose';

export type CuratedMatchStatus = 'presented' | 'viewed' | 'contact-requested' | 'rejected';

export interface ICuratedMatch extends Document {
    vacancyId: Types.ObjectId;
    cvId: Types.ObjectId;
    employerId: Types.ObjectId;
    status: CuratedMatchStatus;
    adminNote?: string;
    matchScore?: number;
    addedAt: Date;
    viewedAt?: Date;
    contactRequestedAt?: Date;
    rejectedAt?: Date;
    notifiedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const curatedMatchSchema = new Schema<ICuratedMatch>({
    vacancyId: { type: Schema.Types.ObjectId, ref: 'Vacancy', required: true, index: true },
    cvId: { type: Schema.Types.ObjectId, ref: 'CV', required: true, index: true },
    employerId: { type: Schema.Types.ObjectId, ref: 'Employer', required: true, index: true },
    status: { type: String, enum: ['presented', 'viewed', 'contact-requested', 'rejected'], default: 'presented', index: true },
    adminNote: { type: String, trim: true },
    matchScore: { type: Number },
    addedAt: { type: Date, default: Date.now, index: true },
    viewedAt: { type: Date },
    contactRequestedAt: { type: Date },
    rejectedAt: { type: Date },
    notifiedAt: { type: Date },
}, { timestamps: true });

curatedMatchSchema.index({ vacancyId: 1, cvId: 1 }, { unique: true });
curatedMatchSchema.index({ employerId: 1, status: 1, addedAt: -1 });

const CuratedMatch: Model<ICuratedMatch> =
    (mongoose.models.CuratedMatch as Model<ICuratedMatch>) ||
    mongoose.model<ICuratedMatch>('CuratedMatch', curatedMatchSchema);
export default CuratedMatch;
