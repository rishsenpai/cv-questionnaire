import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import SyncState from '@/models/SyncState';
import { requireAdmin } from '@/lib/server/auth';

interface EmbeddingProgress {
    active: boolean;
    current: number;
    total: number;
    currentName: string;
    failed: number;
    startedAt: string | Date | null;
}

const EMPTY_PROGRESS: EmbeddingProgress = {
    active: false,
    current: 0,
    total: 0,
    currentName: '',
    failed: 0,
    startedAt: null,
};

export async function GET(req: NextRequest) {
    const unauth = await requireAdmin(req);
    if (unauth) return unauth;
    await connectDB();
    const doc = await SyncState.findOne({ key: 'embedding:progress' });
    const progress = (doc?.value as EmbeddingProgress) || EMPTY_PROGRESS;
    return NextResponse.json({
        success: true,
        ...progress,
        percentage: progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0,
    });
}
