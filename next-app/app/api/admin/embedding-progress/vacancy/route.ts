import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import SyncState from '@/models/SyncState';
import { requireAdmin } from '@/lib/server/auth';

interface VacancyEmbeddingProgress {
    active: boolean;
    current: number;
    total: number;
    currentTitle: string;
    failed: number;
    startedAt: string | Date | null;
}

const EMPTY_PROGRESS: VacancyEmbeddingProgress = {
    active: false,
    current: 0,
    total: 0,
    currentTitle: '',
    failed: 0,
    startedAt: null,
};

export async function GET(req: NextRequest) {
    const unauth = await requireAdmin(req);
    if (unauth) return unauth;
    await connectDB();
    const doc = await SyncState.findOne({ key: 'embedding:vacancy-progress' });
    const progress = (doc?.value as VacancyEmbeddingProgress) || EMPTY_PROGRESS;
    return NextResponse.json({
        success: true,
        ...progress,
        percentage: progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0,
    });
}
