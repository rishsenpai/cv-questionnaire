// Ad-hoc match-reason zonder CuratedMatch record. Gebruikt door de
// CV→vacatures modal waar matches nog niet gepushed (en dus niet
// opgeslagen) zijn. Geen DB-write; client cached zelf voor de sessie.

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import CV from '@/models/CV';
import Vacancy from '@/models/Vacancy';
import { requireAdmin } from '@/lib/server/auth';
import { generateMatchReason } from '@/lib/server/matchReason';

export const maxDuration = 30;

export async function GET(req: NextRequest) {
    const unauth = await requireAdmin(req);
    if (unauth) return unauth;

    const url = new URL(req.url);
    const vacancyId = url.searchParams.get('vacancyId');
    const cvId = url.searchParams.get('cvId');

    if (!vacancyId || !cvId) {
        return NextResponse.json({ success: false, message: 'vacancyId en cvId verplicht' }, { status: 400 });
    }
    if (!mongoose.Types.ObjectId.isValid(vacancyId) || !mongoose.Types.ObjectId.isValid(cvId)) {
        return NextResponse.json({ success: false, message: 'Ongeldige id' }, { status: 400 });
    }
    if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json({ success: false, message: 'OPENAI_API_KEY niet geconfigureerd' }, { status: 503 });
    }

    await connectDB();

    const [cv, vacancy] = await Promise.all([
        CV.findById(cvId).select('fullName jobTitle skills experience education languages summary achievements'),
        Vacancy.findById(vacancyId).select('title company description requirements'),
    ]);
    if (!cv || !vacancy) {
        return NextResponse.json({ success: false, message: 'CV of vacature niet gevonden' }, { status: 404 });
    }

    const reason = await generateMatchReason(cv.toObject(), vacancy.toObject());
    if (!reason) {
        return NextResponse.json({ success: false, message: 'LLM gaf geen toelichting terug' }, { status: 500 });
    }
    return NextResponse.json({ success: true, reason });
}
