// Triggert handmatig de auto-match (OpenAI embeddings) voor een vacature.
// Werkt voor employer-vacatures én admin/internal vacatures. Voor admin/
// internal worden suggesties opgeslagen zonder employerId — alleen admin
// ziet ze in de AI-suggesties modal.

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Vacancy from '@/models/Vacancy';
import { requireAdmin } from '@/lib/server/auth';
import { generateVacancyEmbedding } from '@/lib/server/vacancyEmbedding';
import { runAutoMatchForVacancy } from '@/lib/server/autoMatch';

export const maxDuration = 60;

interface Params {
    params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
    const unauth = await requireAdmin(req);
    if (unauth) return unauth;

    try {
        const { id } = await params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ success: false, message: 'Ongeldige id' }, { status: 400 });
        }
        await connectDB();
        const vacancy = await Vacancy.findById(id).select('+embedding employerId title');
        if (!vacancy) {
            return NextResponse.json({ success: false, message: 'Vacature niet gevonden' }, { status: 404 });
        }

        // Genereer embedding als die ontbreekt
        if (!vacancy.embedding || vacancy.embedding.length === 0) {
            await generateVacancyEmbedding(id);
        }

        const result = await runAutoMatchForVacancy(id);
        return NextResponse.json({ success: true, vacancyTitle: vacancy.title, result });
    } catch (err) {
        console.error('run-match error:', err);
        return NextResponse.json({ success: false, message: err instanceof Error ? err.message : 'Run-match mislukt' }, { status: 500 });
    }
}
