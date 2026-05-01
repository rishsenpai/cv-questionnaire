import mongoose, { Schema, Model, Document } from 'mongoose';

export type AnalyticsEventType =
    | 'pageview'
    | 'cv_submission'
    | 'cv_upload'
    | 'cv_manual'
    | 'vacancy_search'
    | 'vacancy_match'
    | 'language_change'
    | 'high_match';

export interface IAnalytics extends Document {
    eventType: AnalyticsEventType;
    page?: string;
    referrer?: string;
    userAgent?: string;
    device?: { type?: 'desktop' | 'mobile' | 'tablet' | 'unknown'; os?: string; osVersion?: string };
    browser?: { name?: string; version?: string };
    screen?: { width?: number; height?: number };
    language?: string;
    geo?: { ip?: string; country?: string; countryCode?: string; city?: string; region?: string; lat?: number; lon?: number };
    sessionId?: string;
    metadata?: Record<string, unknown>;
    createdAt: Date;
}

const analyticsSchema = new Schema<IAnalytics>({
    eventType: {
        type: String,
        required: true,
        enum: ['pageview', 'cv_submission', 'cv_upload', 'cv_manual', 'vacancy_search', 'vacancy_match', 'language_change', 'high_match'],
    },
    page: String,
    referrer: String,
    userAgent: String,
    device: {
        type: { type: String, enum: ['desktop', 'mobile', 'tablet', 'unknown'] },
        os: String,
        osVersion: String,
    },
    browser: { name: String, version: String },
    screen: { width: Number, height: Number },
    language: String,
    geo: {
        ip: String,
        country: String,
        countryCode: String,
        city: String,
        region: String,
        lat: Number,
        lon: Number,
    },
    sessionId: String,
    metadata: Schema.Types.Mixed,
    createdAt: { type: Date, default: Date.now, index: true },
});

analyticsSchema.index({ eventType: 1, createdAt: -1 });
analyticsSchema.index({ 'geo.countryCode': 1 });
analyticsSchema.index({ page: 1 });
analyticsSchema.index({ sessionId: 1 });
analyticsSchema.index({ 'device.type': 1 });
analyticsSchema.index({ 'browser.name': 1 });

const Analytics: Model<IAnalytics> = (mongoose.models.Analytics as Model<IAnalytics>) || mongoose.model<IAnalytics>('Analytics', analyticsSchema);
export default Analytics;
