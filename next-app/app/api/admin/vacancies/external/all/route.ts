import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Vacancy from '@/models/Vacancy';
import { requireAdmin } from '@/lib/server/auth';

export async function DELETE(req: NextRequest) {
    const unauth = await requireAdmin(req);
    if (unauth) return unauth;
    try {
        await connectDB();
        const result = await Vacancy.updateMany({ source: 'adzuna' }, { isActive: false });
        return NextResponse.json({
            success: true,
            message: `${result.modifiedCount} externe vacatures verwijderd`,
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error';
        return NextResponse.json({ success: false, message: msg }, { status: 500 });
    }
}
