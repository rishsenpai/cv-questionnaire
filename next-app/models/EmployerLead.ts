import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IEmployerLead extends Document {
    companyName?: string;
    contactName?: string;
    email?: string;
    phone?: string;
    vacancyTitle?: string;
    vacancyText: string;
    fileName?: string;
    matchCount: number;
    topScore?: number;
    ipAddress?: string;
    userAgent?: string;
    createdAt: Date;
}

const employerLeadSchema = new Schema<IEmployerLead>({
    companyName: { type: String, trim: true },
    contactName: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true, index: true },
    phone: { type: String, trim: true },
    vacancyTitle: { type: String, trim: true },
    vacancyText: { type: String, required: true },
    fileName: { type: String, trim: true },
    matchCount: { type: Number, default: 0 },
    topScore: { type: Number },
    ipAddress: { type: String, trim: true },
    userAgent: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now, index: true, expires: 60 * 60 * 24 * 365 },
});

const EmployerLead: Model<IEmployerLead> =
    (mongoose.models.EmployerLead as Model<IEmployerLead>) ||
    mongoose.model<IEmployerLead>('EmployerLead', employerLeadSchema);
export default EmployerLead;
