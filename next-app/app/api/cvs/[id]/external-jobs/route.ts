import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import CV from '@/models/CV';
import { findJobsForCV } from '@/lib/server/jsearch';

export const maxDuration = 30;

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dagen

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
        const force = url.searchParams.get('force') === '1';
        const location = url.searchParams.get('location') || cv.location || 'Netherlands';

        // Cache: hergebruik eerdere fetch als nog vers (<7 dagen) tenzij ?force=1
        if (!force && cv.externalJobsCache && cv.externalJobsCache.fetchedAt) {
            const age = Date.now() - new Date(cv.externalJobsCache.fetchedAt).getTime();
            if (age < CACHE_TTL_MS) {
                return NextResponse.json({
                    success: true,
                    cached: true,
                    fetchedAt: cv.externalJobsCache.fetchedAt,
                    totalJobs: cv.externalJobsCache.totalJobs,
                    jobs: cv.externalJobsCache.jobs,
                    cv: { _id: cv._id, fullName: cv.fullName, jobTitle: cv.jobTitle },
                });
            }
        }

        const results = await findJobsForCV(
            { jobTitle: cv.jobTitle, skills: cv.skills, location },
            location,
        );

        // Persist cache (zonder de embedding etc — alleen wat we tonen)
        await CV.findByIdAndUpdate(cv._id, {
            externalJobsCache: {
                jobs: results.jobs,
                totalJobs: results.totalJobs,
                fetchedAt: new Date(),
            },
        });

        console.log(`External job search for "${cv.fullName}": found ${results.totalJobs} jobs (cached for 7d)`);
        return NextResponse.json({
            ...results,
            cached: false,
            fetchedAt: new Date(),
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
