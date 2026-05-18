// Lazy match-reason: genereert (en cached) de LLM-toelichting voor één
// CuratedMatch. Eerste call doet de OpenAI-call en slaat 't op het record op.
// Volgende calls retourneren de gecachte string zonder nieuwe LLM-cost.

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import CuratedMatch from '@/models/CuratedMatch';
import CV from '@/models/CV';
import Vacancy from '@/models/Vacancy';
import { requireAdmin } from '@/lib/server/auth';
import { generateMatchReason } from '@/lib/server/matchReason';

export const maxDuration = 30;

interface Params {
    params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
    const unauth = await requireAdmin(req);
    if (unauth) return unauth;

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ success: false, message: 'Ongeldige id' }, { status: 400 });
    }
    await connectDB();

    const match = await CuratedMatch.findById(id);
    if (!match) return NextResponse.json({ success: false, message: 'Niet gevonden' }, { status: 404 });

    // Cache-hit: stuur de bestaande reason terug zonder nieuwe LLM-call.
    if (match.matchReason) {
        return NextResponse.json({
            success: true,
            reason: match.matchReason,
            cached: true,
            generatedAt: match.matchReasonGeneratedAt,
        });
    }

    if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json({ success: false, message: 'OPENAI_API_KEY niet geconfigureerd' }, { status: 503 });
    }

    const [cv, vacancy] = await Promise.all([
        CV.findById(match.cvId).select('fullName jobTitle skills experience education languages summary achievements'),
        Vacancy.findById(match.vacancyId).select('title company description requirements'),
    ]);
    if (!cv || !vacancy) {
        return NextResponse.json({ success: false, message: 'CV of vacature niet gevonden' }, { status: 404 });
    }

    const reason = await generateMatchReason(cv.toObject(), vacancy.toObject());
    if (!reason) {
        return NextResponse.json({ success: false, message: 'LLM gaf geen toelichting terug' }, { status: 500 });
    }

    match.matchReason = reason;
    match.matchReasonGeneratedAt = new Date();
    await match.save();

    return NextResponse.json({
        success: true,
        reason,
        cached: false,
        generatedAt: match.matchReasonGeneratedAt,
    });
}
