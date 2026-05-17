// Batch: draait runAutoMatchForVacancy voor elke vacature met embedding.
// Progress in SyncState onder key 'match:vacancy-progress'. Gebruikt
// after() zodat Vercel Fluid Compute het werk doorlaat lopen tot maxDuration.

import { NextRequest, NextResponse, after } from 'next/server';
import { connectDB } from '@/lib/db';
import Vacancy from '@/models/Vacancy';
import SyncState from '@/models/SyncState';
import { requireAdmin } from '@/lib/server/auth';
import { runAutoMatchForVacancy } from '@/lib/server/autoMatch';

export const maxDuration = 300;

interface MatchAllProgress {
    active: boolean;
    current: number;
    total: number;
    currentTitle: string;
    failed: number;
    suggestionsTotal: number;
    startedAt: Date;
}

async function persistProgress(progress: MatchAllProgress): Promise<void> {
    try {
        await SyncState.findOneAndUpdate(
            { key: 'match:vacancy-progress' },
            { value: progress },
            { upsert: true, new: true },
        );
    } catch (err) {
        console.error('persistProgress (match-all) error:', err instanceof Error ? err.message : err);
    }
}

export async function POST(req: NextRequest) {
    const unauth = await requireAdmin(req);
    if (unauth) return unauth;

    if (!process.env.OPENAI_API_KEY && process.env.NODE_ENV !== 'test') {
        return NextResponse.json(
            { success: false, message: 'OPENAI_API_KEY is niet geconfigureerd' },
            { status: 503 },
        );
    }

    try {
        await connectDB();
        // Alleen vacatures mét embedding — anders is matching zinloos.
        const vacancies = await Vacancy.find({
            embedding: { $exists: true, $not: { $size: 0 } },
        }).select('_id title');

        if (vacancies.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'Geen vacatures met embedding gevonden',
                total: 0,
            });
        }

        const total = vacancies.length;
        const progress: MatchAllProgress = {
            active: true,
            current: 0,
            total,
            currentTitle: '',
            failed: 0,
            suggestionsTotal: 0,
            startedAt: new Date(),
        };
        await persistProgress(progress);

        after(async () => {
            for (const v of vacancies) {
                progress.currentTitle = v.title || 'Onbekend';
                try {
                    const result = await runAutoMatchForVacancy(String(v._id));
                    progress.suggestionsTotal += result.suggestionsCreated || 0;
                    progress.current++;
                    console.log(`Match ${progress.current}/${total}: ${v.title} → ${result.suggestionsCreated} suggesties`);
                } catch (err) {
                    progress.failed++;
                    progress.current++;
                    console.error(`Match faalde voor ${v.title}:`, err instanceof Error ? err.message : err);
                }
                await persistProgress(progress);
            }
            progress.active = false;
            await persistProgress(progress);
            console.log(`Match-all klaar: ${progress.current - progress.failed} ok, ${progress.failed} failed, ${progress.suggestionsTotal} suggesties totaal`);
        });

        return NextResponse.json({
            success: true,
            message: `Match-batch gestart voor ${total} vacatures`,
            total,
        });
    } catch (err) {
        console.error('Error starting match-all:', err);
        return NextResponse.json({ success: false, message: 'Failed to start' }, { status: 500 });
    }
}
