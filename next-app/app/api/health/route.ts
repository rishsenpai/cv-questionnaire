import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';

export async function GET() {
    try {
        await connectDB();
        return NextResponse.json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        });
    } catch (err) {
        // Geen err.message naar buiten: een DB-connectiefout lekt anders de
        // Atlas-hostname / "MONGODB_URI is not set" op een onauth endpoint.
        console.error('health check failed:', err instanceof Error ? err.message : err);
        return NextResponse.json(
            {
                status: 'ERROR',
                timestamp: new Date().toISOString(),
                database: 'disconnected',
            },
            { status: 500 },
        );
    }
}
