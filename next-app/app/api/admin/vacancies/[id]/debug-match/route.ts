// Diagnose-endpoint: toont voor één vacature de top-20 rauwe cosine-scores
// tegen alle CV's mét embedding — zonder threshold-filtering, zonder skip
// op already-linked. Geeft direct inzicht of het probleem aan de drempel,
// aan de embeddings, of aan de vacaturetekst ligt.

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import CV from '@/models/CV';
import Vacancy from '@/models/Vacancy';
import CuratedMatch from '@/models/CuratedMatch';
import { requireAdmin } from '@/lib/server/auth';
import { cosineSimilarity } from '@/lib/server/embeddings';

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

    const vacancy = await Vacancy.findById(id).select('+embedding title description requirements');
    if (!vacancy) {
        return NextResponse.json({ success: false, message: 'Vacature niet gevonden' }, { status: 404 });
    }
    if (!vacancy.embedding || vacancy.embedding.length === 0) {
        return NextResponse.json({ success: false, message: 'Vacature heeft geen embedding' }, { status: 400 });
    }

    const cvs = await CV.find({
        embedding: { $exists: true, $ne: [] },
        isInternal: { $ne: true },
    }).select('+embedding _id fullName email').lean();

    const scored: Array<{ cvId: string; fullName: string; email: string; cosine: number; pct: number }> = [];
    for (const cv of cvs) {
        const cvEmb = (cv as unknown as { embedding?: number[] }).embedding;
        if (!cvEmb || cvEmb.length === 0) continue;
        const sim = cosineSimilarity(vacancy.embedding, cvEmb);
        scored.push({
            cvId: String(cv._id),
            fullName: (cv as { fullName?: string }).fullName || '—',
            email: (cv as { email?: string }).email || '—',
            cosine: sim,
            pct: Math.round(sim * 100),
        });
    }
    scored.sort((a, b) => b.cosine - a.cosine);

    // Bestaande CuratedMatch records voor deze vacature, per status.
    const existing = await CuratedMatch.aggregate([
        { $match: { vacancyId: new mongoose.Types.ObjectId(id) } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const existingByStatus: Record<string, number> = {};
    for (const e of existing) existingByStatus[e._id] = e.count;

    return NextResponse.json({
        success: true,
        vacancyTitle: vacancy.title,
        vacancyEmbeddingDim: vacancy.embedding.length,
        cvsScanned: cvs.length,
        threshold: 0.20,
        thresholdPct: 20,
        aboveThreshold: scored.filter(s => s.cosine >= 0.20).length,
        topRaw: scored.slice(0, 50),
        bottomRaw: scored.slice(-5),
        meanCosine: scored.length > 0 ? Math.round((scored.reduce((a, b) => a + b.cosine, 0) / scored.length) * 1000) / 1000 : 0,
        existingMatches: existingByStatus,
    });
}
