import mongoose, { Schema, Model, Document, Types } from 'mongoose';

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
    embedding: { type: [Number], select: false },
    embeddingModel: { type: String, default: 'text-embedding-3-small' },
    viewCount: { type: Number, default: 0 },
    applicationCount: { type: Number, default: 0 },
}, { timestamps: true });

vacancySchema.index({ externalId: 1, source: 1 }, { unique: true, sparse: true });

const Vacancy: Model<IVacancy> = (mongoose.models.Vacancy as Model<IVacancy>) || mongoose.model<IVacancy>('Vacancy', vacancySchema);
export default Vacancy;
