import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Vacancy from '@/models/Vacancy';
import CuratedMatch from '@/models/CuratedMatch';
import MatchEvent from '@/models/MatchEvent';
import { requireEmployer } from '@/lib/server/auth';

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

        const vacancy = await Vacancy.findOne({ _id: id, employerId: auth.employerId })
            .select('_id title viewCount applicationCount createdAt postedAt');
        if (!vacancy) {
            return NextResponse.json({ success: false, message: 'Vacature niet gevonden' }, { status: 404 });
        }

        const [byStatus, jobseekerMatchCount, recentMatchEvents] = await Promise.all([
            CuratedMatch.aggregate([
                { $match: { vacancyId: vacancy._id } },
                { $group: { _id: '$status', count: { $sum: 1 } } },
            ]),
            MatchEvent.countDocuments({ vacancyId: vacancy._id, source: 'jobseeker' }),
            MatchEvent.find({ vacancyId: vacancy._id })
                .sort({ createdAt: -1 })
                .limit(10)
                .select('source score createdAt')
                .lean(),
        ]);

        const statusCounts: Record<string, number> = {
            presented: 0,
            viewed: 0,
            'contact-requested': 0,
            rejected: 0,
        };
        for (const s of byStatus) statusCounts[s._id] = s.count;

        return NextResponse.json({
            success: true,
            vacancy: {
                _id: String(vacancy._id),
                title: vacancy.title,
                createdAt: vacancy.createdAt,
                postedAt: vacancy.postedAt,
            },
            stats: {
                viewCount: vacancy.viewCount || 0,
                applicationCount: vacancy.applicationCount || 0,
                curatedTotal: Object.values(statusCounts).reduce((a, b) => a + b, 0),
                presented: statusCounts.presented,
                viewed: statusCounts.viewed,
                contactRequested: statusCounts['contact-requested'],
                rejected: statusCounts.rejected,
                jobseekerMatchCount,
            },
            recentMatchEvents,
        });
    } catch (err) {
        console.error('vacancy analytics error:', err);
        return NextResponse.json({ success: false, message: 'Kon analytics niet ophalen' }, { status: 500 });
    }
}
