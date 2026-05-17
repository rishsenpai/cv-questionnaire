// Batch-genereer embeddings voor alle vacatures zonder embedding.
// Spiegelt /api/admin/generate-embeddings (CV-versie), met dezelfde
// SyncState-progress sleutel 'embedding:vacancy-progress'.

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Vacancy from '@/models/Vacancy';
import SyncState from '@/models/SyncState';
import { requireAdmin } from '@/lib/server/auth';
import { generateEmbedding } from '@/lib/server/embeddings';

export const maxDuration = 300;

interface VacancyEmbeddingProgress {
    active: boolean;
    current: number;
    total: number;
    currentTitle: string;
    failed: number;
    startedAt: Date;
}

async function persistProgress(progress: VacancyEmbeddingProgress): Promise<void> {
    try {
        await SyncState.findOneAndUpdate(
            { key: 'embedding:vacancy-progress' },
            { value: progress },
            { upsert: true, new: true },
        );
    } catch (err) {
        console.error('persistProgress (vacancy) error:', err instanceof Error ? err.message : err);
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
        const vacanciesWithout = await Vacancy.find({
            $or: [
                { embedding: { $exists: false } },
                { embedding: { $size: 0 } },
                { embedding: null },
            ],
        }).select('_id title description requirements');

        if (vacanciesWithout.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'Alle vacatures hebben al embeddings',
                processed: 0,
                total: 0,
            });
        }

        const total = vacanciesWithout.length;
        const progress: VacancyEmbeddingProgress = {
            active: true,
            current: 0,
            total,
            currentTitle: '',
            failed: 0,
            startedAt: new Date(),
        };
        await persistProgress(progress);

        // Background processing — server returnt direct, werk gaat door tot maxDuration.
        (async () => {
            for (const v of vacanciesWithout) {
                progress.currentTitle = v.title || 'Onbekend';
                try {
                    const text = `${v.title || ''}\n${v.description || ''}\n${v.requirements || ''}`;
                    if (text.trim().length >= 10) {
                        const embedding = await generateEmbedding(text);
                        await Vacancy.findByIdAndUpdate(v._id, { embedding });
                        progress.current++;
                        console.log(`Vacancy embedding ${progress.current}/${total}: ${v.title}`);
                    } else {
                        progress.current++;
                        progress.failed++;
                        console.log(`Skipped (insufficient text): ${v.title}`);
                    }
                    await new Promise(resolve => setTimeout(resolve, 200));
                } catch (err) {
                    progress.failed++;
                    progress.current++;
                    console.error(`Failed vacancy embedding for ${v.title}:`, err instanceof Error ? err.message : err);
                }
                await persistProgress(progress);
            }
            progress.active = false;
            await persistProgress(progress);
            console.log(`Vacancy embedding done: ${progress.current - progress.failed} ok, ${progress.failed} failed`);
        })();

        return NextResponse.json({
            success: true,
            message: `Embedding-generatie gestart voor ${total} vacatures`,
            processing: total,
        });
    } catch (err) {
        console.error('Error starting vacancy embedding generation:', err);
        return NextResponse.json({ success: false, message: 'Failed to start' }, { status: 500 });
    }
}
