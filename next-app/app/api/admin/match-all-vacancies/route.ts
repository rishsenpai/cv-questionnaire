// Batch: matcht alle vacatures met embedding tegen alle CVs met embedding.
// Geoptimaliseerd: laadt CVs en bestaande CuratedMatch pairs één keer
// in geheugen, gebruikt per vacature één bulkWrite met upserts i.p.v. 25
// losse updateOne's. Past binnen 300s voor honderden vacatures.
//
// Progress in SyncState onder key 'match:vacancy-progress'. Gebruikt
// after() zodat Vercel Fluid Compute het werk doorlaat lopen tot maxDuration.

import { NextRequest, NextResponse, after } from 'next/server';
import { Types } from 'mongoose';
import { connectDB } from '@/lib/db';
import Vacancy from '@/models/Vacancy';
import CV from '@/models/CV';
import CuratedMatch from '@/models/CuratedMatch';
import SyncState from '@/models/SyncState';
import { requireAdmin } from '@/lib/server/auth';
import { cosineSimilarity } from '@/lib/server/embeddings';

export const maxDuration = 300;

const EMBEDDING_THRESHOLD = 0.20;
const TOP_N = 25;

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
        // Embedding meeladen — we hebben 'm in de batch nodig zonder per-vacature roundtrip.
        const vacancies = await Vacancy.find({
            embedding: { $exists: true, $not: { $size: 0 } },
        }).select('+embedding _id title employerId').lean();

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
            // Laad CVs één keer — voorkomt 361 × CV-fetch.
            const cvs = await CV.find({
                embedding: { $exists: true, $ne: [] },
                isInternal: { $ne: true },
            }).select('+embedding _id').lean();
            console.log(`Match-all: ${cvs.length} CVs ingeladen voor ${total} vacatures`);

            // Laad bestaande (vacancyId, cvId) pairs één keer voor exclude-set.
            // Map: vacancyIdHex -> Set<cvIdHex>
            const existingByVacancy = new Map<string, Set<string>>();
            const existingRaw = await CuratedMatch.find({}).select('vacancyId cvId').lean();
            for (const m of existingRaw) {
                const vKey = String(m.vacancyId);
                const cKey = String(m.cvId);
                if (!existingByVacancy.has(vKey)) existingByVacancy.set(vKey, new Set());
                existingByVacancy.get(vKey)!.add(cKey);
            }
            console.log(`Match-all: ${existingRaw.length} bestaande CuratedMatch records geladen`);

            for (let i = 0; i < vacancies.length; i++) {
                const v = vacancies[i];
                const vIdStr = String(v._id);
                progress.currentTitle = v.title || 'Onbekend';
                try {
                    const vEmb = (v as unknown as { embedding?: number[] }).embedding;
                    if (!vEmb || vEmb.length === 0) {
                        progress.current++;
                        continue;
                    }
                    const excludeSet = existingByVacancy.get(vIdStr) || new Set<string>();

                    const scored: Array<{ cvId: string; score: number }> = [];
                    for (const cv of cvs) {
                        const cvIdStr = String(cv._id);
                        if (excludeSet.has(cvIdStr)) continue;
                        const cvEmb = (cv as unknown as { embedding?: number[] }).embedding;
                        if (!cvEmb || cvEmb.length === 0) continue;
                        const sim = cosineSimilarity(vEmb, cvEmb);
                        if (sim >= EMBEDDING_THRESHOLD) {
                            scored.push({ cvId: cvIdStr, score: Math.round(sim * 100) });
                        }
                    }
                    scored.sort((a, b) => b.score - a.score);
                    const top = scored.slice(0, TOP_N);

                    if (top.length > 0) {
                        const vacancyObjectId = v._id as Types.ObjectId;
                        const employerObjectId = (v as { employerId?: Types.ObjectId }).employerId;
                        const ops = top.map(t => ({
                            updateOne: {
                                filter: { vacancyId: vacancyObjectId, cvId: new Types.ObjectId(t.cvId) },
                                update: {
                                    $setOnInsert: {
                                        vacancyId: vacancyObjectId,
                                        cvId: new Types.ObjectId(t.cvId),
                                        ...(employerObjectId ? { employerId: employerObjectId } : {}),
                                        status: 'suggested' as const,
                                        source: 'auto-embedding' as const,
                                        addedAt: new Date(),
                                    },
                                    $set: { matchScore: t.score },
                                },
                                upsert: true,
                            },
                        }));
                        const res = await CuratedMatch.bulkWrite(ops, { ordered: false });
                        const insertedCount = res.upsertedCount || 0;
                        progress.suggestionsTotal += insertedCount;
                    }
                    progress.current++;
                } catch (err) {
                    progress.failed++;
                    progress.current++;
                    console.error(`Match faalde voor ${v.title}:`, err instanceof Error ? err.message : err);
                }
                // Persist progress elke 5 vacatures (i.p.v. elke 1) — minder DB roundtrips.
                if (progress.current % 5 === 0 || progress.current === total) {
                    await persistProgress(progress);
                }
            }
            progress.active = false;
            await persistProgress(progress);
            console.log(`Match-all klaar: ${progress.current - progress.failed} ok, ${progress.failed} failed, ${progress.suggestionsTotal} nieuwe suggesties`);
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
