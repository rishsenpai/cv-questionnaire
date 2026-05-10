import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Vacancy from '@/models/Vacancy';
import CuratedMatch from '@/models/CuratedMatch';
import { requireAdmin } from '@/lib/server/auth';

export async function GET(req: NextRequest) {
    const unauth = await requireAdmin(req);
    if (unauth) return unauth;
    try {
        await connectDB();
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const [
            total, adzuna, jsearch, employer, internal, withEmbeddings,
            employerLast7d, openSuggestions,
        ] = await Promise.all([
            Vacancy.countDocuments({ isActive: true }),
            Vacancy.countDocuments({ source: 'adzuna', isActive: true }),
            Vacancy.countDocuments({ source: 'jsearch', isActive: true }),
            Vacancy.countDocuments({ source: 'employer', isActive: true }),
            Vacancy.countDocuments({
                $or: [{ source: 'internal' }, { source: { $exists: false } }],
                isActive: true,
            }),
            Vacancy.countDocuments({ isActive: true, embedding: { $exists: true, $ne: [] } }),
            Vacancy.countDocuments({ source: 'employer', isActive: true, createdAt: { $gte: sevenDaysAgo } }),
            CuratedMatch.countDocuments({ status: 'suggested' }),
        ]);
        return NextResponse.json({
            success: true,
            stats: {
                total, adzuna, jsearch, employer, internal, withEmbeddings,
                employerLast7d, openSuggestions,
            },
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error';
        return NextResponse.json({ success: false, message: msg }, { status: 500 });
    }
}
