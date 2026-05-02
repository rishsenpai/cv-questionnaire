import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import CV from '@/models/CV';
import { requireAdmin } from '@/lib/server/auth';

export async function GET(req: NextRequest) {
    const unauth = await requireAdmin(req);
    if (unauth) return unauth;
    try {
        await connectDB();
        const totalCVs = await CV.countDocuments();
        const withEmbedding = await CV.countDocuments({
            embedding: { $exists: true, $not: { $size: 0 } },
        });
        return NextResponse.json({
            success: true,
            total: totalCVs,
            withEmbedding,
            withoutEmbedding: totalCVs - withEmbedding,
            percentage: totalCVs > 0 ? Math.round((withEmbedding / totalCVs) * 100) : 0,
        });
    } catch (err) {
        console.error('Error checking embedding status:', err);
        return NextResponse.json({ success: false, message: 'Failed to check status' }, { status: 500 });
    }
}
