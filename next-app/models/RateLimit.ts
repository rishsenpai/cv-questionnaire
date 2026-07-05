import mongoose, { Schema, Model, Document } from 'mongoose';

// Eén document per (sleutel + tijdvenster-bucket). De count wordt atomair
// opgehoogd via findOneAndUpdate+upsert, zodat de teller ook klopt als meerdere
// serverless-instances tegelijk requests afhandelen (in-memory zou per instance
// resetten en op Vercel dus niet werken).
export interface IRateLimit extends Document {
    key: string;
    count: number;
    expiresAt: Date;
}

const rateLimitSchema = new Schema<IRateLimit>({
    key: { type: String, required: true, unique: true, index: true },
    count: { type: Number, required: true, default: 0 },
    expiresAt: { type: Date, required: true },
});

// TTL-index ruimt verlopen buckets automatisch op.
rateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RateLimit: Model<IRateLimit> =
    (mongoose.models.RateLimit as Model<IRateLimit>) ||
    mongoose.model<IRateLimit>('RateLimit', rateLimitSchema);
export default RateLimit;
