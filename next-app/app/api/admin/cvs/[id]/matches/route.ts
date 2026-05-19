import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import CV from '@/models/CV';
import Vacancy from '@/models/Vacancy';
import { requireAdmin } from '@/lib/server/auth';
import { sanitizeJobText } from '@/lib/server/sanitizeJobText';
import {
    cosineSimilarity,
    generateEmbedding,
    generateTextHash,
    prepareCVText,
} from '@/lib/server/embeddings';
import { rerank, isRerankConfigured } from '@/lib/server/rerank';
import { bm25SearchVacancies, hybridFuse, type RankedDoc } from '@/lib/server/hybridMatch';

export const maxDuration = 60;

const RERANK_INPUT_SIZE = 50;
const RECALL_SIZE = 100;
const RERANK_THRESHOLD = 0.10;
const FINAL_TOP_N = 20;

interface Params {
    params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
    const unauth = await requireAdmin(req);
    if (unauth) return unauth;

    if (!process.env.OPENAI_API_KEY && process.env.NODE_ENV !== 'test') {
        return NextResponse.json({ success: false, message: 'OPENAI_API_KEY niet geconfigureerd' }, { status: 503 });
    }

    try {
        const { id } = await params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ success: false, message: 'Invalid CV id' }, { status: 400 });
        }
        await connectDB();
        const cv = await CV.findById(id).select('+embedding');
        if (!cv) {
            return NextResponse.json({ success: false, message: 'CV niet gevonden' }, { status: 404 });
        }

        let cvEmbedding = cv.embedding;
        if (!cvEmbedding || cvEmbedding.length === 0) {
            const textToEmbed = prepareCVText(cv);
            if (!textToEmbed || textToEmbed.trim().length < 50) {
                return NextResponse.json({ success: false, message: 'CV heeft te weinig tekst voor matching' }, { status: 400 });
            }
            const textHash = generateTextHash(textToEmbed);
            cvEmbedding = await generateEmbedding(textToEmbed);
            await CV.findByIdAndUpdate(cv._id, { embedding: cvEmbedding, textHash });
        }

        // Optioneel land-filter: 'guyana' | 'netherlands' | 'suriname'.
        // Default ongefilterd, maar admin-UI stuurt meestal CV's eigen land
        // mee zodat een NL-CV niet als kandidaat verschijnt bij Guyana-jobs.
        const url = new URL(req.url);
        const countryParam = url.searchParams.get('country');
        const country = countryParam && ['guyana', 'netherlands', 'suriname'].includes(countryParam)
            ? countryParam
            : null;

        const vacancyQuery: Record<string, unknown> = {
            isActive: true,
            fulfilledAt: null,
            embedding: { $exists: true, $ne: [] },
        };
        if (country) vacancyQuery.country = country;
        const vacancies = await Vacancy.find(vacancyQuery).select('+embedding -fileData');

        // Fase 1a: cosine-recall over alle vacatures.
        const scored = vacancies.map(vacancy => {
            const score = cosineSimilarity(cvEmbedding!, vacancy.embedding!);
            const obj = vacancy.toObject() as unknown as Record<string, unknown>;
            delete obj.embedding;
            obj.description = sanitizeJobText(vacancy.description, vacancy.company);
            obj.requirements = sanitizeJobText(vacancy.requirements, vacancy.company);
            return {
                ...obj,
                _vid: String(vacancy._id),
                cosineScore: Math.round(score * 100),
            };
        }).sort((a, b) => b.cosineScore - a.cosineScore);
        const cosineRanking: RankedDoc[] = scored.slice(0, RECALL_SIZE).map(v => ({ id: v._vid, score: v.cosineScore }));

        // Fase 1b: BM25 keyword search met CV-tekst als query.
        const cvText = prepareCVText(cv);
        const bm25Filter: Record<string, unknown> = {
            isActive: true,
            embedding: { $exists: true, $ne: [] },
        };
        if (country) bm25Filter.country = country;
        const bm25Ranking = await bm25SearchVacancies(cvText, RECALL_SIZE, bm25Filter);

        // Fase 2: RRF fusie → top-RERANK_INPUT_SIZE.
        const fusedTop = hybridFuse(cosineRanking, bm25Ranking, RERANK_INPUT_SIZE);
        const fusedIdSet = new Set(fusedTop.map(d => d.id));
        const fusedOrder = new Map(fusedTop.map((d, idx) => [d.id, idx]));
        const rerankPool = scored
            .filter(v => fusedIdSet.has(v._vid))
            .sort((a, b) => (fusedOrder.get(a._vid) ?? 999) - (fusedOrder.get(b._vid) ?? 999));
        let ranked: Array<typeof scored[number] & { matchScore: number; matchType: string }>;

        if (isRerankConfigured() && rerankPool.length > 0) {
            const cvText = prepareCVText(cv);
            const docs = rerankPool.map(v => {
                const r = v as Record<string, unknown>;
                return {
                    id: v._vid,
                    text: [r.title, r.description, r.requirements].filter(Boolean).join('\n\n'),
                };
            });
            const rr = await rerank(cvText, docs, FINAL_TOP_N);
            if (rr) {
                const rrMap = new Map(rr.map(r => [r.id, r.relevanceScore]));
                ranked = rerankPool
                    .filter(v => rrMap.has(v._vid))
                    .map(v => ({
                        ...v,
                        matchScore: Math.round((rrMap.get(v._vid)! ) * 100),
                        matchType: 'AI Rerank',
                    }))
                    .filter(v => v.matchScore >= Math.round(RERANK_THRESHOLD * 100))
                    .sort((a, b) => b.matchScore - a.matchScore);
            } else {
                // Rerank API kapot → terugvallen op cosine
                ranked = scored
                    .filter(v => v.cosineScore >= 30)
                    .slice(0, FINAL_TOP_N)
                    .map(v => ({ ...v, matchScore: v.cosineScore, matchType: 'AI Semantic' }));
            }
        } else {
            ranked = scored
                .filter(v => v.cosineScore >= 30)
                .slice(0, FINAL_TOP_N)
                .map(v => ({ ...v, matchScore: v.cosineScore, matchType: 'AI Semantic' }));
        }

        return NextResponse.json({
            success: true,
            cv: { _id: cv._id, fullName: cv.fullName, jobTitle: cv.jobTitle, location: cv.location },
            totalVacancies: vacancies.length,
            matches: ranked,
        });
    } catch (err) {
        console.error('admin cvs/[id]/matches error:', err);
        return NextResponse.json({ success: false, message: 'Matching mislukt' }, { status: 500 });
    }
}
