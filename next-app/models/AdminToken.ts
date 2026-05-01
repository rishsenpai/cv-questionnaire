import mongoose, { Schema, Model, Document } from 'mongoose';

export interface IAdminToken extends Document {
    token: string;
    expires: Date;
    createdAt: Date;
    updatedAt: Date;
}

const adminTokenSchema = new Schema<IAdminToken>({
    token: { type: String, required: true, unique: true, index: true },
    expires: { type: Date, required: true },
}, { timestamps: true });

adminTokenSchema.index({ expires: 1 }, { expireAfterSeconds: 0 });

const AdminToken: Model<IAdminToken> = (mongoose.models.AdminToken as Model<IAdminToken>) || mongoose.model<IAdminToken>('AdminToken', adminTokenSchema);
export default AdminToken;
