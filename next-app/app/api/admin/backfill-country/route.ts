// Eenmalige backfill van het country-veld op CV en Vacancy.
// Leidt land af uit het bestaande location-veld via inferCountry().
// Records waar geen land uit de location af te leiden is, blijven undefined.

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import CV from '@/models/CV';
import Vacancy from '@/models/Vacancy';
import { requireAdmin } from '@/lib/server/auth';
import { inferCountry } from '@/lib/country';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
    const unauth = await requireAdmin(req);
    if (unauth) return unauth;
    await connectDB();

    const cvs = await CV.find({ country: { $exists: false } })
        .select('_id location experience education skills fullText')
        .lean();
    let cvsUpdated = 0;
    for (const cv of cvs) {
        const r = cv as { location?: string; experience?: string; education?: string; skills?: string; fullText?: string };
        const fallback = [r.experience, r.education, r.skills, r.fullText].filter(Boolean).join(' ');
        const c = inferCountry(r.location, fallback || undefined);
        if (c) {
            await CV.updateOne({ _id: cv._id }, { country: c });
            cvsUpdated++;
        }
    }

    const vacancies = await Vacancy.find({ country: { $exists: false } })
        .select('_id location title description requirements fullText')
        .lean();
    let vacanciesUpdated = 0;
    for (const v of vacancies) {
        const r = v as { location?: string; title?: string; description?: string; requirements?: string; fullText?: string };
        const fallback = [r.title, r.description, r.requirements, r.fullText].filter(Boolean).join(' ');
        const c = inferCountry(r.location, fallback || undefined);
        if (c) {
            await Vacancy.updateOne({ _id: v._id }, { country: c });
            vacanciesUpdated++;
        }
    }

    return NextResponse.json({
        success: true,
        cvs: { scanned: cvs.length, updated: cvsUpdated },
        vacancies: { scanned: vacancies.length, updated: vacanciesUpdated },
    });
}
