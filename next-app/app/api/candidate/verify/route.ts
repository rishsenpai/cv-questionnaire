import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import CandidateToken from '@/models/CandidateToken';
import Candidate from '@/models/Candidate';

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();
        const { token } = body || {};

        const tokenData = await CandidateToken.findOne({ token, expires: { $gt: new Date() } });
        if (!tokenData) {
            return NextResponse.json(
                { success: false, message: 'Invalid or expired token' },
                { status: 401 },
            );
        }

        const candidate = await Candidate.findById(tokenData.candidateId);
        if (!candidate || !candidate.isActive) {
            await CandidateToken.deleteOne({ token });
            return NextResponse.json({ success: false, message: 'Account inactive' }, { status: 401 });
        }

        return NextResponse.json({
            success: true,
            candidate: {
                email: candidate.email,
                fullName: candidate.fullName,
            },
        });
    } catch (err) {
        console.error('Candidate verify error:', err instanceof Error ? err.message : err);
        return NextResponse.json({ success: false, message: 'Verification failed' }, { status: 500 });
    }
}
