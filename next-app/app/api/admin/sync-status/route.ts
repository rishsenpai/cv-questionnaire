import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import SyncState from '@/models/SyncState';
import { requireAdmin } from '@/lib/server/auth';

export async function GET(req: NextRequest) {
    const unauth = await requireAdmin(req);
    if (unauth) return unauth;
    try {
        await connectDB();
        const doc = await SyncState.findOne({ key: 'drive:lastSyncStats' });
        return NextResponse.json({
            success: true,
            stats: doc?.value || null,
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error';
        return NextResponse.json({ success: false, message: msg }, { status: 500 });
    }
}
