import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import CuratedMatch from '@/models/CuratedMatch';
import { requireEmployer } from '@/lib/server/auth';

interface Params {
    params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: Params) {
    const auth = await requireEmployer(req);
    if (auth instanceof NextResponse) return auth;

    try {
        const { id } = await params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ success: false, message: 'Ongeldige id' }, { status: 400 });
        }
        await connectDB();
        const body = await req.json();

        const match = await CuratedMatch.findOne({ _id: id, employerId: auth.employerId });
        if (!match) {
            return NextResponse.json({ success: false, message: 'Niet gevonden' }, { status: 404 });
        }

        if (body.action === 'view' && match.status === 'presented') {
            match.status = 'viewed';
            match.viewedAt = new Date();
            await match.save();
        } else if (body.action === 'reject') {
            match.status = 'rejected';
            match.rejectedAt = new Date();
            await match.save();
        } else {
            return NextResponse.json({ success: false, message: 'Ongeldige action' }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('employer curated-match PATCH error:', err);
        return NextResponse.json({ success: false, message: 'Update mislukt' }, { status: 500 });
    }
}
