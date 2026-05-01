import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Candidate from '@/models/Candidate';
import { requireCandidate } from '@/lib/server/auth';

export async function GET(req: NextRequest) {
    const auth = await requireCandidate(req);
    if (auth instanceof NextResponse) return auth;

    await connectDB();
    const candidate = await Candidate.findById(auth.candidateId).select('-password');
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
            linkedCvIds: candidate.linkedCvIds.map(id => String(id)),
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
