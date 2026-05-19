import mongoose, { Schema, Model, Document, Types } from 'mongoose';
import { inferCountry } from '@/lib/country';

export interface IVacancySalary {
    min?: number;
    max?: number;
    currency?: string;
    period?: string;
}

export interface IVacancy extends Document {
    employerId?: Types.ObjectId;
    title: string;
    description?: string;
    location?: string;
    requirements?: string;
    company?: string;
    companyLogo?: string;
    externalId?: string;
    source?: string;
    applyLink?: string;
    employmentType?: string;
    isRemote?: boolean;
    salary?: IVacancySalary;
    postedAt?: Date;
    fullText?: string;
    fileName?: string;
    fileData?: string;
    fileType?: string;
    isActive?: boolean;
    fulfilledAt?: Date | null;
    country?: 'guyana' | 'netherlands' | 'suriname';
    embedding?: number[];
    embeddingModel?: string;
    viewCount?: number;
    applicationCount?: number;
    createdAt: Date;
    updatedAt: Date;
}

const vacancySchema = new Schema<IVacancy>({
    employerId: { type: Schema.Types.ObjectId, ref: 'Employer', required: false },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    location: { type: String, trim: true },
    requirements: { type: String, trim: true },
    company: { type: String, trim: true },
    companyLogo: { type: String, trim: true },
    externalId: { type: String, trim: true, index: true },
    source: { type: String, trim: true, default: 'internal' },
    applyLink: { type: String, trim: true },
    employmentType: { type: String, trim: true },
    isRemote: { type: Boolean, default: false },
    salary: {
        min: Number,
        max: Number,
        currency: String,
        period: String,
    },
    postedAt: { type: Date },
    fullText: { type: String },
    fileName: { type: String, trim: true },
    fileData: { type: String },
    fileType: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    fulfilledAt: { type: Date, default: null, index: true },
    country: { type: String, enum: ['guyana', 'netherlands', 'suriname'], index: true },
    embedding: { type: [Number], select: false },
    embeddingModel: { type: String, default: 'text-embedding-3-small' },
    viewCount: { type: Number, default: 0 },
    applicationCount: { type: Number, default: 0 },
}, { timestamps: true });

// BM25 / text-search index voor hybrid matching met CVs.
vacancySchema.index({
    title: 'text',
    description: 'text',
    requirements: 'text',
    company: 'text',
    fullText: 'text',
}, {
    name: 'vacancy_text_search',
    weights: {
        title: 10,
        requirements: 5,
        description: 3,
        company: 2,
        fullText: 1,
    },
});

vacancySchema.pre('save', async function () {
    if (!this.country) {
        const fallback = [this.title, this.description, this.requirements, this.fullText]
            .filter(Boolean).join(' ');
        const c = inferCountry(this.location, fallback || undefined);
        if (c) this.country = c;
    }
});

vacancySchema.index(
    { externalId: 1, source: 1 },
    {
        unique: true,
        partialFilterExpression: { externalId: { $type: 'string' } },
    },
);

const Vacancy: Model<IVacancy> = (mongoose.models.Vacancy as Model<IVacancy>) || mongoose.model<IVacancy>('Vacancy', vacancySchema);
export default Vacancy;
