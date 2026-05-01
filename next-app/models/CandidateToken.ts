import mongoose, { Schema, Model, Document, Types } from 'mongoose';

export interface ICandidateToken extends Document {
    token: string;
    candidateId: Types.ObjectId;
    expires: Date;
    createdAt: Date;
    updatedAt: Date;
}

const candidateTokenSchema = new Schema<ICandidateToken>({
    token: { type: String, required: true, unique: true, index: true },
    candidateId: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true },
    expires: { type: Date, required: true },
}, { timestamps: true });

candidateTokenSchema.index({ expires: 1 }, { expireAfterSeconds: 0 });

const CandidateToken: Model<ICandidateToken> = (mongoose.models.CandidateToken as Model<ICandidateToken>) || mongoose.model<ICandidateToken>('CandidateToken', candidateTokenSchema);
export default CandidateToken;
