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
        return NextResponse.json(
            {
                status: 'ERROR',
                timestamp: new Date().toISOString(),
                database: 'disconnected',
                error: err instanceof Error ? err.message : 'Unknown error',
            },
            { status: 500 },
        );
    }
}
