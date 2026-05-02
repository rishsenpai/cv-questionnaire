import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import CV from '@/models/CV';
import { requireAdmin } from '@/lib/server/auth';

export async function POST(req: NextRequest) {
    const unauth = await requireAdmin(req);
    if (unauth) return unauth;

    try {
        await connectDB();
        const body = await req.json();
        const { ids } = body || {};

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json(
                { success: false, message: 'No CV IDs provided' },
                { status: 400 },
            );
        }

        const result = await CV.deleteMany({ _id: { $in: ids } });
        return NextResponse.json({
            success: true,
            message: `${result.deletedCount} CV('s) verwijderd`,
            deletedCount: result.deletedCount,
        });
    } catch (err) {
        console.error('Error bulk deleting CVs:', err);
        return NextResponse.json({ success: false, message: 'Failed to delete CVs' }, { status: 500 });
    }
}
