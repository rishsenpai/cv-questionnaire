import mongoose, { Schema, Model, Document } from 'mongoose';
import { inferCountry } from '@/lib/country';

export interface ICV extends Document {
    fullName: string;
    email?: string;
    phone?: string;
    location?: string;
    birthDate?: string;
    jobTitle?: string;
    summary?: string;
    languages?: string;
    experience?: string;
    education?: string;
    skills?: string;
    achievements?: string;
    emailSent?: boolean;
    fullText?: string;
    fileName?: string;
    fileData?: string;
    fileUrl?: string;
    fileType?: string;
    fileSize?: number;
    country?: 'guyana' | 'netherlands' | 'suriname';
    embedding?: number[];
    embeddingModel?: string;
    textHash?: string;
    recruiterRequested?: boolean;
    recruiterRequestedAt?: Date;
    isInternal?: boolean;
    driveFileId?: string;
    externalJobsCache?: { jobs: unknown[]; totalJobs: number; fetchedAt: Date };
    createdAt: Date;
    updatedAt: Date;
}

const cvSchema = new Schema<ICV>({
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: false, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    location: { type: String, trim: true },
    birthDate: { type: String, trim: true },
    jobTitle: { type: String, trim: true },
    summary: { type: String, trim: true },
    languages: { type: String, trim: true },
    experience: { type: String, trim: true },
    education: { type: String, trim: true },
    skills: { type: String, trim: true },
    achievements: { type: String, trim: true },
    emailSent: { type: Boolean, default: false },
    fullText: { type: String },
    fileName: { type: String, trim: true },
    fileData: { type: String },
    fileUrl: { type: String, trim: true },
    fileType: { type: String, trim: true },
    fileSize: { type: Number },
    country: { type: String, enum: ['guyana', 'netherlands', 'suriname'], index: true },
    embedding: { type: [Number], select: false },
    embeddingModel: { type: String, default: 'text-embedding-3-small' },
    textHash: { type: String, index: true },
    recruiterRequested: { type: Boolean, default: false },
    recruiterRequestedAt: { type: Date },
    isInternal: { type: Boolean, default: false },
    driveFileId: { type: String, trim: true, index: { unique: true, sparse: true } },
    externalJobsCache: {
        jobs: { type: [Schema.Types.Mixed], default: undefined },
        totalJobs: Number,
        fetchedAt: Date,
    },
}, { timestamps: true });

// BM25 / text-search index voor hybrid matching. Eén text index per
// collection toegestaan — weights laten jobTitle/skills zwaarder
// meewegen dan losse experience-zinnen.
cvSchema.index({
    fullName: 'text',
    jobTitle: 'text',
    skills: 'text',
    experience: 'text',
    education: 'text',
    summary: 'text',
    achievements: 'text',
    fullText: 'text',
}, {
    name: 'cv_text_search',
    weights: {
        jobTitle: 10,
        skills: 8,
        experience: 5,
        summary: 3,
        education: 2,
        fullText: 1,
        fullName: 1,
        achievements: 1,
    },
});

// Auto-fill country uit location bij create/save als die nog niet expliciet is gezet.
// Fallback naar experience/education/skills/fullText voor CVs zonder duidelijke
// location maar wel met NL-signalen (WFT, AOW, Nederlandse steden, etc).
cvSchema.pre('save', async function () {
    if (!this.country) {
        const fallback = [this.experience, this.education, this.skills, this.fullText]
            .filter(Boolean).join(' ');
        const c = inferCountry(this.location, fallback || undefined);
        if (c) this.country = c;
    }
});

const CV: Model<ICV> = (mongoose.models.CV as Model<ICV>) || mongoose.model<ICV>('CV', cvSchema);
export default CV;
