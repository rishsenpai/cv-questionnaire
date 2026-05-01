import mongoose from 'mongoose';

declare global {
    var __mongoose: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } | undefined;
}

function resolveMongoUri(): string {
    if (process.env.NODE_ENV === 'test') {
        const testUri = process.env.MONGODB_URI_TEST;
        if (!testUri) throw new Error('MONGODB_URI_TEST is required when NODE_ENV=test');
        if (!/test/i.test(testUri)) {
            throw new Error('MONGODB_URI_TEST must point to a database whose name contains "test"');
        }
        return testUri;
    }
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is not set');
    return uri;
}

const cached = global.__mongoose ?? (global.__mongoose = { conn: null, promise: null });

export async function connectDB(): Promise<typeof mongoose> {
    if (cached.conn) return cached.conn;
    if (!cached.promise) {
        cached.promise = mongoose.connect(resolveMongoUri(), {
            bufferCommands: false,
        });
    }
    cached.conn = await cached.promise;
    return cached.conn;
}
