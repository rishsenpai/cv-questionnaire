import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import SyncState from '@/models/SyncState';
import { requireAdmin } from '@/lib/server/auth';

interface MatchAllProgress {
    active: boolean;
    current: number;
    total: number;
    currentTitle: string;
    failed: number;
    suggestionsTotal: number;
    startedAt: string | Date | null;
}

const EMPTY_PROGRESS: MatchAllProgress = {
    active: false,
    current: 0,
    total: 0,
    currentTitle: '',
    failed: 0,
    suggestionsTotal: 0,
    startedAt: null,
};

export async function GET(req: NextRequest) {
    const unauth = await requireAdmin(req);
    if (unauth) return unauth;
    await connectDB();
    const doc = await SyncState.findOne({ key: 'match:vacancy-progress' });
    const progress = (doc?.value as MatchAllProgress) || EMPTY_PROGRESS;
    return NextResponse.json({
        success: true,
        ...progress,
        percentage: progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0,
    });
}
