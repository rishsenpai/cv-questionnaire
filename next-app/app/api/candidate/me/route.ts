import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Candidate from '@/models/Candidate';
import CV from '@/models/CV';
import { requireCandidate } from '@/lib/server/auth';
import { linkCvsByEmail } from '@/lib/server/candidateCvLink';

export async function GET(req: NextRequest) {
    const auth = await requireCandidate(req);
    if (auth instanceof NextResponse) return auth;

    await connectDB();
    const candidate = await Candidate.findById(auth.candidateId).select('-password');
    if (!candidate) {
        return NextResponse.json({ success: false, message: 'Candidate not found' }, { status: 404 });
    }

    // Best-effort: koppel eventueel sindsdien geüploade CVs met dezelfde email.
    try {
        await linkCvsByEmail(candidate._id as import('mongoose').Types.ObjectId, candidate.email);
    } catch (err) {
        console.error('linkCvsByEmail (me) failed:', err instanceof Error ? err.message : err);
    }

    // Hydrate de gekoppelde CVs met basisinfo zodat de frontend ze direct kan tonen.
    const refreshed = await Candidate.findById(candidate._id).select('linkedCvIds').lean();
    const cvIds = (refreshed?.linkedCvIds || []).map(id => String(id));
    const cvs = cvIds.length > 0
        ? await CV.find({ _id: { $in: cvIds } })
            .select('_id fullName jobTitle email createdAt')
            .sort({ createdAt: -1 })
            .lean()
        : [];

    return NextResponse.json({
        success: true,
        candidate: {
            id: String(candidate._id),
            email: candidate.email,
            fullName: candidate.fullName,
            phone: candidate.phone || '',
            location: candidate.location || '',
            linkedCvIds: cvIds,
            cvs: cvs.map(c => ({
                _id: String(c._id),
                fullName: c.fullName,
                jobTitle: c.jobTitle,
                email: c.email,
                createdAt: c.createdAt,
            })),
            createdAt: candidate.createdAt,
        },
    });
}

export async function PATCH(req: NextRequest) {
    const auth = await requireCandidate(req);
    if (auth instanceof NextResponse) return auth;

    try {
        await connectDB();
        const body = await req.json();
        const { fullName, phone, location } = body || {};

        const update: Record<string, unknown> = {};
        if (typeof fullName === 'string') update.fullName = fullName.trim();
        if (typeof phone === 'string') update.phone = phone.trim();
        if (typeof location === 'string') update.location = location.trim();

        const candidate = await Candidate.findByIdAndUpdate(auth.candidateId, update, {
            new: true,
            runValidators: true,
        }).select('-password');

        if (!candidate) {
            return NextResponse.json({ success: false, message: 'Candidate not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            candidate: {
                id: String(candidate._id),
                email: candidate.email,
                fullName: candidate.fullName,
                phone: candidate.phone || '',
                location: candidate.location || '',
            },
        });
    } catch (err) {
        console.error('Candidate update error:', err instanceof Error ? err.message : err);
        return NextResponse.json({ success: false, message: 'Update failed' }, { status: 500 });
    }
}
