import mongoose, { Schema, Model, Document, Types } from 'mongoose';

export type ResetUserType = 'candidate' | 'employer';

export interface IPasswordResetToken extends Document {
    userType: ResetUserType;
    userId: Types.ObjectId;
    // Alleen de SHA-256 hash van de token wordt opgeslagen; de ruwe token
    // leeft enkel in de e-maillink. Zo is een DB-lek niet direct bruikbaar.
    tokenHash: string;
    expires: Date;
    createdAt: Date;
    updatedAt: Date;
}

const passwordResetTokenSchema = new Schema<IPasswordResetToken>({
    userType: { type: String, enum: ['candidate', 'employer'], required: true },
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    expires: { type: Date, required: true },
}, { timestamps: true });

// TTL-index: MongoDB ruimt verlopen tokens automatisch op.
passwordResetTokenSchema.index({ expires: 1 }, { expireAfterSeconds: 0 });

const PasswordResetToken: Model<IPasswordResetToken> =
    (mongoose.models.PasswordResetToken as Model<IPasswordResetToken>) ||
    mongoose.model<IPasswordResetToken>('PasswordResetToken', passwordResetTokenSchema);

export default PasswordResetToken;
