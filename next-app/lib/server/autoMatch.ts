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
import { cosineSimilarity, generateEmbedding, prepareCVText } from './embeddings';
import { rerank, isRerankConfigured } from './rerank';

// Twee-fase pipeline:
//   1. Embedding cosine → recall: pak top-RERANK_INPUT_SIZE kandidaten (50)
//   2. Cohere rerank   → precisie: pak top-TOP_N (25) op relevance-score
// Drempel 0.20 voor cosine om volledige ruis (cosine < 20%) te skippen.
// Drempel 0.10 op rerank-score om CVs die het rerank-model als 'totaal
// irrelevant' bestempelt te dumpen — voorkomt dat we 25 trash-suggesties
// opslaan als de query weinig goede matches heeft.
const TOP_N = 25;
const RERANK_INPUT_SIZE = 50;
const EMBEDDING_THRESHOLD = 0.20;
const RERANK_THRESHOLD = 0.10;

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

interface RunAutoMatchOptions {
    // Override de country-scope (standaard = vacancy.country). Met
    // 'guyana' | 'netherlands' | 'suriname' forceer je dat land;
    // met undefined valt 't terug op vacancy.country.
    countryOverride?: 'guyana' | 'netherlands' | 'suriname';
}

export async function runAutoMatchForVacancy(
    vacancyId: string,
    options: RunAutoMatchOptions = {},
): Promise<AutoMatchResult> {
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

    // Scope-bepaling: explicit override wint van vacancy.country.
    // Zonder beide matchen we breed (legacy gedrag).
    const scopeCountry = options.countryOverride || vacancy.country;
    const cvQuery: Record<string, unknown> = {
        embedding: { $exists: true, $ne: [] },
        isInternal: { $ne: true },
    };
    if (scopeCountry) cvQuery.country = scopeCountry;
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

    // Fase 2: rerank top-RERANK_INPUT_SIZE met Cohere als de key geconfigureerd is.
    // Bij ontbrekende key of API-fout vallen we terug op de embedding-volgorde.
    const rerankPool = scored.slice(0, RERANK_INPUT_SIZE);
    const top = await rerankCandidates(vacancy, rerankPool) ?? scored.slice(0, TOP_N);

    const created = await persistSuggestions(vacancy as VacancyDoc, top);
    return { method: 'embedding', suggestionsCreated: created, candidatesScanned: cvs.length };
}

// Tweede-fase reranking: query = vacancy-tekst, docs = CV-tekst.
// Retourneert null als rerank niet beschikbaar is zodat caller terugvalt.
async function rerankCandidates(
    vacancy: { title?: string; description?: string; requirements?: string },
    pool: Array<{ cvId: string; score: number }>,
): Promise<Array<{ cvId: string; score: number }> | null> {
    if (!isRerankConfigured() || pool.length === 0) return null;

    // Tekst van de top-50 CVs ophalen (alleen text-velden, geen embedding).
    const cvIds = pool.map(p => new Types.ObjectId(p.cvId));
    const cvTexts = await CV.find({ _id: { $in: cvIds } })
        .select('_id jobTitle skills experience education languages summary')
        .lean();
    const textMap = new Map<string, string>();
    for (const cv of cvTexts) {
        textMap.set(String(cv._id), prepareCVText(cv));
    }
    const docs = pool
        .map(p => ({ id: p.cvId, text: textMap.get(p.cvId) || '' }))
        .filter(d => d.text.length > 0);
    if (docs.length === 0) return null;

    const vacancyText = [vacancy.title, vacancy.description, vacancy.requirements]
        .filter(Boolean)
        .join('\n\n');
    const reranked = await rerank(vacancyText, docs, TOP_N);
    if (!reranked) return null;

    return reranked
        .filter(r => r.relevanceScore >= RERANK_THRESHOLD)
        .map(r => ({ cvId: r.id, score: Math.round(r.relevanceScore * 100) }));
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
