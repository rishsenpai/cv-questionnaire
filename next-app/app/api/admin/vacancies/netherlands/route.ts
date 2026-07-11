import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Vacancy from '@/models/Vacancy';
import CuratedMatch from '@/models/CuratedMatch';
import MatchEvent from '@/models/MatchEvent';
import { requireAdmin } from '@/lib/server/auth';
import { inferCountry } from '@/lib/country';

export const maxDuration = 60;

// Hard delete van alle Nederlandse vacatures, inclusief gekoppelde curated
// matches en match events. Anders dan external/all (soft delete op source)
// verwijdert dit écht, en op basis van land: het opgeslagen country-veld,
// met inferCountry() als fallback voor niet-gebackfillde records.
export async function DELETE(req: NextRequest) {
    const unauth = await requireAdmin(req);
    if (unauth) return unauth;
    try {
        await connectDB();

        const all = await Vacancy.find({})
            .select('_id country location title description requirements fullText')
            .lean();
        const nlIds = all
            .filter(v => (v.country || inferCountry(v.location, [v.title, v.description, v.requirements, v.fullText].filter(Boolean).join(' ') || undefined)) === 'netherlands')
            .map(v => v._id);

        if (nlIds.length === 0) {
            return NextResponse.json({ success: true, message: 'Geen Nederlandse vacatures gevonden', deleted: 0, curatedMatches: 0, matchEvents: 0 });
        }

        const curated = await CuratedMatch.deleteMany({ vacancyId: { $in: nlIds } });
        const events = await MatchEvent.deleteMany({ vacancyId: { $in: nlIds } });
        const result = await Vacancy.deleteMany({ _id: { $in: nlIds } });

        return NextResponse.json({
            success: true,
            message: `${result.deletedCount} Nederlandse vacatures verwijderd`,
            deleted: result.deletedCount,
            curatedMatches: curated.deletedCount,
            matchEvents: events.deletedCount,
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error';
        return NextResponse.json({ success: false, message: msg }, { status: 500 });
    }
}
