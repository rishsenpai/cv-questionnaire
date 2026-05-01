import mongoose, { Schema, Model, Document, Types } from 'mongoose';
import bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = 12;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000;

export interface ICandidate extends Document {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    location?: string;
    linkedCvIds: Types.ObjectId[];
    isActive: boolean;
    failedLoginAttempts: number;
    lockUntil: Date | null;
    createdAt: Date;
    updatedAt: Date;

    checkPassword(password: string): Promise<boolean>;
    isLocked(): boolean;
    getLockTimeRemaining(): number;
    incLoginAttempts(): Promise<void>;
    resetLoginAttempts(): Promise<void>;
}

function isBcryptHash(s: string): boolean {
    return Boolean(s && (s.startsWith('$2b$') || s.startsWith('$2a$')));
}

const candidateSchema = new Schema<ICandidate>({
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    location: { type: String, trim: true },
    linkedCvIds: [{ type: Schema.Types.ObjectId, ref: 'CV' }],
    isActive: { type: Boolean, default: true },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
}, { timestamps: true });

candidateSchema.pre('save', async function() {
    if (!this.isModified('password') || !this.password) return;
    if (isBcryptHash(this.password)) return;
    this.password = await bcrypt.hash(this.password, BCRYPT_ROUNDS);
});

candidateSchema.methods.checkPassword = async function(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
};

candidateSchema.methods.isLocked = function(): boolean {
    return Boolean(this.lockUntil && this.lockUntil > new Date());
};

candidateSchema.methods.getLockTimeRemaining = function(): number {
    if (!this.isLocked() || !this.lockUntil) return 0;
    return Math.ceil((this.lockUntil.getTime() - Date.now()) / 60000);
};

candidateSchema.methods.incLoginAttempts = async function(): Promise<void> {
    if (this.lockUntil && this.lockUntil < new Date()) {
        await this.updateOne({
            $set: { failedLoginAttempts: 1 },
            $unset: { lockUntil: 1 },
        });
        return;
    }
    const updates: Record<string, unknown> = { $inc: { failedLoginAttempts: 1 } };
    if (this.failedLoginAttempts + 1 >= MAX_LOGIN_ATTEMPTS && !this.isLocked()) {
        updates.$set = { lockUntil: new Date(Date.now() + LOCK_TIME_MS) };
        console.log(`[SECURITY] Account locked for candidate: ${this.email}`);
    }
    await this.updateOne(updates);
};

candidateSchema.methods.resetLoginAttempts = async function(): Promise<void> {
    if (this.failedLoginAttempts > 0 || this.lockUntil) {
        await this.updateOne({
            $set: { failedLoginAttempts: 0 },
            $unset: { lockUntil: 1 },
        });
    }
};

const Candidate: Model<ICandidate> = (mongoose.models.Candidate as Model<ICandidate>) || mongoose.model<ICandidate>('Candidate', candidateSchema);
export default Candidate;
