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
import { cosineSimilarity, prepareCVText } from '@/lib/server/embeddings';
import { rerank, isRerankConfigured } from '@/lib/server/rerank';
import { bm25SearchCVs, hybridFuse, type RankedDoc } from '@/lib/server/hybridMatch';

export const maxDuration = 300;

const EMBEDDING_THRESHOLD = 0.20;
const TOP_N = 25;
const RERANK_INPUT_SIZE = 50;
const RECALL_SIZE = 100;
const RERANK_THRESHOLD = 0.10;

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
        // Optioneel land-filter: 'guyana' | 'netherlands' | 'suriname'.
        // Wanneer gezet beperken we BEIDE kanten van de match (vacatures én CVs)
        // tot dat land — een NL-CV mag niet als kandidaat verschijnen bij een
        // Guyana-vacature.
        const url = new URL(req.url);
        const countryParam = url.searchParams.get('country');
        const country = countryParam && ['guyana', 'netherlands', 'suriname'].includes(countryParam)
            ? countryParam
            : null;

        // Embedding meeladen — we hebben 'm in de batch nodig zonder per-vacature roundtrip.
        const vacancyQuery: Record<string, unknown> = {
            embedding: { $exists: true, $not: { $size: 0 } },
            isActive: true,
        };
        if (country) vacancyQuery.country = country;
        const vacancies = await Vacancy.find(vacancyQuery)
            .select({ embedding: 1, _id: 1, title: 1, employerId: 1, description: 1, requirements: 1 })
            .lean();

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
            const cvQuery: Record<string, unknown> = {
                embedding: { $exists: true, $ne: [] },
                isInternal: { $ne: true },
            };
            if (country) cvQuery.country = country;
            const cvs = await CV.find(cvQuery).select({ embedding: 1, _id: 1 }).lean();
            const cvsWithEmb = cvs.filter(c => {
                const e = (c as unknown as { embedding?: number[] }).embedding;
                return Array.isArray(e) && e.length > 0;
            });
            console.log(`Match-all: ${cvs.length} CVs uit DB, ${cvsWithEmb.length} hebben daadwerkelijk embedding (na select +embedding)`);

            const vacanciesWithEmb = vacancies.filter(v => {
                const e = (v as unknown as { embedding?: number[] }).embedding;
                return Array.isArray(e) && e.length > 0;
            });
            console.log(`Match-all: ${vacancies.length} vacatures uit DB, ${vacanciesWithEmb.length} hebben daadwerkelijk embedding`);

            for (let i = 0; i < vacancies.length; i++) {
                const v = vacancies[i];
                progress.currentTitle = v.title || 'Onbekend';
                try {
                    const vEmb = (v as unknown as { embedding?: number[] }).embedding;
                    if (!vEmb || vEmb.length === 0) {
                        if (i < 3) console.log(`Match ${i + 1}: vacature ${v.title} HEEFT GEEN embedding (probably select issue)`);
                        progress.current++;
                        continue;
                    }

                    // Fase 1a: cosine over in-memory CV-pool.
                    const cosineScored: Array<{ cvId: string; score: number }> = [];
                    for (const cv of cvsWithEmb) {
                        const cvEmb = (cv as unknown as { embedding?: number[] }).embedding!;
                        const sim = cosineSimilarity(vEmb, cvEmb);
                        if (sim >= EMBEDDING_THRESHOLD) {
                            cosineScored.push({ cvId: String(cv._id), score: Math.round(sim * 100) });
                        }
                    }
                    cosineScored.sort((a, b) => b.score - a.score);
                    const cosineRanking: RankedDoc[] = cosineScored.slice(0, RECALL_SIZE).map(s => ({ id: s.cvId, score: s.score }));

                    // Fase 1b: BM25 keyword search.
                    const vacancyTextFull = [v.title, (v as { description?: string }).description, (v as { requirements?: string }).requirements]
                        .filter(Boolean).join(' ');
                    const bm25Ranking = await bm25SearchCVs(vacancyTextFull, RECALL_SIZE, {
                        embedding: { $exists: true, $ne: [] },
                        isInternal: { $ne: true },
                    });

                    // Fase 2: RRF fusie → top-50.
                    const fusedPool = hybridFuse(cosineRanking, bm25Ranking, RERANK_INPUT_SIZE);
                    const cosineMap = new Map(cosineScored.map(s => [s.cvId, s.score]));
                    const rerankPool: Array<{ cvId: string; score: number }> = fusedPool.map(d => ({
                        cvId: d.id,
                        score: cosineMap.get(d.id) ?? 50,
                    }));

                    // Fase 3: rerank top-50 met Cohere; bij fail fallback op fused volgorde.
                    let top = rerankPool.slice(0, TOP_N);
                    if (isRerankConfigured() && rerankPool.length > 0) {
                        const cvIds = rerankPool.map(p => new Types.ObjectId(p.cvId));
                        const cvTexts = await CV.find({ _id: { $in: cvIds } })
                            .select('_id jobTitle skills experience education languages summary')
                            .lean();
                        const textMap = new Map<string, string>();
                        for (const cv of cvTexts) textMap.set(String(cv._id), prepareCVText(cv));
                        const docs = rerankPool
                            .map(p => ({ id: p.cvId, text: textMap.get(p.cvId) || '' }))
                            .filter(d => d.text.length > 0);
                        const reranked = await rerank(vacancyTextFull, docs, TOP_N);
                        if (reranked) {
                            top = reranked
                                .filter(r => r.relevanceScore >= RERANK_THRESHOLD)
                                .map(r => ({ cvId: r.id, score: Math.round(r.relevanceScore * 100) }));
                        }
                    }

                    if (i < 3) console.log(`Match ${i + 1} (${v.title}): cosine=${cosineScored.length} bm25=${bm25Ranking.length} fused=${fusedPool.length} final=${top.length}`);

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
                        const matchedCount = res.matchedCount || 0;
                        progress.suggestionsTotal += insertedCount;
                        if (i < 3) console.log(`Match ${i + 1} bulkWrite: ${insertedCount} new, ${matchedCount} matched-existing`);
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
