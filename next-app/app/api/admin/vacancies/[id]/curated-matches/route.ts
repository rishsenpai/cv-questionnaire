import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import CuratedMatch from '@/models/CuratedMatch';
import CV from '@/models/CV';
import { requireAdmin } from '@/lib/server/auth';

interface Params {
    params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
    const unauth = await requireAdmin(req);
    if (unauth) return unauth;

    try {
        const { id } = await params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ success: false, message: 'Ongeldige id' }, { status: 400 });
        }
        await connectDB();
        const url = new URL(req.url);
        const statusFilter = url.searchParams.get('status'); // optioneel: 'suggested' | 'presented' | etc.
        const query: Record<string, unknown> = { vacancyId: id };
        if (statusFilter) query.status = statusFilter;
        // Voor suggesties: hoogste score eerst. Anders: meest recent eerst.
        const sort: Record<string, 1 | -1> = statusFilter === 'suggested'
            ? { matchScore: -1, addedAt: -1 }
            : { addedAt: -1 };
        const matches = await CuratedMatch.find(query).sort(sort).lean();

        const cvIds = matches.map(m => m.cvId).filter(Boolean);
        const cvs = await CV.find({ _id: { $in: cvIds } }).select('_id fullName jobTitle location').lean();
        const cvMap = new Map(cvs.map(c => [String(c._id), c]));

        const enriched = matches.map(m => ({
            ...m,
            cv: cvMap.get(String(m.cvId)) || null,
        }));

        return NextResponse.json({ success: true, matches: enriched });
    } catch (err) {
        console.error('admin curated-matches GET error:', err);
        return NextResponse.json({ success: false, message: 'Kon niet ophalen' }, { status: 500 });
    }
}
