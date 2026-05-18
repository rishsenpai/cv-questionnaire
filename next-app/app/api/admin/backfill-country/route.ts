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

    const cvs = await CV.find({ country: { $exists: false } }).select('_id location').lean();
    let cvsUpdated = 0;
    for (const cv of cvs) {
        const c = inferCountry((cv as { location?: string }).location);
        if (c) {
            await CV.updateOne({ _id: cv._id }, { country: c });
            cvsUpdated++;
        }
    }

    const vacancies = await Vacancy.find({ country: { $exists: false } }).select('_id location').lean();
    let vacanciesUpdated = 0;
    for (const v of vacancies) {
        const c = inferCountry((v as { location?: string }).location);
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
