import mongoose, { Schema, Model, Document, Types } from 'mongoose';

export interface IBackupContact extends Document {
    fullName: string;
    email: string;
    phone?: string;
    cvId?: Types.ObjectId | null;
    status: 'pending' | 'cv_submitted' | 'abandoned';
    createdAt: Date;
    updatedAt: Date;
}

const backupContactSchema = new Schema<IBackupContact>({
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    cvId: { type: Schema.Types.ObjectId, ref: 'CV', default: null },
    status: { type: String, enum: ['pending', 'cv_submitted', 'abandoned'], default: 'pending' },
}, { timestamps: true });

backupContactSchema.index({ email: 1 });
backupContactSchema.index({ createdAt: -1 });

const BackupContact: Model<IBackupContact> = (mongoose.models.BackupContact as Model<IBackupContact>) || mongoose.model<IBackupContact>('BackupContact', backupContactSchema);
export default BackupContact;
