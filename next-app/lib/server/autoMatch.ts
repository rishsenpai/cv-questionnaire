// Auto-matcher voor net-aangemaakte werkgever-vacatures.
// Wordt fire-and-forget aangeroepen vanuit /api/employer/vacancies POST.
//
// Gebruikt altijd OpenAI embeddings (text-embedding-3-small) + cosineSimilarity.
// Schrijft top-N (default 10) als CuratedMatch met status 'suggested':
// onzichtbaar voor werkgever, admin promoot ze handmatig naar 'presented'.

import CV from '@/models/CV';
import Vacancy from '@/models/Vacancy';
import CuratedMatch from '@/models/CuratedMatch';
import { cosineSimilarity, generateEmbedding } from './embeddings';

const TOP_N = 10;
const EMBEDDING_THRESHOLD = 0.55; // 55% cosine similarity ondergrens

export interface AutoMatchResult {
    method: 'embedding' | 'skipped';
    suggestionsCreated: number;
    candidatesScanned: number;
    reason?: string;
}

interface VacancyDoc {
    _id: unknown;
    employerId?: unknown;
    title?: string;
    description?: string;
    requirements?: string;
    fullText?: string;
    embedding?: number[];
}

export async function runAutoMatchForVacancy(vacancyId: string): Promise<AutoMatchResult> {
    const vacancy = await Vacancy.findById(vacancyId).select('+embedding');
    if (!vacancy || !vacancy.employerId) {
        return { method: 'skipped', suggestionsCreated: 0, candidatesScanned: 0, reason: 'no vacancy or no employer' };
    }
    if (!process.env.OPENAI_API_KEY && process.env.NODE_ENV !== 'test') {
        return { method: 'skipped', suggestionsCreated: 0, candidatesScanned: 0, reason: 'OPENAI_API_KEY missing' };
    }

    // Skip CVs die al gekoppeld zijn aan deze vacature
    const alreadyLinked = await CuratedMatch.find({ vacancyId }).distinct('cvId');
    const excludeSet = new Set(alreadyLinked.map(String));

    let vacEmbedding = vacancy.embedding;
    if (!vacEmbedding || vacEmbedding.length === 0) {
        const text = `${vacancy.title || ''}\n${vacancy.description || ''}\n${vacancy.requirements || ''}`;
        if (text.trim().length < 10) {
            return { method: 'skipped', suggestionsCreated: 0, candidatesScanned: 0, reason: 'vacancy text too short' };
        }
        vacEmbedding = await generateEmbedding(text);
        await Vacancy.findByIdAndUpdate(vacancy._id, { embedding: vacEmbedding });
    }

    const cvs = await CV.find({
        embedding: { $exists: true, $ne: [] },
        isInternal: { $ne: true },
    }).select('+embedding _id').lean();

    const scored: Array<{ cvId: string; score: number }> = [];
    for (const cv of cvs) {
        const cvId = String(cv._id);
        if (excludeSet.has(cvId)) continue;
        const cvEmb = (cv as unknown as { embedding?: number[] }).embedding;
        if (!cvEmb || cvEmb.length === 0) continue;
        const sim = cosineSimilarity(vacEmbedding, cvEmb);
        if (sim >= EMBEDDING_THRESHOLD) {
            scored.push({ cvId, score: Math.round(sim * 100) });
        }
    }
    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, TOP_N);

    const created = await persistSuggestions(vacancy as VacancyDoc, top);
    return { method: 'embedding', suggestionsCreated: created, candidatesScanned: cvs.length };
}

async function persistSuggestions(
    vacancy: VacancyDoc,
    top: Array<{ cvId: string; score: number }>,
): Promise<number> {
    if (top.length === 0) return 0;
    const docs = top.map(t => ({
        vacancyId: vacancy._id,
        cvId: t.cvId,
        employerId: vacancy.employerId,
        status: 'suggested' as const,
        source: 'auto-embedding' as const,
        matchScore: t.score,
        addedAt: new Date(),
    }));
    try {
        // ordered:false zodat één dup-key niet de hele insert blokkeert
        const res = await CuratedMatch.insertMany(docs, { ordered: false });
        return res.length;
    } catch (err) {
        const e = err as { insertedDocs?: unknown[] };
        return Array.isArray(e.insertedDocs) ? e.insertedDocs.length : 0;
    }
}
