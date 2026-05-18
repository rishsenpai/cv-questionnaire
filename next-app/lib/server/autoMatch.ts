// Auto-matcher voor net-aangemaakte werkgever-vacatures.
// Wordt fire-and-forget aangeroepen vanuit /api/employer/vacancies POST.
//
// Gebruikt altijd OpenAI embeddings (text-embedding-3-small) + cosineSimilarity.
// Schrijft top-N (default 10) als CuratedMatch met status 'suggested':
// onzichtbaar voor werkgever, admin promoot ze handmatig naar 'presented'.

import { Types } from 'mongoose';
import CV from '@/models/CV';
import Vacancy from '@/models/Vacancy';
import CuratedMatch from '@/models/CuratedMatch';
import { cosineSimilarity, generateEmbedding } from './embeddings';

// Lage drempel (20%) filtert pure ruis maar laat alle plausibele matches door.
// TOP_N cap voorkomt dat we duizenden suggesties opslaan; admin ziet de
// hoogste 25 op score gesorteerd.
const TOP_N = 25;
const EMBEDDING_THRESHOLD = 0.20;

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
    const vacancy = await Vacancy.findById(vacancyId).select('+embedding country');
    if (!vacancy) {
        return { method: 'skipped', suggestionsCreated: 0, candidatesScanned: 0, reason: 'vacancy not found' };
    }
    // employerId is optioneel: voor admin/internal vacatures slaan we suggesties
    // op zonder werkgever-eigenaar (admin is dan zelf de "ontvanger").
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

    // Wanneer de vacature een land heeft, scopen we kandidaten tot hetzelfde
    // land. Zonder country op de vacancy matchen we breed (legacy gedrag).
    const cvQuery: Record<string, unknown> = {
        embedding: { $exists: true, $ne: [] },
        isInternal: { $ne: true },
    };
    if (vacancy.country) cvQuery.country = vacancy.country;
    const cvs = await CV.find(cvQuery).select({ embedding: 1, _id: 1 }).lean();

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
    // bulkWrite met upsert is idempotent: nieuwe pairs worden geïnsert,
    // bestaande (vacancyId+cvId) krijgen een score-update zonder dup-key error.
    // Per-doc try/catch + console.error zodat eventuele schema/cast/validation
    // problemen zichtbaar zijn in Vercel logs i.p.v. stil 0 te retourneren.
    const vacancyObjectId = vacancy._id as Types.ObjectId;
    const employerObjectId = vacancy.employerId as Types.ObjectId | undefined;
    let upserted = 0;
    let modified = 0;
    const errors: string[] = [];
    for (const t of top) {
        let cvObjectId: Types.ObjectId;
        try {
            cvObjectId = new Types.ObjectId(t.cvId);
        } catch (err) {
            errors.push(`invalid cvId ${t.cvId}: ${err instanceof Error ? err.message : String(err)}`);
            continue;
        }
        try {
            const res = await CuratedMatch.updateOne(
                { vacancyId: vacancyObjectId, cvId: cvObjectId },
                {
                    $setOnInsert: {
                        vacancyId: vacancyObjectId,
                        cvId: cvObjectId,
                        ...(employerObjectId ? { employerId: employerObjectId } : {}),
                        status: 'suggested',
                        source: 'auto-embedding',
                        addedAt: new Date(),
                    },
                    $set: { matchScore: t.score },
                },
                { upsert: true },
            );
            if (res.upsertedCount > 0) upserted++;
            else if (res.modifiedCount > 0) modified++;
        } catch (err) {
            errors.push(err instanceof Error ? err.message : String(err));
        }
    }
    if (errors.length > 0) {
        console.error(`persistSuggestions errors for vacancy ${String(vacancyObjectId)}: ${errors.length} failed (${errors.slice(0, 3).join(' | ')})`);
    }
    console.log(`persistSuggestions vacancy ${String(vacancyObjectId)}: ${upserted} new + ${modified} updated (of ${top.length} candidates, ${errors.length} errors)`);
    return upserted;
}
