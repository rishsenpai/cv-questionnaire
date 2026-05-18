// Globaal overzicht van hoogst-scorende CV↔vacature matches across alle
// vacatures en CVs. Sluit aan op de bestaande CuratedMatch-collectie
// zodat we niet on-the-fly hoeven te scoren — de scores komen uit de
// laatste match-batch (cosine + Cohere rerank).

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import CuratedMatch from '@/models/CuratedMatch';
import CV from '@/models/CV';
import Vacancy from '@/models/Vacancy';
import { requireAdmin } from '@/lib/server/auth';

export async function GET(req: NextRequest) {
    const unauth = await requireAdmin(req);
    if (unauth) return unauth;

    try {
        await connectDB();
        const url = new URL(req.url);
        const status = url.searchParams.get('status'); // 'suggested' | 'pushed' | null (alle non-rejected)
        const country = url.searchParams.get('country'); // 'guyana' | 'netherlands' | 'suriname' | null
        const minScore = parseInt(url.searchParams.get('minScore') || '0', 10);
        const limit = Math.min(200, parseInt(url.searchParams.get('limit') || '50', 10));

        const matchQuery: Record<string, unknown> = {};
        if (status === 'suggested') matchQuery.status = 'suggested';
        else if (status === 'pushed') matchQuery.status = { $in: ['presented', 'viewed', 'contact-requested', 'contact-shared'] };
        else matchQuery.status = { $ne: 'rejected' };
        if (minScore > 0) matchQuery.matchScore = { $gte: minScore };

        // Eerst alle kandidaten ophalen, op score sorteren, limit toepassen.
        // We hebben de CV/Vacancy data straks nodig om op country te filteren
        // (CuratedMatch heeft zelf geen country-veld — we leiden 't af van vacancy).
        const raw = await CuratedMatch.find(matchQuery)
            .sort({ matchScore: -1, addedAt: -1 })
            .limit(country ? limit * 5 : limit) // overshoot zodat na country-filter nog limit overblijft
            .lean();

        const cvIds = raw.map(m => m.cvId);
        const vacancyIds = raw.map(m => m.vacancyId);

        const [cvs, vacancies] = await Promise.all([
            CV.find({ _id: { $in: cvIds } })
                .select('_id fullName email phone jobTitle location country')
                .lean(),
            Vacancy.find({ _id: { $in: vacancyIds } })
                .select('_id title company location country source applyLink')
                .lean(),
        ]);
        const cvMap = new Map(cvs.map(c => [String(c._id), c]));
        const vacMap = new Map(vacancies.map(v => [String(v._id), v]));

        let enriched = raw.map(m => ({
            _id: String(m._id),
            matchScore: m.matchScore,
            matchReason: m.matchReason,
            status: m.status,
            source: m.source,
            addedAt: m.addedAt,
            promotedAt: m.promotedAt,
            cv: cvMap.get(String(m.cvId)) || null,
            vacancy: vacMap.get(String(m.vacancyId)) || null,
        })).filter(m => m.cv && m.vacancy);

        if (country) {
            enriched = enriched.filter(m =>
                (m.vacancy as { country?: string })?.country === country,
            );
        }

        // Final slice na country-filter
        enriched = enriched.slice(0, limit);

        return NextResponse.json({
            success: true,
            count: enriched.length,
            matches: enriched,
        });
    } catch (err) {
        console.error('top-matches error:', err);
        return NextResponse.json({ success: false, message: 'Failed to fetch top matches' }, { status: 500 });
    }
}
