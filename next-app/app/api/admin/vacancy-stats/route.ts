import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Vacancy from '@/models/Vacancy';
import { requireAdmin } from '@/lib/server/auth';

export async function GET(req: NextRequest) {
    const unauth = await requireAdmin(req);
    if (unauth) return unauth;
    try {
        await connectDB();
        const total = await Vacancy.countDocuments({ isActive: true });
        const adzuna = await Vacancy.countDocuments({ source: 'adzuna', isActive: true });
        const internal = await Vacancy.countDocuments({
            $or: [{ source: 'internal' }, { source: { $exists: false } }],
            isActive: true,
        });
        const withEmbeddings = await Vacancy.countDocuments({
            isActive: true,
            embedding: { $exists: true, $ne: [] },
        });
        return NextResponse.json({
            success: true,
            stats: { total, adzuna, internal, withEmbeddings },
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error';
        return NextResponse.json({ success: false, message: msg }, { status: 500 });
    }
}
