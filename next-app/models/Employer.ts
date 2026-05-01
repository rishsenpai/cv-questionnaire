import mongoose, { Schema, Model, Document, Types } from 'mongoose';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const BCRYPT_ROUNDS = 12;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000;

export interface IEmployerNote {
    cvId: Types.ObjectId;
    text: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IEmployer extends Document {
    username: string;
    password: string;
    companyName: string;
    contactEmail?: string;
    plan: 'basic' | 'advanced' | 'premium';
    isActive: boolean;
    failedLoginAttempts: number;
    lockUntil: Date | null;
    favorites: Types.ObjectId[];
    notes: IEmployerNote[];
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

const employerSchema = new Schema<IEmployer>({
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    companyName: { type: String, required: true, trim: true },
    contactEmail: { type: String, trim: true, lowercase: true },
    plan: { type: String, enum: ['basic', 'advanced', 'premium'], default: 'basic' },
    isActive: { type: Boolean, default: true },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
    favorites: [{ type: Schema.Types.ObjectId, ref: 'CV' }],
    notes: [{
        cvId: { type: Schema.Types.ObjectId, ref: 'CV', required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
    }],
}, { timestamps: true });

employerSchema.pre('save', async function() {
    if (!this.isModified('password') || !this.password) return;
    if (isBcryptHash(this.password)) return;
    this.password = await bcrypt.hash(this.password, BCRYPT_ROUNDS);
});

employerSchema.methods.checkPassword = async function(password: string): Promise<boolean> {
    if (isBcryptHash(this.password)) {
        return bcrypt.compare(password, this.password);
    }
    const sha256Hash = crypto.createHash('sha256').update(password).digest('hex');
    if (this.password === sha256Hash) {
        this.password = await bcrypt.hash(password, BCRYPT_ROUNDS);
        await this.save();
        console.log(`[SECURITY] Migrated password to bcrypt for employer: ${this.username}`);
        return true;
    }
    return false;
};

employerSchema.methods.isLocked = function(): boolean {
    return Boolean(this.lockUntil && this.lockUntil > new Date());
};

employerSchema.methods.getLockTimeRemaining = function(): number {
    if (!this.isLocked() || !this.lockUntil) return 0;
    return Math.ceil((this.lockUntil.getTime() - Date.now()) / 60000);
};

employerSchema.methods.incLoginAttempts = async function(): Promise<void> {
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
        console.log(`[SECURITY] Account locked for employer: ${this.username}`);
    }
    await this.updateOne(updates);
};

employerSchema.methods.resetLoginAttempts = async function(): Promise<void> {
    if (this.failedLoginAttempts > 0 || this.lockUntil) {
        await this.updateOne({
            $set: { failedLoginAttempts: 0 },
            $unset: { lockUntil: 1 },
        });
    }
};

const Employer: Model<IEmployer> = (mongoose.models.Employer as Model<IEmployer>) || mongoose.model<IEmployer>('Employer', employerSchema);
export default Employer;
