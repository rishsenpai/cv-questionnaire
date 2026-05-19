// CV → Vacatures matches. Bron: bestaande CuratedMatch records, NIET een
// real-time recompute. Reden: anders gaf Cohere rerank asymmetrische
// scores (vacancy→cv vs cv→vacancy) en zag de admin compleet andere
// rankings dan in de Vacatures-tab. Eén bron van waarheid betekent
// consistente UX.
//
// Records worden aangemaakt door de Vacatures-tab batch (Match alle) of
// per-vacancy run-match. Als deze CV nog geen records heeft, krijgt
// admin een lege lijst met hint om Match alle te draaien.

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import CV from '@/models/CV';
import Vacancy from '@/models/Vacancy';
import CuratedMatch from '@/models/CuratedMatch';
import { requireAdmin } from '@/lib/server/auth';
import { sanitizeJobText } from '@/lib/server/sanitizeJobText';

export const maxDuration = 30;

const FINAL_TOP_N = 50;

interface Params {
    params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
    const unauth = await requireAdmin(req);
    if (unauth) return unauth;

    try {
        const { id } = await params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ success: false, message: 'Invalid CV id' }, { status: 400 });
        }
        await connectDB();
        const cv = await CV.findById(id).select('_id fullName jobTitle location country');
        if (!cv) {
            return NextResponse.json({ success: false, message: 'CV niet gevonden' }, { status: 404 });
        }

        // Optioneel land-filter — net als Vacatures-tab.
        const url = new URL(req.url);
        const countryParam = url.searchParams.get('country');
        const country = countryParam && ['guyana', 'netherlands', 'suriname'].includes(countryParam)
            ? countryParam
            : null;

        // 1. Alle non-rejected CuratedMatch records voor deze CV ophalen.
        const cvObjectId = new mongoose.Types.ObjectId(id);
        const records = await CuratedMatch.find({
            cvId: cvObjectId,
            status: { $ne: 'rejected' },
        })
            .select('_id vacancyId matchScore matchReason status promotedAt addedAt source')
            .sort({ matchScore: -1, addedAt: -1 })
            .lean();

        if (records.length === 0) {
            return NextResponse.json({
                success: true,
                cv: { _id: cv._id, fullName: cv.fullName, jobTitle: cv.jobTitle, location: cv.location },
                matches: [],
                totalRecords: 0,
                hint: 'Geen match-records voor deze CV. Draai "Match alle" in de Vacatures-tab om suggesties te genereren.',
            });
        }

        // 2. Vacancies ophalen die nog actief & niet vervuld zijn. Records
        //    voor verwijderde/vervulde vacatures filteren we weg.
        const vacancyIds = records.map(r => r.vacancyId);
        const vacancyFilter: Record<string, unknown> = {
            _id: { $in: vacancyIds },
            isActive: true,
            fulfilledAt: null,
        };
        if (country) vacancyFilter.country = country;
        const vacancies = await Vacancy.find(vacancyFilter)
            .select('_id title description requirements company location source country employerId applyLink salary postedAt employmentType isRemote createdAt')
            .lean();
        const vacancyMap = new Map(vacancies.map(v => [String(v._id), v]));

        // 3. Joinen + sanitizen + sorteren op matchScore desc.
        const matches = records
            .map(r => {
                const v = vacancyMap.get(String(r.vacancyId));
                if (!v) return null;
                return {
                    _id: String(v._id),
                    title: v.title,
                    description: sanitizeJobText(v.description, v.company),
                    requirements: sanitizeJobText(v.requirements, v.company),
                    company: v.company,
                    location: v.location,
                    source: v.source,
                    country: v.country,
                    employerId: v.employerId ? String(v.employerId) : undefined,
                    applyLink: v.applyLink,
                    salary: v.salary,
                    postedAt: v.postedAt,
                    employmentType: v.employmentType,
                    isRemote: v.isRemote,
                    createdAt: v.createdAt,
                    matchScore: r.matchScore ?? 0,
                    matchReason: r.matchReason,
                    matchType: 'AI Hybrid',
                    curatedMatchId: String(r._id),
                    curatedStatus: r.status,
                };
            })
            .filter((m): m is NonNullable<typeof m> => m !== null)
            .slice(0, FINAL_TOP_N);

        return NextResponse.json({
            success: true,
            cv: { _id: cv._id, fullName: cv.fullName, jobTitle: cv.jobTitle, location: cv.location },
            matches,
            totalRecords: records.length,
            shownAfterFilter: matches.length,
        });
    } catch (err) {
        console.error('admin cvs/[id]/matches error:', err);
        return NextResponse.json({ success: false, message: 'Match-fetch mislukt' }, { status: 500 });
    }
}
