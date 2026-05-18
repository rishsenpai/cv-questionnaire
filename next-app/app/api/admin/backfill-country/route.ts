// Eenmalige backfill van het country-veld op CV en Vacancy.
// Leidt land af uit het bestaande location-veld via inferCountry().
// Records waar geen land uit de location af te leiden is, blijven undefined.

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
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

    // Batch update via bulkWrite — 4700+ losse updateOne's duurde >60s,
    // bulkWrite per 500 docs doet hetzelfde werk in ~5s.
    const BATCH_SIZE = 500;

    const cvs = await CV.find({ country: { $exists: false } })
        .select('_id location experience education skills fullText')
        .lean();
    let cvsUpdated = 0;
    const cvOps: mongoose.AnyBulkWriteOperation[] = [];
    for (const cv of cvs) {
        const r = cv as { location?: string; experience?: string; education?: string; skills?: string; fullText?: string };
        const fallback = [r.experience, r.education, r.skills, r.fullText].filter(Boolean).join(' ');
        const c = inferCountry(r.location, fallback || undefined);
        if (c) {
            cvOps.push({ updateOne: { filter: { _id: cv._id }, update: { country: c } } });
            cvsUpdated++;
            if (cvOps.length >= BATCH_SIZE) {
                await CV.bulkWrite(cvOps, { ordered: false });
                cvOps.length = 0;
            }
        }
    }
    if (cvOps.length > 0) await CV.bulkWrite(cvOps, { ordered: false });

    const vacancies = await Vacancy.find({ country: { $exists: false } })
        .select('_id location title description requirements fullText')
        .lean();
    let vacanciesUpdated = 0;
    const vacOps: mongoose.AnyBulkWriteOperation[] = [];
    for (const v of vacancies) {
        const r = v as { location?: string; title?: string; description?: string; requirements?: string; fullText?: string };
        const fallback = [r.title, r.description, r.requirements, r.fullText].filter(Boolean).join(' ');
        const c = inferCountry(r.location, fallback || undefined);
        if (c) {
            vacOps.push({ updateOne: { filter: { _id: v._id }, update: { country: c } } });
            vacanciesUpdated++;
            if (vacOps.length >= BATCH_SIZE) {
                await Vacancy.bulkWrite(vacOps, { ordered: false });
                vacOps.length = 0;
            }
        }
    }
    if (vacOps.length > 0) await Vacancy.bulkWrite(vacOps, { ordered: false });

    return NextResponse.json({
        success: true,
        cvs: { scanned: cvs.length, updated: cvsUpdated },
        vacancies: { scanned: vacancies.length, updated: vacanciesUpdated },
    });
}
