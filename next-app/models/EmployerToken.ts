import mongoose, { Schema, Model, Document, Types } from 'mongoose';

export interface IEmployerToken extends Document {
    token: string;
    employerId: Types.ObjectId;
    expires: Date;
    createdAt: Date;
    updatedAt: Date;
}

const employerTokenSchema = new Schema<IEmployerToken>({
    token: { type: String, required: true, unique: true, index: true },
    employerId: { type: Schema.Types.ObjectId, ref: 'Employer', required: true },
    expires: { type: Date, required: true },
}, { timestamps: true });

employerTokenSchema.index({ expires: 1 }, { expireAfterSeconds: 0 });

const EmployerToken: Model<IEmployerToken> = (mongoose.models.EmployerToken as Model<IEmployerToken>) || mongoose.model<IEmployerToken>('EmployerToken', employerTokenSchema);
export default EmployerToken;
