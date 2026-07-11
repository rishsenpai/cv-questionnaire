import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { connectDB } from '@/lib/db';
import Vacancy from '@/models/Vacancy';
import CuratedMatch from '@/models/CuratedMatch';
import MatchEvent from '@/models/MatchEvent';
import { requireAdmin } from '@/lib/server/auth';
import { inferCountry } from '@/lib/country';

export const maxDuration = 60;

// Hard delete van Nederlandse vacatures, inclusief gekoppelde curated matches
// en match events. Anders dan external/all (soft delete op source) verwijdert
// dit écht, op basis van land: het opgeslagen country-veld, met inferCountry()
// als fallback voor niet-gebackfillde records.
//
// Vangrails tegen false positives van de tekst-inferentie:
// - Vacatures met een employerId (door een werkgever geplaatst) worden NOOIT
//   verwijderd — die verschijnen als 'skipped' in de respons.
// - GET geeft een preview van exact wat DELETE zou verwijderen, zodat de
//   admin de lijst kan controleren vóór het onomkeerbare deel.

interface NLSplit {
    toDelete: Array<{ _id: Types.ObjectId; title?: string; company?: string; location?: string; source?: string }>;
    skippedEmployer: Array<{ _id: Types.ObjectId; title?: string; company?: string; location?: string }>;
}

async function findNLVacancies(): Promise<NLSplit> {
    const all = await Vacancy.find({})
        .select('_id country location title description requirements fullText company source employerId')
        .lean();
    const toDelete: NLSplit['toDelete'] = [];
    const skippedEmployer: NLSplit['skippedEmployer'] = [];
    for (const v of all) {
        const fallback = [v.title, v.description, v.requirements, v.fullText].filter(Boolean).join(' ');
        const country = v.country || inferCountry(v.location, fallback || undefined);
        if (country !== 'netherlands') continue;
        if (v.employerId) {
            skippedEmployer.push({ _id: v._id, title: v.title, company: v.company, location: v.location });
        } else {
            toDelete.push({ _id: v._id, title: v.title, company: v.company, location: v.location, source: v.source });
        }
    }
    return { toDelete, skippedEmployer };
}

// Preview: exact dezelfde selectie als DELETE, zonder iets te wijzigen.
export async function GET(req: NextRequest) {
    const unauth = await requireAdmin(req);
    if (unauth) return unauth;
    try {
        await connectDB();
        const { toDelete, skippedEmployer } = await findNLVacancies();
        return NextResponse.json({
            success: true,
            count: toDelete.length,
            vacancies: toDelete.map(v => ({ id: String(v._id), title: v.title, company: v.company, location: v.location, source: v.source })),
            skippedEmployerCount: skippedEmployer.length,
            skippedEmployer: skippedEmployer.map(v => ({ id: String(v._id), title: v.title, company: v.company, location: v.location })),
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error';
        return NextResponse.json({ success: false, message: msg }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const unauth = await requireAdmin(req);
    if (unauth) return unauth;
    try {
        await connectDB();
        const { toDelete, skippedEmployer } = await findNLVacancies();

        if (toDelete.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'Geen Nederlandse vacatures gevonden',
                deleted: 0, curatedMatches: 0, matchEvents: 0,
                skippedEmployerCount: skippedEmployer.length,
            });
        }

        const nlIds = toDelete.map(v => v._id);
        const curated = await CuratedMatch.deleteMany({ vacancyId: { $in: nlIds } });
        const events = await MatchEvent.deleteMany({ vacancyId: { $in: nlIds } });
        const result = await Vacancy.deleteMany({ _id: { $in: nlIds } });

        return NextResponse.json({
            success: true,
            message: `${result.deletedCount} Nederlandse vacatures verwijderd`,
            deleted: result.deletedCount,
            curatedMatches: curated.deletedCount,
            matchEvents: events.deletedCount,
            skippedEmployerCount: skippedEmployer.length,
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error';
        return NextResponse.json({ success: false, message: msg }, { status: 500 });
    }
}
