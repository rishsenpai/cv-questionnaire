import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import CuratedMatch from '@/models/CuratedMatch';
import Vacancy from '@/models/Vacancy';
import CV from '@/models/CV';
import { requireEmployer } from '@/lib/server/auth';
import { anonymizeCv } from '@/lib/server/anonymize';

export const maxDuration = 30;

interface Params {
    params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
    const auth = await requireEmployer(req);
    if (auth instanceof NextResponse) return auth;

    try {
        const { id } = await params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ success: false, message: 'Ongeldige id' }, { status: 400 });
        }
        await connectDB();

        const vacancy = await Vacancy.findOne({ _id: id, employerId: auth.employerId }).select('_id title');
        if (!vacancy) {
            return NextResponse.json({ success: false, message: 'Vacature niet gevonden' }, { status: 404 });
        }

        const matches = await CuratedMatch.find({
            vacancyId: id,
            employerId: auth.employerId,
            status: { $ne: 'suggested' }, // suggesties zijn admin-only tot promote
        }).sort({ addedAt: -1 });

        const cvIds = matches.map(m => m.cvId).filter(Boolean);
        const cvs = await CV.find({ _id: { $in: cvIds } })
            .select('_id jobTitle location summary skills experience education')
            .lean();
        const cvMap = new Map(cvs.map(c => [String(c._id), c]));

        const enriched = matches.map(m => {
            const cv = cvMap.get(String(m.cvId));
            const anon = cv ? anonymizeCv(cv) : null;
            return {
                _id: String(m._id),
                status: m.status,
                adminNote: m.adminNote,
                matchScore: m.matchScore,
                addedAt: m.addedAt,
                viewedAt: m.viewedAt,
                contactRequestedAt: m.contactRequestedAt,
                cv: anon,
            };
        }).filter(m => m.cv !== null);

        return NextResponse.json({
            success: true,
            vacancy: { _id: String(vacancy._id), title: vacancy.title },
            matches: enriched,
        });
    } catch (err) {
        console.error('employer curated-matches GET error:', err);
        return NextResponse.json({ success: false, message: 'Kon matches niet ophalen' }, { status: 500 });
    }
}
