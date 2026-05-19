// Eenmalige bulk-flip van isInternal=true → false op alle CVs.
// Reden: de oude default in cvIngestion (isInternal=true) hield CVs uit
// bulk-upload en drive-sync buiten matching. De default staat nu op
// false; deze endpoint repareert de historische records.

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import CV from '@/models/CV';
import { requireAdmin } from '@/lib/server/auth';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
    const unauth = await requireAdmin(req);
    if (unauth) return unauth;
    await connectDB();

    const before = await CV.countDocuments({ isInternal: true });
    const res = await CV.updateMany({ isInternal: true }, { $set: { isInternal: false } });
    const after = await CV.countDocuments({ isInternal: true });

    return NextResponse.json({
        success: true,
        beforeCount: before,
        modifiedCount: res.modifiedCount,
        remainingTrue: after,
    });
}
