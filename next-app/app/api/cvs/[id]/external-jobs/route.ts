import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import CV from '@/models/CV';
import { findJobsForCV } from '@/lib/server/jsearch';

export const maxDuration = 30;

interface Params {
    params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ success: false, message: 'Invalid CV id' }, { status: 400 });
        }
        await connectDB();

        const cv = await CV.findById(id);
        if (!cv) {
            return NextResponse.json({ success: false, message: 'CV not found' }, { status: 404 });
        }

        const url = new URL(req.url);
        const location = url.searchParams.get('location') || cv.location || 'Netherlands';

        const results = await findJobsForCV(
            { jobTitle: cv.jobTitle, skills: cv.skills, location },
            location,
        );

        console.log(`External job search for "${cv.fullName}": found ${results.totalJobs} jobs`);
        return NextResponse.json({
            ...results,
            cv: { _id: cv._id, fullName: cv.fullName, jobTitle: cv.jobTitle },
        });
    } catch (err) {
        console.error('External job matching error:', err);
        const msg = err instanceof Error ? err.message : 'Error';
        return NextResponse.json(
            { success: false, message: 'Error finding matching jobs: ' + msg },
            { status: 500 },
        );
    }
}
