import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import MatchEvent from '@/models/MatchEvent';
import { requireAdmin } from '@/lib/server/auth';

export const maxDuration = 30;

export async function GET(req: NextRequest) {
    const unauth = await requireAdmin(req);
    if (unauth) return unauth;

    try {
        await connectDB();
        const url = new URL(req.url);
        const cvId = url.searchParams.get('cvId');
        const vacancyId = url.searchParams.get('vacancyId');
        const source = url.searchParams.get('source');
        const minScoreParam = url.searchParams.get('minScore');
        const sinceParam = url.searchParams.get('since');
        const limitParam = url.searchParams.get('limit');

        const filter: Record<string, unknown> = {};
        if (cvId && mongoose.Types.ObjectId.isValid(cvId)) filter.cvId = cvId;
        if (vacancyId && mongoose.Types.ObjectId.isValid(vacancyId)) filter.vacancyId = vacancyId;
        if (source) filter.source = source;
        if (minScoreParam) {
            const n = Number(minScoreParam);
            if (!Number.isNaN(n)) filter.score = { $gte: n };
        }
        if (sinceParam) {
            const d = new Date(sinceParam);
            if (!Number.isNaN(d.getTime())) filter.createdAt = { $gte: d };
        }

        const limit = Math.min(Math.max(Number(limitParam) || 100, 1), 500);

        const [events, total, byCv, bySource] = await Promise.all([
            MatchEvent.find(filter).sort({ createdAt: -1 }).limit(limit).lean(),
            MatchEvent.countDocuments(filter),
            MatchEvent.aggregate([
                { $match: filter },
                { $group: { _id: '$cvId', cvFullName: { $first: '$cvFullName' }, count: { $sum: 1 }, avgScore: { $avg: '$score' } } },
                { $sort: { count: -1 } },
                { $limit: 20 },
            ]),
            MatchEvent.aggregate([
                { $match: filter },
                { $group: { _id: '$source', count: { $sum: 1 } } },
            ]),
        ]);

        return NextResponse.json({
            success: true,
            total,
            events,
            topCvs: byCv,
            bySource,
        });
    } catch (err) {
        console.error('match-events error:', err);
        return NextResponse.json({ success: false, message: 'Failed to load match events' }, { status: 500 });
    }
}
